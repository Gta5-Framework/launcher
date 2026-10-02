use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub language: String,
    pub fivem_path: String,
    pub start_with_windows: bool,
    pub minimize_on_launch: bool,
    pub auto_update: bool,
    pub notifications: bool,
    pub auto_create_mods_folder: bool,
    pub check_mods_on_start: bool,
    pub backup_before_import: bool,
}

impl Settings {
    fn with_defaults(fivem_path: String) -> Self {
        Self {
            language: "de".into(),
            fivem_path,
            start_with_windows: false,
            minimize_on_launch: true,
            auto_update: true,
            notifications: true,
            auto_create_mods_folder: true,
            check_mods_on_start: true,
            backup_before_import: true,
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

fn default_fivem_path(app: &AppHandle) -> Result<String, String> {
    let base = app.path().local_data_dir().map_err(|e| e.to_string())?;
    Ok(base.join("FiveM").to_string_lossy().to_string())
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<Settings, String> {
    let path = settings_path(&app)?;
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str(&data).map_err(|e| e.to_string())
    } else {
        let settings = Settings::with_defaults(default_fivem_path(&app)?);
        save_settings(app, settings.clone())?;
        Ok(settings)
    }
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: Settings) -> Result<(), String> {
    let path = settings_path(&app)?;
    let data = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}
