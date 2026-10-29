mod saves;

use saves::{ProfileMeta, SaveEntry, SaveStore};
use std::sync::Mutex;
use tauri::{Manager, State};
use tauri_plugin_opener::OpenerExt;

type Store = Mutex<SaveStore>;

#[tauri::command]
fn save_directory(store: State<Store>) -> Result<String, String> {
    Ok(store
        .lock()
        .map_err(|e| e.to_string())?
        .directory()
        .to_string_lossy()
        .into_owned())
}

#[tauri::command]
fn list_profiles(store: State<Store>) -> Result<Vec<SaveEntry>, String> {
    store.lock().map_err(|e| e.to_string())?.list()
}
#[tauri::command]
fn read_profile(store: State<Store>, id: u32) -> Result<SaveEntry, String> {
    store.lock().map_err(|e| e.to_string())?.read(id)
}
#[tauri::command]
fn create_profile(
    store: State<Store>,
    username: String,
    text: String,
) -> Result<SaveEntry, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .create(&username, &text)
}
#[tauri::command]
fn write_profile(
    store: State<Store>,
    id: u32,
    text: String,
    revision: String,
) -> Result<SaveEntry, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .write(id, &text, &revision)
}
#[tauri::command]
fn rename_profile(store: State<Store>, id: u32, username: String) -> Result<ProfileMeta, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .rename(id, &username)
}
#[tauri::command]
fn restore_profile(store: State<Store>, id: u32, revision: String) -> Result<SaveEntry, String> {
    store
        .lock()
        .map_err(|e| e.to_string())?
        .restore(id, &revision)
}
#[tauri::command]
fn open_save_directory(app: tauri::AppHandle, store: State<Store>) -> Result<(), String> {
    let directory = store
        .lock()
        .map_err(|e| e.to_string())?
        .directory()
        .to_path_buf();
    #[cfg(target_os = "windows")]
    let program = Some("explorer.exe");
    #[cfg(not(target_os = "windows"))]
    let program = None::<&str>;
    app.opener()
        .open_path(directory.to_string_lossy().to_string(), program)
        .map_err(|e| e.to_string())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // LocalData, not AppLocalData: the latter adds the bundle identifier itself.
            let root = app.path().local_data_dir()?.join("NorthernPrisma");
            app.manage(Mutex::new(SaveStore::new(root)?));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_directory,
            list_profiles,
            read_profile,
            create_profile,
            write_profile,
            rename_profile,
            restore_profile,
            open_save_directory
        ])
        .run(tauri::generate_context!())
        .expect("Không khởi động được Northern Prisma");
}
