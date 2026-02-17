use std::sync::Mutex;
use tauri::State;

mod driver;
use driver::{CNCController, FluidNCDriver};

pub struct AppState {
    pub driver: Mutex<Box<dyn CNCController + Send>>,
}

// --- Commands ---

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    match serialport::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(_) => vec![],
    }
}

#[tauri::command]
fn connect_to_board(
    state: State<'_, AppState>,
    port_name: String,
    baud_rate: u32,
) -> Result<String, String> {
    let mut driver = state
        .driver
        .lock()
        .map_err(|_| "Failed to lock driver".to_string())?;
    driver.connect(&port_name, baud_rate)?;
    Ok(format!("Connected to {}", port_name))
}

#[tauri::command]
fn send_realtime(state: State<'_, AppState>, cmd: char) -> Result<(), String> {
    let mut driver = state
        .driver
        .lock()
        .map_err(|_| "Failed to lock driver".to_string())?;
    driver.send_realtime_command(cmd)
}

#[tauri::command]
fn stream_gcode_file(state: State<'_, AppState>, path: String) -> Result<(), String> {
    let mut driver = state
        .driver
        .lock()
        .map_err(|_| "Failed to lock driver".to_string())?;
    driver.stream_file(path)
}

#[tauri::command]
fn send_gcode(state: State<'_, AppState>, cmd: String) -> Result<(), String> {
    let mut driver = state
        .driver
        .lock()
        .map_err(|_| "Failed to lock driver".to_string())?;
    driver.send_command(cmd)
}

#[tauri::command]
fn get_connection_status(state: State<'_, AppState>) -> Result<String, String> {
    let driver = state
        .driver
        .lock()
        .map_err(|_| "Failed to lock driver".to_string())?;
    Ok(driver.get_status())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .manage(AppState {
            driver: Mutex::new(Box::new(FluidNCDriver::new())),
        })
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            connect_to_board,
            send_gcode,
            send_realtime,
            stream_gcode_file,
            get_connection_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
