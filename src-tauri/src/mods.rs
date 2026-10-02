use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModFile {
    pub name: String,
    pub size_bytes: u64,
    pub modified_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ModsListResult {
    pub exists: bool,
    pub mods: Vec<ModFile>,
    pub total_size_bytes: u64,
}

fn is_rpf(path: &Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| e.eq_ignore_ascii_case("rpf"))
        .unwrap_or(false)
}

fn safe_file_name(name: &str) -> Result<&std::ffi::OsStr, String> {
    Path::new(name).file_name().ok_or_else(|| "invalid file name".to_string())
}

#[tauri::command]
pub fn list_mods(mods_path: String) -> Result<ModsListResult, String> {
    let dir = PathBuf::from(&mods_path);
    if !dir.exists() {
        return Ok(ModsListResult { exists: false, mods: vec![], total_size_bytes: 0 });
    }

    let mut mods = Vec::new();
    let mut total_size_bytes = 0u64;

    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if !path.is_file() || !is_rpf(&path) {
            continue;
        }

        let meta = entry.metadata().map_err(|e| e.to_string())?;
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);

        total_size_bytes += meta.len();
        mods.push(ModFile {
            name: entry.file_name().to_string_lossy().to_string(),
            size_bytes: meta.len(),
            modified_ms,
        });
    }

    mods.sort_by(|a, b| b.modified_ms.cmp(&a.modified_ms));

    Ok(ModsListResult { exists: true, mods, total_size_bytes })
}

#[tauri::command]
pub fn ensure_mods_folder(mods_path: String) -> Result<(), String> {
    fs::create_dir_all(&mods_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn import_mod_files(mods_path: String, source_paths: Vec<String>, backup: bool) -> Result<(), String> {
    let dest_dir = PathBuf::from(&mods_path);
    fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;

    for src in source_paths {
        let src_path = PathBuf::from(&src);
        if !is_rpf(&src_path) {
            continue;
        }
        let file_name = src_path.file_name().ok_or("invalid source file name")?;
        let dest_path = dest_dir.join(file_name);

        if backup && dest_path.exists() {
            let backup_path = dest_path.with_extension("rpf.bak");
            fs::copy(&dest_path, &backup_path).map_err(|e| e.to_string())?;
        }

        fs::copy(&src_path, &dest_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn remove_mod_file(mods_path: String, name: String) -> Result<(), String> {
    let file_name = safe_file_name(&name)?;
    let target = PathBuf::from(&mods_path).join(file_name);
    fs::remove_file(target).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_mod_file(mods_path: String, name: String, dest_dir: String) -> Result<(), String> {
    let file_name = safe_file_name(&name)?;
    let src = PathBuf::from(&mods_path).join(file_name);
    let dest = PathBuf::from(&dest_dir).join(file_name);
    fs::copy(src, dest).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_in_explorer(path: String) -> Result<(), String> {
    std::process::Command::new("explorer")
        .arg(&path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn clear_fivem_cache(fivem_path: String) -> Result<(), String> {
    let cache_dir = PathBuf::from(&fivem_path).join("FiveM.app").join("data").join("cache");
    if cache_dir.exists() {
        fs::remove_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
