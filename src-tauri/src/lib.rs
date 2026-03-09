//! lib.rs
//! Purpose: Main entry point for the Tauri backend, defining state and invokable commands.

use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

pub mod ai;
pub mod autolevel;
mod driver;
mod driver_tests;

use driver::{FluidNCDriver, GCodeConnection};

pub struct AppState {
    pub driver: Arc<Mutex<Box<dyn GCodeConnection>>>,
    pub height_map: Arc<Mutex<Option<autolevel::height_map::HeightMap>>>,
}

// ─── Commands ─────────────────────────────────────────────────────────────────

pub(crate) fn shared_list_serial_ports() -> Vec<String> {
    match serialport::available_ports() {
        Ok(ports) => ports.into_iter().map(|p| p.port_name).collect(),
        Err(_) => vec![],
    }
}

#[tauri::command]
fn list_serial_ports() -> Vec<String> {
    shared_list_serial_ports()
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
    driver.connect_serial_tauri(&port_name, baud_rate, app)?;
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
    driver.connect_telnet_tauri(&host, port, app)?;
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
async fn upload_fluidnc_file(
    url: String,
    target_path: String,
    filename: String,
    content: String,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let form = reqwest::multipart::Form::new()
        .text("path", target_path)
        .part(
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
    let dir = std::path::PathBuf::from(&path);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut files = Vec::new();
    let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;

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
fn read_local_file(path: String, filename: String) -> Result<String, String> {
    let mut full_path = std::path::PathBuf::from(&path);
    full_path.push(&filename);
    eprintln!(
        "[read_local_file] path={:?}, filename={:?} -> full_path={:?}",
        path, filename, full_path
    );
    std::fs::read_to_string(&full_path).map_err(|e| {
        eprintln!("[read_local_file] ERR: {} for {:?}", e, full_path);
        e.to_string()
    })
}

#[tauri::command]
fn save_local_file(path: String, filename: String, content: String) -> Result<(), String> {
    let dir = std::path::PathBuf::from(&path);
    eprintln!("[save_local_file] ensuring dir exists: {:?}", dir);
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut full_path = dir;
    full_path.push(filename);
    eprintln!("[save_local_file] writing to: {:?}", full_path);
    std::fs::write(&full_path, content).map_err(|e| {
        eprintln!("[save_local_file] ERR: {} for {:?}", e, full_path);
        e.to_string()
    })
}

#[tauri::command]
fn delete_local_file(path: String, filename: String) -> Result<(), String> {
    let mut full_path = std::path::PathBuf::from(path);
    full_path.push(filename);
    std::fs::remove_file(full_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn copy_to_storage(source_path: String, dest_dir: String) -> Result<(), String> {
    eprintln!(
        "[copy_to_storage] source_path={:?}, dest_dir={:?}",
        source_path, dest_dir
    );
    let source = std::path::PathBuf::from(&source_path);
    if !source.exists() {
        return Err(format!("Source file does not exist: {}", source_path));
    }
    let filename = source.file_name().ok_or("Invalid filename")?;
    let dest_path = std::path::PathBuf::from(&dest_dir);
    std::fs::create_dir_all(&dest_path).map_err(|e| format!("Failed to create dest dir: {}", e))?;
    let mut dest = dest_path;
    dest.push(filename);
    eprintln!("[copy_to_storage] copying {:?} -> {:?}", source, dest);
    std::fs::copy(&source, &dest).map(|_| ()).map_err(|e| {
        format!(
            "Copy failed: {} (source={}, dest={})",
            e,
            source.display(),
            dest.display()
        )
    })
}

#[tauri::command]
fn validate_gcode_file(path: String) -> Result<bool, String> {
    eprintln!("[validate_gcode_file] checking: {:?}", path);
    let content = std::fs::read_to_string(&path).map_err(|e| {
        eprintln!("[validate_gcode_file] ERR: {} for path {}", e, path);
        e.to_string()
    })?;

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

#[tauri::command]
fn start_probing(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    min_x: f64,
    min_y: f64,
    max_x: f64,
    max_y: f64,
    spacing: f64,
    safe_z: Option<f64>,
    max_depth: Option<f64>,
    feedrate: Option<f64>,
) -> Result<String, String> {
    let cols = ((max_x - min_x) / spacing).ceil() as usize + 1;
    let rows = ((max_y - min_y) / spacing).ceil() as usize + 1;

    let sz = safe_z.unwrap_or(2.0);
    let md = max_depth.unwrap_or(-10.0);
    let fr = feedrate.unwrap_or(50.0);

    let map = autolevel::height_map::HeightMap::new(min_x, min_y, spacing, cols, rows);

    let (tx, rx) = std::sync::mpsc::channel();
    {
        let mut driver_guard = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
        driver_guard.add_rx_subscriber(tx);
    }

    {
        let mut hm_lock = state
            .height_map
            .lock()
            .map_err(|_| "Lock failed".to_string())?;
        // Initialize empty map, emit immediate update to UI
        let _ = app_handle.emit("autolevel:grid_update", &map);
        *hm_lock = Some(map);
    }

    let driver_clone = Arc::clone(&state.driver);
    let map_clone = Arc::clone(&state.height_map);
    let app_handle_clone = app_handle.clone();

    // Spawn blocking background thread for orchestrating probing routine
    std::thread::spawn(move || {
        for r in 0..rows {
            // "Z-mode/snake" pattern is superior, but standard row/col is fine for now
            // To make it snake, we can reverse columns on odd rows
            let c_iter: Box<dyn Iterator<Item = usize>> = if r % 2 == 0 {
                Box::new(0..cols)
            } else {
                Box::new((0..cols).rev())
            };

            for c in c_iter {
                let x = min_x + (c as f64) * spacing;
                let y = min_y + (r as f64) * spacing;

                // 1. Move safely in XY plane to probe point and drop to Z=1 (just slightly above board)
                {
                    if let Ok(mut driver) = driver_clone.lock() {
                        let _ = driver.send_command(format!("G0 X{:.3} Y{:.3} Z{:.3}", x, y, sz));
                    }
                }

                // Give driver a tiny moment just to ensure serial spacing
                std::thread::sleep(std::time::Duration::from_millis(50));

                // 2. Descend using probe cycle to Z = -10 at slow feed F50
                {
                    if let Ok(mut driver) = driver_clone.lock() {
                        let _ = driver.send_command(format!("G38.2 Z{:.3} F{:.1}", md, fr));
                    }
                }

                // 3. Wait blockingly for PRB response
                let mut probed_z = 0.0;
                while let Ok(line) = rx.recv() {
                    let res = autolevel::probe_runner::parse_probe_report(&line);
                    if let autolevel::probe_runner::ProbeResult::Success(pos) = res {
                        probed_z = pos.z;
                        break;
                    } else if res == autolevel::probe_runner::ProbeResult::Failed {
                        // Failed to trigger within bounds. Print to console and abort thread.
                        eprintln!(
                            "[AutoLevel] Probe failed to trigger properly at X:{} Y:{}",
                            x, y
                        );
                        // Send general reset/abort symbol to machine (?)
                        return;
                    }
                }

                // 4. Add point to HeightMap and broadcast
                {
                    if let Ok(mut hm_lock) = map_clone.lock() {
                        if let Some(ref mut hm) = *hm_lock {
                            hm.set_z_at_index(c, r, probed_z);
                            let _ = app_handle_clone.emit("autolevel:grid_update", &*hm);
                        }
                    }
                }

                // 5. Retract up slightly above 0 point to clear for travel to next XY
                {
                    if let Ok(mut driver) = driver_clone.lock() {
                        let _ = driver.send_command(format!("G0 Z{:.3}", sz));
                    }
                }
            }
        }

        println!("[AutoLevel] Probing Routine completed successfully!");
    });

    Ok(format!("Probing initialized for {}x{} grid", cols, rows))
}

#[tauri::command]
fn warp_gcode(
    gcode: String,
    min_x: f64,
    min_y: f64,
    spacing: f64,
    cols: usize,
    rows: usize,
    data: Vec<f64>,
) -> String {
    let mut map = autolevel::height_map::HeightMap::new(min_x, min_y, spacing, cols, rows);
    // Fill the data explicitly
    map.grid = data;

    autolevel::warper::parse_and_warp(&gcode, &map)
}

pub(crate) fn shared_stream_local_gcode(
    state: &AppState,
    path: String,
    feed_override: Option<f64>,
    post_job_gcode: Option<String>,
) -> Result<String, String> {
    eprintln!(
        "[GTaurus] Received request to stream local G-code: {:?}",
        path
    );

    // 1. Verify file existence
    if !std::path::Path::new(&path).exists() {
        eprintln!("[GTaurus] ERR: File does not exist at path: {:?}", path);
        return Err(format!("File does not exist: {}", path));
    }

    // 2. Read content
    let content = std::fs::read_to_string(&path).map_err(|e| {
        eprintln!("[GTaurus] ERR: Failed to read file {:?}: {}", path, e);
        format!("Failed to read file: {}", e)
    })?;

    // 3. Verify connection
    let status = {
        let driver = state.driver.lock().map_err(|_| "Lock failed".to_string())?;
        driver.get_status()
    };
    if status == "Disconnected" {
        return Err(
            "Machine is not connected. Please connect via Serial or WiFi first.".to_string(),
        );
    }

    // 4. Apply warping if height map is active
    let final_gcode = {
        let hm_lock = state
            .height_map
            .lock()
            .map_err(|_| "Lock failed".to_string())?;
        if let Some(ref hm) = *hm_lock {
            println!(
                "[AutoLevel] Applying height map warp to {} before streaming.",
                path
            );
            autolevel::warper::parse_and_warp(&content, hm)
        } else {
            content
        }
    };

    // Append post-job gcode if provided
    let mut actual_final_gcode = final_gcode;
    if let Some(post_gcode) = post_job_gcode {
        actual_final_gcode.push('\n');
        actual_final_gcode.push_str(&post_gcode);
    }

    let final_gcode = actual_final_gcode;

    let driver_clone = Arc::clone(&state.driver);

    // 5. Spawn background thread for streaming
    std::thread::spawn(move || {
        println!(
            "[GTaurus] >>> Starting G-code stream job ({} lines) <<<",
            final_gcode.lines().count()
        );

        let mut has_sent_initial_f = false;

        for (i, line) in final_gcode.lines().enumerate() {
            let l = line.trim();
            if l.is_empty() || l.starts_with(';') || l.starts_with('(') {
                continue;
            }

            let mut final_line = l.to_string();

            // Apply Feedrate Override logic
            if let Some(target_f) = feed_override {
                // 1. If line contains an F command, replace it
                if l.contains('F') || l.contains('f') {
                    // Simple regex/parsing to find the F value
                    let parts: Vec<&str> = l.split_whitespace().collect();
                    let mut new_parts = Vec::new();
                    for p in parts {
                        if p.starts_with('F') || p.starts_with('f') {
                            new_parts.push(format!("F{:.1}", target_f));
                        } else {
                            new_parts.push(p.to_string());
                        }
                    }
                    final_line = new_parts.join(" ");
                    has_sent_initial_f = true;
                }
                // 2. If it's a movement line (G1/G2/G3) but has no F, and we haven't sent the override yet
                else if (l.contains("G1") || l.contains("G2") || l.contains("G3"))
                    && !has_sent_initial_f
                {
                    final_line = format!("{} F{:.1}", l, target_f);
                    has_sent_initial_f = true;
                }
            }

            if let Ok(mut driver) = driver_clone.lock() {
                if let Err(e) = driver.send_command(final_line) {
                    eprintln!("[GTaurus] Stream Aborted: Failed to send line {}: {}", i, e);
                    break;
                }
            }

            // Tiny sleep to prevent slamming the mpsc channel too hard for massive files
            if i % 50 == 0 {
                std::thread::sleep(std::time::Duration::from_millis(5));
            }
        }
        println!("[GTaurus] >>> Finished streaming G-code job. <<<");
    });

    Ok(format!("Successfully started streaming {}", path))
}

#[tauri::command]
fn stream_local_gcode(
    state: State<'_, AppState>,
    path: String,
    feed_rate_override: Option<f64>,
    post_job_gcode: Option<String>,
) -> Result<String, String> {
    shared_stream_local_gcode(&*state, path, feed_rate_override, post_job_gcode)
}

// ─── App bootstrap ───────────────────────────────────────────────────────────

#[tauri::command]
fn get_camera_settings(_config_path: String) -> Result<serde_json::Value, String> {
    Err("Camera hardware controls are only available when connected to the remote Gtaurus Server Bridge (Linux). Windows native camera control via v4l2-ctl is not supported.".to_string())
}

#[tauri::command]
fn set_camera_settings(
    _config_path: String,
    _updates: serde_json::Value,
) -> Result<serde_json::Value, String> {
    Err("Camera hardware controls are only available when connected to the remote Gtaurus Server Bridge (Linux). Windows native camera control via v4l2-ctl is not supported.".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState {
            driver: Arc::new(Mutex::new(FluidNCDriver::new_boxed())),
            height_map: Arc::new(Mutex::new(None)),
        })
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            list_serial_ports,
            connect_serial,
            connect_telnet,
            disconnect,
            send_gcode,
            send_realtime,
            get_connection_status,
            start_probing,
            fetch_fluidnc_file,
            upload_fluidnc_file,
            restart_fluidnc,
            get_home_dir,
            ensure_dir_exists,
            list_local_files,
            read_local_file,
            save_local_file,
            delete_local_file,
            copy_to_storage,
            validate_gcode_file,
            warp_gcode,
            stream_local_gcode,
            get_camera_settings,
            set_camera_settings,
            ai::ask_ai,
            ai::list_gemini_models,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
