use std::sync::Mutex;
use tauri::{AppHandle, State};

mod driver;
mod driver_tests;
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
async fn fetch_fluidnc_file(url: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client.get(url).send().await.map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("HTTP Error: {}", res.status()));
    }
    res.text().await.map_err(|e| e.to_string())
}

#[tauri::command]
async fn restart_fluidnc(url: String) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    // We expect the connection to drop or timeout because the board restarts immediately,
    // but often it will complete the redirect to /did_restart first.
    match client.get(url).send().await {
        Ok(res) => {
            if res.status().is_success() {
                res.text().await.map_err(|e| e.to_string())
            } else {
                Err(format!("HTTP Error: {}", res.status()))
            }
        }
        Err(e) => {
            let err_str = e.to_string();
            // If it's a timeout or connection reset, we consider it "sent"
            if err_str.contains("timeout")
                || err_str.contains("connection reset")
                || err_str.contains("channel closed")
            {
                Ok("Restart command sent (connection closed)".to_string())
            } else {
                Err(err_str)
            }
        }
    }
}

#[tauri::command]
async fn upload_fluidnc_file(url: String, filename: String, content: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new().text("path", "/").part(
        "myfile",
        reqwest::multipart::Part::text(content).file_name(filename),
    );

    let res = client
        .post(url)
        .multipart(form)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !res.status().is_success() {
        return Err(format!("Upload failed: {}", res.status()));
    }
    Ok(())
}

#[derive(serde::Serialize)]
pub struct LocalFile {
    name: String,
    size: u64,
    modified: u64, // timestamp in seconds
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find home directory".to_string())
}

#[tauri::command]
fn ensure_dir_exists(path: String) -> Result<(), String> {
    std::fs::create_dir_all(path).map_err(|e| e.to_string())
}

#[tauri::command]
fn list_local_files(path: String) -> Result<Vec<LocalFile>, String> {
    let mut files = Vec::new();
    let entries = std::fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        if metadata.is_file() {
            files.push(LocalFile {
                name: entry.file_name().to_string_lossy().to_string(),
                size: metadata.len(),
                modified: metadata
                    .modified()
                    .map_err(|e| e.to_string())?
                    .duration_since(std::time::UNIX_EPOCH)
                    .map_err(|e| e.to_string())?
                    .as_secs(),
            });
        }
    }
    Ok(files)
}

#[tauri::command]
fn save_local_file(path: String, filename: String, content: String) -> Result<(), String> {
    let mut full_path = std::path::PathBuf::from(path);
    full_path.push(filename);
    std::fs::write(full_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_local_file(path: String, filename: String) -> Result<(), String> {
    let mut full_path = std::path::PathBuf::from(path);
    full_path.push(filename);
    std::fs::remove_file(full_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn copy_to_storage(source_path: String, dest_dir: String) -> Result<(), String> {
    let source = std::path::PathBuf::from(source_path);
    let filename = source.file_name().ok_or("Invalid filename")?;
    let mut dest = std::path::PathBuf::from(dest_dir);
    dest.push(filename);
    std::fs::copy(source, dest)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn validate_gcode_file(path: String) -> Result<bool, String> {
    let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;

    // Basic validation: check for common G-code characters or commands
    // We look for any line starting with G, M, X, Y, Z, $ or containing them
    // This is a simple heuristic, as requested.
    let is_gcode = content.lines().any(|line| {
        let l = line.trim();
        if l.is_empty() || l.starts_with(';') || l.starts_with('(') {
            return false;
        }
        l.starts_with('G')
            || l.starts_with('M')
            || l.starts_with('X')
            || l.starts_with('Y')
            || l.starts_with('Z')
            || l.starts_with('$')
            || l.starts_with('F')
            || l.starts_with('S')
            || l.starts_with('T')
    });

    Ok(is_gcode)
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
        .plugin(tauri_plugin_dialog::init())
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
            fetch_fluidnc_file,
            upload_fluidnc_file,
            restart_fluidnc,
            get_home_dir,
            ensure_dir_exists,
            list_local_files,
            save_local_file,
            delete_local_file,
            copy_to_storage,
            validate_gcode_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
