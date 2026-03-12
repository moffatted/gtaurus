/*
 * @file connection.rs
 * @purpose Tauri commands for managing serial and telnet connections to the CNC controller.
 * @author Ed Moffatt
 */
use tauri::{AppHandle, State};
use crate::state::AppState;

pub(crate) fn shared_list_serial_ports() -> Vec<String> {
    match serialport::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(_) => vec![],
    }
}

#[tauri::command]
pub fn list_serial_ports() -> Vec<String> {
    shared_list_serial_ports()
}

#[tauri::command]
pub fn connect_serial(
    state: State<'_, AppState>,
    app: AppHandle,
    port_name: String,
    baud_rate: u32,
) -> Result<String, String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.connect_serial_tauri(&port_name, baud_rate, app)?;
    Ok(format!("Connected to {}", port_name))
}

#[tauri::command]
pub fn connect_telnet(
    state: State<'_, AppState>,
    app: AppHandle,
    host: String,
    ws_port: Option<u16>,
) -> Result<String, String> {
    let port = ws_port.unwrap_or(23);
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.connect_telnet_tauri(&host, port, app)?;
    Ok(format!("Connected to {}:{}", host, port))
}

#[tauri::command]
pub fn disconnect(state: State<'_, AppState>) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.disconnect();
    Ok(())
}

#[tauri::command]
pub fn send_gcode(state: State<'_, AppState>, cmd: String) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.send_command(cmd)
}

#[tauri::command]
pub fn send_realtime(state: State<'_, AppState>, byte: u8) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    driver.send_realtime(byte)
}

#[tauri::command]
pub fn get_connection_status(state: State<'_, AppState>) -> Result<String, String> {
    let driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
    Ok(driver.get_status())
}
