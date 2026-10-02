mod fivem;
mod mods;
mod settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            settings::load_settings,
            settings::save_settings,
            mods::list_mods,
            mods::ensure_mods_folder,
            mods::import_mod_files,
            mods::remove_mod_file,
            mods::export_mod_file,
            mods::open_in_explorer,
            mods::clear_fivem_cache,
            fivem::launch_fivem,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
