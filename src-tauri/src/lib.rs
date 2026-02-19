use std::sync::Mutex;
use tauri::{AppHandle, State};

mod driver;
use driver::{CNCController, FluidNCDriver};

pub struct AppState {
    pub driver: Mutex<Box<dyn CNCController>>,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    match serialport::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(_) => vec![],
    }
}

/// Connect over USB/serial
#[tauri::command]
fn connect_serial(
    state: State<'_, AppState>,
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
) -> Result<String, String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.connect_serial(&port_name, baud_rate, app)?;
    Ok(format!("Connected to {}", port_name))
}

/// Connect over WiFi via Telnet TCP (FluidNC port 23)
#[tauri::command]
fn connect_telnet(
    state: State<'_, AppState>,
    app: AppHandle,
    host: String,
    ws_port: Option<u16>,
) -> Result<String, String> {
    let port = ws_port.unwrap_or(23);
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.connect_telnet(&host, port, app)?;
    Ok(format!("Connected to {}:{}", host, port))
}

/// Disconnect from whatever transport is active
#[tauri::command]
fn disconnect(state: State<'_, AppState>) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.disconnect();
    Ok(())
}

/// Send a G-code or $ command (buffered, respects character-counting for serial)
#[tauri::command]
fn send_gcode(state: State<'_, AppState>, cmd: String) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.send_command(cmd)
}

/// Send a real-time byte (?, !, ~, 0x18, …) — bypasses the command buffer
#[tauri::command]
fn send_realtime(state: State<'_, AppState>, byte: u8) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.send_realtime(byte)
}

#[tauri::command]
fn get_connection_status(state: State<'_, AppState>) -> Result<String, String> {
    let driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    Ok(driver.get_status())
}

// ─── App bootstrap ───────────────────────────────────────────────────────────

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
            connect_serial,
            connect_telnet,
            disconnect,
            send_gcode,
            send_realtime,
            get_connection_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
