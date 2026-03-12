/*
 * @file probing.rs
 * @purpose Logic for automated bed probing and height map generation.
 * @author Ed Moffatt
 */
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};
use crate::state::AppState;
use crate::autolevel;

#[tauri::command]
pub fn start_probing(
    app_handle: AppHandle,
    state: State<'_, AppState>,
    min_x: f64,
    min_y: f64,
    max_x: f64,
    max_y: f64,
    spacing: f64,
    probe_feed: f64,
    safe_z: f64,
    probe_depth: f64,
) -> Result<(), String> {
    let driver_arc = Arc::clone(&state.driver);
    let hmap_arc = Arc::clone(&state.height_map);

    std::thread::spawn(move || {
        let cols = ((max_x - min_x) / spacing).ceil() as usize + 1;
        let rows = ((max_y - min_y) / spacing).ceil() as usize + 1;
        let mut map = autolevel::height_map::HeightMap::new(min_x, min_y, spacing, cols, rows);

        for r in 0..rows {
            // Zig-zag pattern for efficiency
            let cols_range: Vec<usize> = if r % 2 == 0 {
                (0..cols).collect()
            } else {
                (0..cols).rev().collect()
            };

            for &c in &cols_range {
                let target_x = min_x + (c as f64 * spacing);
                let target_y = min_y + (r as f64 * spacing);

                // 1. Move to XY at Safe Z
                {
                    let mut d = driver_arc.lock().unwrap();
                    let _ = d.send_command(format!("G21 G90 G0 Z{}", safe_z));
                    let _ = d.send_command(format!("G0 X{} Y{}", target_x, target_y));
                }

                // 2. Probe
                let _ = app_handle.emit("probe-status", format!("Probing [{}, {}]", c, r));
                
                // We use a simplified blocking approach here for the MVP.
                // In a real app, we'd wait for the [PRB:...] response from the driver's observer.
                // For now, we simulate success at Z=0.0 to demonstrate the workflow.
                {
                    let mut d = driver_arc.lock().unwrap();
                    let _ = d.send_command(format!("G38.2 Z{} F{}", probe_depth, probe_feed));
                }

                // SIMULATION ONLY:
                std::thread::sleep(std::time::Duration::from_millis(500));
                map.set_z_at_index(c, r, 0.0);
            }
        }

        let mut hmap = hmap_arc.lock().unwrap();
        *hmap = Some(map.clone());
        let _ = app_handle.emit("probe-finished", map);
    });

    Ok(())
}

#[tauri::command]
pub fn stop_probing(state: State<'_, AppState>) -> Result<(), String> {
    let mut driver = state.driver.lock().map_err(|e| e.to_string())?;
    // Send 0x18 (Ctrl+X) or ! (Feed Hold) to stop movement
    driver.send_command("\u{0018}".to_string())
}
