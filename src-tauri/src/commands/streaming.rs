/*
 * @file streaming.rs
 * @purpose Real-time G-code streaming with optional height map warping and feedrate overrides.
 * @author Ed Moffatt
 */
use tauri::State;
use crate::state::AppState;
use crate::autolevel;

/// Applies a height-map warp transform to a G-code program.
///
/// # Errors
/// Returns an error only if input state cannot be represented; current
/// implementation performs an in-memory transform and always succeeds.
#[tauri::command]
pub fn warp_gcode(
    gcode: String,
    min_x: f64,
    min_y: f64,
    spacing: f64,
    cols: usize,
    rows: usize,
    grid_data: Vec<f64>,
) -> Result<String, String> {
    let mut map = autolevel::height_map::HeightMap::new(min_x, min_y, spacing, cols, rows);
    map.grid = grid_data;
    Ok(autolevel::warper::parse_and_warp(&gcode, &map))
}

/// Streams a multi-line G-code program to the controller.
///
/// When warping is enabled, the active height map is used to transform motion
/// commands before transmission.
///
/// # Errors
/// Returns an error if driver/height-map locking fails, warping is requested
/// without an active map, or command transmission fails.
#[tauri::command]
pub fn send_gcode_stream(
    state: State<'_, AppState>,
    gcode: String,
    warp_enabled: bool,
) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|e| e.to_string())?;

    if warp_enabled {
        let hmap_lock = state.height_map.lock().map_err(|e| e.to_string())?;
        if let Some(ref map) = *hmap_lock {
            let warped = autolevel::warper::parse_and_warp(&gcode, map);
            for line in warped.lines() {
                driver.send_command(line.to_string())?;
            }
            return Ok(());
        } else {
            return Err("Height map enabled but not loaded".to_string());
        }
    }

    for line in gcode.lines() {
        driver.send_command(line.to_string())?;
    }
    Ok(())
}

/// Sends a single G-code line to the controller.
///
/// # Errors
/// Returns an error if driver locking or command transmission fails.
#[tauri::command]
pub fn send_gcode_line(state: State<'_, AppState>, line: String) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|e| e.to_string())?;
    driver.send_command(line)
}

/// Updates the controller feed override percentage.
///
/// # Errors
/// Returns an error if driver locking or command transmission fails.
#[tauri::command]
pub fn update_feed_override(state: State<'_, AppState>, value: u32) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|e| e.to_string())?;
    // FluidNC standard real-time overrides: 0x91=inc 10, 0x92=dec 10, etc.
    // For specific percentage, we usually send the command directly.
    driver.send_command(format!("$Feed/Override={}", value))
}

/// Updates the controller spindle override percentage.
///
/// # Errors
/// Returns an error if driver locking or command transmission fails.
#[tauri::command]
pub fn update_spindle_override(state: State<'_, AppState>, value: u32) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|e| e.to_string())?;
    driver.send_command(format!("$Spindle/Override={}", value))
}

/// Returns the currently active autolevel height map, if one is loaded.
///
/// # Errors
/// Returns an error if height-map state locking fails.
#[tauri::command]
pub fn get_active_height_map(
    state: State<'_, AppState>,
) -> Result<Option<autolevel::height_map::HeightMap>, String> {
    let hmap = state.height_map.lock().map_err(|e| e.to_string())?;
    Ok(hmap.clone())
}

/// Clears the active autolevel height map.
///
/// # Errors
/// Returns an error if height-map state locking fails.
#[tauri::command]
pub fn clear_height_map(state: State<'_, AppState>) -> Result<(), String> {
    let mut hmap = state.height_map.lock().map_err(|e| e.to_string())?;
    *hmap = None;
    Ok(())
}

/// Stores a new active autolevel height map.
///
/// # Errors
/// Returns an error if height-map state locking fails.
#[tauri::command]
pub fn set_height_map(
    state: State<'_, AppState>,
    map: autolevel::height_map::HeightMap,
) -> Result<(), String> {
    let mut hmap = state.height_map.lock().map_err(|e| e.to_string())?;
    *hmap = Some(map);
    Ok(())
}
