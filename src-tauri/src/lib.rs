/// Set the app badge count on macOS dock icon
/// Pass None or 0 to clear the badge
#[tauri::command]
fn set_app_badge(count: Option<u32>) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        use objc2::MainThreadMarker;
        use objc2_app_kit::NSApplication;
        use objc2_foundation::NSString;

        // Get main thread marker - Tauri commands run on the main thread
        let mtm = MainThreadMarker::new()
            .ok_or_else(|| "Must be called from main thread".to_string())?;

        let app = NSApplication::sharedApplication(mtm);
        let dock_tile = app.dockTile();

        match count {
            Some(n) if n > 0 => {
                let label = NSString::from_str(&n.to_string());
                dock_tile.setBadgeLabel(Some(&label));
            }
            _ => {
                dock_tile.setBadgeLabel(None);
            }
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        // No-op on other platforms
        let _ = count;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![set_app_badge])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
