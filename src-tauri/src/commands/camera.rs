/*
 * @file camera.rs
 * @purpose Stubs for camera hardware controls, primarily handled by the Linux server bridge.
 * @author Ed Moffatt
 */
/// Returns current camera settings when hardware control is available.
///
/// # Errors
/// Returns an error on desktop-native builds where camera controls are delegated
/// to the Linux bridge server.
#[tauri::command]
pub fn get_camera_settings(_config_path: String) -> Result<serde_json::Value, String> {
    Err("Camera hardware controls are only available when connected to the remote Gtaurus Server Bridge (Linux). Windows native camera control via v4l2-ctl is not supported.".to_string())
}

/// Applies camera settings updates when hardware control is available.
///
/// # Errors
/// Returns an error on desktop-native builds where camera controls are delegated
/// to the Linux bridge server.
#[tauri::command]
pub fn set_camera_settings(
    _config_path: String,
    _updates: serde_json::Value,
) -> Result<serde_json::Value, String> {
    Err("Camera hardware controls are only available when connected to the remote Gtaurus Server Bridge (Linux). Windows native camera control via v4l2-ctl is not supported.".to_string())
}
