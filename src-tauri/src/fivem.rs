use serde::Serialize;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant, SystemTime};
use sysinfo::System;
use tauri::{AppHandle, Emitter};

const LAUNCH_STATUS_EVENT: &str = "fivem-launch-status";
const LAUNCH_DETAIL_EVENT: &str = "fivem-launch-detail";
const POLL_INTERVAL: Duration = Duration::from_millis(500);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(45);
/// Logged right as the client finishes its initial handshake with the
/// server and starts actually loading in — this is also the moment
/// server-authored loading-screen resources (e.g. a custom branded one)
/// start rendering (`LoadScreenFuncs::OnEnd` hooks begin firing in the very
/// next lines). We want the window visible *by* this point: hiding it any
/// longer means the player's own loading screen never gets shown at all,
/// just a blank wait with no feedback until the game is fully ready.
const LOADING_SCREEN_MARKER: &str = "triggering initial game load";
/// The exact log line FiveM prints once every server resource's scripts
/// have finished their startup routines — observed, in a real completed
/// connection, to land right as the player actually spawns into the world
/// (immediately followed by Mumble voice connecting). Used only to clear
/// our own "loading" status text at this point — window visibility is
/// already handled by `LOADING_SCREEN_MARKER` well before this.
///
/// We tried inferring "done" from the log simply going quiet for a few
/// seconds instead of matching an exact line, which seemed reasonable but
/// turned out to false-positive: real multi-second gaps happen mid-loading
/// (observed a 3.7s gap well before the game was actually ready).
const SCRIPTS_READY_MARKER: &str = "Script initialization finished.";
/// Hard ceiling from the game process appearing to us revealing it
/// regardless of log content, so nothing can stay hidden forever if
/// `LOADING_SCREEN_MARKER` never appears (e.g. a future FiveM update
/// changes its wording).
const REVEAL_TIMEOUT: Duration = Duration::from_secs(45);
/// Same idea, but for how long we'll keep showing our own "loading" status
/// after the game window is already visible, in case `SCRIPTS_READY_MARKER`
/// never appears — the player can clearly see they're in by then regardless.
const IN_SERVER_TIMEOUT: Duration = Duration::from_secs(180);

/// Mirrors the stages we can actually observe from FiveM's process tree
/// and log. Serializes as a bare lowerCamelCase string (e.g.
/// `"connectingToRos"`), which the frontend listens for on the
/// `fivem-launch-status` event.
#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum LaunchStage {
    /// The bootstrapper (`FiveM.exe` / `FiveM_ROSLauncher`) appeared.
    Starting,
    /// `FiveM_ROSService` appeared — this is the "CONNECTING TO ROCKSTAR
    /// GAMES SERVICES" screen.
    ConnectingToRos,
    /// The game process (`FiveM_<hash>_GTAProcess`) appeared and is
    /// downloading/verifying resources (window kept hidden — see
    /// `is_hide_target` below).
    Running,
    /// The game's own (possibly custom/branded) loading screen is now live
    /// — we've revealed the game window so the player sees it instead of
    /// nothing.
    LoadingScreen,
    /// Server resource scripts finished starting (or we hit
    /// `IN_SERVER_TIMEOUT`) — the player should be in now.
    InServer,
    /// Every FiveM-related process we'd seen disappeared again before the
    /// game process ever showed up (e.g. the legitimacy check rejected it).
    Failed,
    /// Nothing reached `Running` within `CONNECT_TIMEOUT`.
    TimedOut,
}

/// Launches the FiveM client by relaying the `fivem://connect/...` URI
/// through `explorer.exe`, so the OS's persistent shell process ends up as
/// FiveM's actual parent.
///
/// FiveM's bootstrapper ("adhesive") checks its parent process and refuses
/// to start otherwise ("This application should be launched directly from
/// the shell or a web browser."). This rejects *any* direct invocation from
/// our own process, regardless of which Win32 API performs it. Running
/// `explorer.exe <uri>` doesn't execute the protocol handler itself: a new
/// `explorer.exe` process starts only to hand the request off (via IPC) to
/// Windows' single already-running shell process, which then performs the
/// actual launch and exits the helper — so the resulting FiveM process's
/// parent is genuinely `explorer.exe`, satisfying the check.
///
/// Since FiveM ends up as a grandchild of `explorer.exe` rather than our own
/// child, we have no process handle to watch directly — so a background
/// thread polls the system process list instead, emits `LaunchStage`
/// updates on the `fivem-launch-status` event as it recognizes FiveM's own
/// component processes appearing, tails FiveM's own per-session log file
/// for detailed progress text (`fivem-launch-detail`), and keeps FiveM's
/// own windows hidden — splash *and*, briefly, the game window itself —
/// while our launcher stays up showing that progress. The game window is
/// revealed as soon as its own (possibly custom/branded) loading screen
/// goes live (see `LOADING_SCREEN_MARKER`), not held hidden through the
/// rest of loading. Our own window is never touched.
///
/// `fivem_path` is only used to sanity-check the configured install exists
/// before firing the URI; the actual launch goes through whatever the OS
/// has `fivem://` registered to (confirmed via
/// `HKEY_CLASSES_ROOT\fivem\shell\open\command` to be this same install).
#[tauri::command]
pub fn launch_fivem(app: AppHandle, fivem_path: String, connect_target: String) -> Result<(), String> {
    let exe = PathBuf::from(&fivem_path).join("FiveM.exe");
    if !exe.exists() {
        return Err(format!("FiveM.exe not found at {}", exe.display()));
    }

    let launched_at = SystemTime::now();
    let uri = format!("fivem://connect/{connect_target}");
    Command::new("explorer.exe")
        .arg(&uri)
        .spawn()
        .map_err(|e| e.to_string())?;

    std::thread::spawn(move || watch_launch(app, fivem_path, launched_at));
    Ok(())
}

fn emit_stage(app: &AppHandle, stage: LaunchStage) {
    let _ = app.emit(LAUNCH_STATUS_EVENT, stage);
}

fn emit_detail(app: &AppHandle, detail: &str) {
    let _ = app.emit(LAUNCH_DETAIL_EVENT, detail);
}

/// Whether a (lowercased) process name is one of FiveM's own windows we're
/// currently allowed to hide: the bootstrapper/splash always, and the game
/// process itself only before its loading screen has gone live (see
/// `LOADING_SCREEN_MARKER`) — past that point the game's own window is what
/// the player should be looking at. Deliberately excludes `FiveM_ROSService`
/// (talks to Rockstar's backend — if it ever needs a Social Club sign-in or
/// similar, that must stay visible, confirmed live: a Rockstar/Social Club
/// window appeared during testing and was correctly left alone) and
/// `FiveM_ChromeBrowser`/`FiveM_DumpServer` (helper processes, not relevant
/// here).
fn is_hide_target(name: &str, game_window_revealed: bool) -> bool {
    name == "fivem.exe"
        || name == "fivem_roslauncher.exe"
        || (!game_window_revealed && name.contains("_gtaprocess"))
}

fn watch_launch(app: AppHandle, fivem_path: String, launched_at: SystemTime) {
    let mut system = System::new();
    let started = Instant::now();
    let mut seen_starting = false;
    let mut seen_ros = false;
    let mut game_process_seen_at: Option<Instant> = None;
    let mut game_window_revealed = false;
    let mut loading_screen_seen_at: Option<Instant> = None;
    let mut scripts_ready = false;
    let mut hidden_windows: Vec<isize> = Vec::new();
    let logs_dir = PathBuf::from(&fivem_path).join("FiveM.app").join("logs");
    let mut log_tail: Option<LogTail> = None;

    let result = loop {
        system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let hide_target_pids: Vec<u32> = system
            .processes()
            .values()
            .filter(|p| {
                p.name()
                    .to_str()
                    .map(|n| is_hide_target(&n.to_ascii_lowercase(), game_window_revealed))
                    .unwrap_or(false)
            })
            .map(|p| p.pid().as_u32())
            .collect();
        hidden_windows.extend(window_control::hide_windows_for_pids(&hide_target_pids));

        let names: Vec<String> = system
            .processes()
            .values()
            .filter_map(|p| p.name().to_str())
            .map(|s| s.to_ascii_lowercase())
            .collect();
        let has = |needle: &str| names.iter().any(|n| n.contains(needle));

        if log_tail.is_none() {
            if let Some(path) = find_new_log_file(&logs_dir, launched_at) {
                log_tail = Some(LogTail::new(path));
            }
        }
        if let Some(tail) = log_tail.as_mut() {
            for line in tail.read_new_lines() {
                if let Some(detail) = extract_progress_detail(&line) {
                    emit_detail(&app, &detail);
                }
                if !game_window_revealed && line.contains(LOADING_SCREEN_MARKER) {
                    loading_screen_seen_at = Some(Instant::now());
                }
                if line.contains(SCRIPTS_READY_MARKER) {
                    scripts_ready = true;
                }
            }
        }

        let any_fivem_running = names.iter().any(|n| n.starts_with("fivem"));

        if has("_gtaprocess") {
            let first_seen = *game_process_seen_at.get_or_insert_with(|| {
                emit_stage(&app, LaunchStage::Running);
                Instant::now()
            });

            if !game_window_revealed {
                let reveal_timed_out = first_seen.elapsed() > REVEAL_TIMEOUT;
                if loading_screen_seen_at.is_some() || reveal_timed_out {
                    game_window_revealed = true;
                    // These PIDs are now excluded from `is_hide_target`, but
                    // anything already hidden from earlier this poll cycle
                    // needs restoring explicitly.
                    window_control::restore_windows(&hidden_windows);
                    hidden_windows.clear();
                    emit_stage(&app, LaunchStage::LoadingScreen);
                }
            }

            if game_window_revealed {
                let timed_out_waiting = loading_screen_seen_at
                    .unwrap_or(first_seen)
                    .elapsed()
                    > IN_SERVER_TIMEOUT;
                if scripts_ready || timed_out_waiting {
                    break LaunchStage::InServer;
                }
            }
        } else if game_process_seen_at.is_some() {
            // The game process was running and is now gone — it crashed or
            // was closed before we ever revealed its window.
            break LaunchStage::Failed;
        } else if !seen_ros && has("fivem_rosservice") {
            seen_ros = true;
            emit_stage(&app, LaunchStage::ConnectingToRos);
        } else if !seen_starting && (has("fivem_roslauncher") || names.iter().any(|n| n == "fivem.exe")) {
            seen_starting = true;
            emit_stage(&app, LaunchStage::Starting);
        } else if seen_starting && !any_fivem_running {
            break LaunchStage::Failed;
        }

        if game_process_seen_at.is_none() && started.elapsed() > CONNECT_TIMEOUT {
            break LaunchStage::TimedOut;
        }

        std::thread::sleep(POLL_INTERVAL);
    };

    window_control::restore_windows(&hidden_windows);
    emit_stage(&app, result);
}

/// Finds the newest `CitizenFX_log_*.log` file modified at/after `after` —
/// FiveM starts a fresh one per session, timestamped in its name.
fn find_new_log_file(logs_dir: &Path, after: SystemTime) -> Option<PathBuf> {
    let entries = std::fs::read_dir(logs_dir).ok()?;
    entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let name = e.file_name();
            let name = name.to_string_lossy();
            name.starts_with("CitizenFX_log_") && name.ends_with(".log")
        })
        .filter_map(|e| {
            let modified = e.metadata().ok()?.modified().ok()?;
            (modified >= after).then_some((e.path(), modified))
        })
        .max_by_key(|(_, modified)| *modified)
        .map(|(path, _)| path)
}

/// Incrementally reads whole new lines appended to a growing log file,
/// buffering any trailing partial line until it's completed on a later
/// read.
struct LogTail {
    path: PathBuf,
    offset: u64,
}

impl LogTail {
    fn new(path: PathBuf) -> Self {
        Self { path, offset: 0 }
    }

    fn read_new_lines(&mut self) -> Vec<String> {
        use std::io::{Seek, SeekFrom};

        let Ok(mut file) = std::fs::File::open(&self.path) else { return Vec::new() };
        if file.seek(SeekFrom::Start(self.offset)).is_err() {
            return Vec::new();
        }
        let mut buf = Vec::new();
        if file.read_to_end(&mut buf).is_err() || buf.is_empty() {
            return Vec::new();
        }

        let Some(last_newline) = buf.iter().rposition(|&b| b == b'\n') else { return Vec::new() };
        self.offset += (last_newline + 1) as u64;
        String::from_utf8_lossy(&buf[..=last_newline])
            .lines()
            .map(|s| s.to_string())
            .collect()
    }
}

/// FiveM logs connection/loading progress as `... OnConnectionProgress: <message>`
/// (e.g. `Downloading content manifest (4181.94 kB)`,
/// `Verifying loadingscreen (23 of 193 - 2.69/6.43 MiB)`, `Connecting to
/// server...`) — forwarded to the frontend verbatim as the secondary detail
/// line under our own stage text.
fn extract_progress_detail(line: &str) -> Option<String> {
    line.split_once("OnConnectionProgress: ")
        .map(|(_, msg)| msg.trim().to_string())
}

/// Hides/restores top-level windows belonging to specific FiveM processes,
/// leaving the processes themselves completely untouched — this only ever
/// calls `ShowWindow`, never anything that could affect FiveM's own
/// execution.
#[cfg(windows)]
mod window_control {
    use windows_sys::core::BOOL;
    use windows_sys::Win32::Foundation::{HWND, LPARAM, TRUE};
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetClassNameW, GetWindowThreadProcessId, IsWindowVisible, ShowWindow, SW_HIDE,
        SW_SHOW,
    };

    /// Standard Windows dialog box class. Never hidden: this is the only
    /// way FiveM can show something that needs the user's attention (an
    /// error, a prompt), so if it ever renders as a plain dialog instead of
    /// its usual custom-drawn splash, it stays visible.
    const DIALOG_CLASS: &str = "#32770";

    struct HideCtx {
        target_pids: Vec<u32>,
        hidden: Vec<isize>,
    }

    fn window_class_name(hwnd: HWND) -> String {
        let mut buf = [0u16; 256];
        let len = unsafe { GetClassNameW(hwnd, buf.as_mut_ptr(), buf.len() as i32) };
        String::from_utf16_lossy(&buf[..len.max(0) as usize])
    }

    unsafe extern "system" fn enum_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let ctx = &mut *(lparam as *mut HideCtx);
        let mut pid = 0u32;
        unsafe {
            GetWindowThreadProcessId(hwnd, &mut pid);
        }
        if ctx.target_pids.contains(&pid)
            && unsafe { IsWindowVisible(hwnd) != 0 }
            && window_class_name(hwnd) != DIALOG_CLASS
        {
            unsafe {
                ShowWindow(hwnd, SW_HIDE);
            }
            ctx.hidden.push(hwnd as isize);
        }
        TRUE
    }

    pub fn hide_windows_for_pids(pids: &[u32]) -> Vec<isize> {
        if pids.is_empty() {
            return Vec::new();
        }
        let mut ctx = HideCtx { target_pids: pids.to_vec(), hidden: Vec::new() };
        unsafe {
            EnumWindows(Some(enum_proc), &mut ctx as *mut HideCtx as isize);
        }
        ctx.hidden
    }

    pub fn restore_windows(handles: &[isize]) {
        for &h in handles {
            unsafe {
                ShowWindow(h as HWND, SW_SHOW);
            }
        }
    }
}

#[cfg(not(windows))]
mod window_control {
    pub fn hide_windows_for_pids(_pids: &[u32]) -> Vec<isize> {
        Vec::new()
    }

    pub fn restore_windows(_handles: &[isize]) {}
}
