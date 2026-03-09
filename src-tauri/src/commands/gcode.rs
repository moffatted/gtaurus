use serde::{Serialize, Deserialize};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GCodePoint {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub is_rapid: bool,
    pub line_number: u32,
    pub feedrate: f32,
}

fn linearize_arc(
    start: [f32; 3],
    end: [f32; 3],
    center_offset: [f32; 2],
    is_clockwise: bool,
    segments: usize
) -> Vec<[f32; 3]> {
    let mut points = Vec::new();
    let cx = start[0] + center_offset[0];
    let cy = start[1] + center_offset[1];
    
    let r = (center_offset[0].powi(2) + center_offset[1].powi(2)).sqrt();
    let start_angle = (start[1] - cy).atan2(start[0] - cx);
    let mut end_angle = (end[1] - cy).atan2(end[0] - cx);
    
    // Check for full circle
    let is_full_circle = (start[0] - end[0]).abs() < 0.001 
                       && (start[1] - end[1]).abs() < 0.001 
                       && (center_offset[0].abs() > 0.001 || center_offset[1].abs() > 0.001);

    if is_full_circle {
        if is_clockwise {
            end_angle = start_angle - 2.0 * std::f32::consts::PI;
        } else {
            end_angle = start_angle + 2.0 * std::f32::consts::PI;
        }
    } else {
        if is_clockwise {
            if end_angle >= start_angle { end_angle -= 2.0 * std::f32::consts::PI; }
        } else {
            if end_angle <= start_angle { end_angle += 2.0 * std::f32::consts::PI; }
        }
    }
    
    let angle_diff = end_angle - start_angle;
    let dz = end[2] - start[2];
    
    for i in 1..=segments {
        let ratio = i as f32 / segments as f32;
        let angle = start_angle + angle_diff * ratio;
        let px = cx + angle.cos() * r;
        let py = cy + angle.sin() * r;
        let pz = start[2] + dz * ratio;
        points.push([px, py, pz]);
    }
    points
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GCodeAnalysis {
    pub points: Vec<GCodePoint>,
    pub bbox_min: [f32; 3],
    pub bbox_max: [f32; 3],
    pub total_dist_cut: f32,
    pub total_dist_rapid: f32,
    pub estimated_time_s: f32,
    pub min_z: f32,
    pub max_z: f32,
    pub workpiece_min_z: f32,
    pub workpiece_max_z: f32,
    pub min_feedrate: f32,
    pub max_feedrate: f32,
}

#[tauri::command]
pub fn parse_gcode_file(path: String) -> Result<GCodeAnalysis, String> {
    let file = File::open(&path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let mut points = Vec::new();
    let mut last_x = 0.0;
    let mut last_y = 0.0;
    let mut last_z = 0.0;
    let mut last_f = 0.0;
    let mut last_is_rapid = false;
    let mut is_relative = false;
    let mut is_inch = false;

    let mut bbox_min = [f32::MAX, f32::MAX, f32::MAX];
    let mut bbox_max = [f32::MIN, f32::MIN, f32::MIN];
    
    let mut total_dist_cut = 0.0;
    let mut total_dist_rapid = 0.0;

    let mut min_feedrate = f32::MAX;
    let mut max_feedrate = 0.0f32;

    let mut workpiece_min_z = 0.0f32;
    let mut workpiece_max_z = 0.0f32;
    let mut first_move = true;

    // A very simple time estimate for now: total_dist / average_feed
    // We will refine this in later phases with proper kinematics.

    for (i, line) in reader.lines().enumerate() {
        let line = line.map_err(|e| e.to_string())?;
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with(';') || trimmed.starts_with('(') {
            continue;
        }

        let mut current_x = last_x;
        let mut current_y = last_y;
        let mut current_z = last_z;
        let mut current_f = last_f;
        let mut move_type: Option<i32> = None; // 0=rapid, 1=linear, 2=CW, 3=CCW
        let mut changed = false;
        let mut arc_i = 0.0;
        let mut arc_j = 0.0;

        // Simple G-code tokenizing
        let parts = trimmed.split_whitespace();
        for part in parts {
            if part.is_empty() { continue; }
            let cmd = &part[0..1].to_uppercase();
            let val_str = &part[1..];
            let val = val_str.parse::<f32>().unwrap_or(0.0);

            match cmd.as_str() {
                "G" => {
                    let g_val = val as i32;
                    match g_val {
                        0 | 1 | 2 | 3 => {
                            move_type = Some(g_val);
                            changed = true; // Any move command counts as a change even if coords stay same
                        },
                        20 => is_inch = true,
                        21 => is_inch = false,
                        90 => is_relative = false,
                        91 => is_relative = true,
                        _ => {}
                    }
                },
                "X" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    current_x = if is_relative { last_x + v } else { v };
                    changed = true;
                },
                "Y" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    current_y = if is_relative { last_y + v } else { v };
                    changed = true;
                },
                "Z" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    current_z = if is_relative { last_z + v } else { v };
                    changed = true;
                },
                "I" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    arc_i = v;
                },
                "J" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    arc_j = v;
                },
                "F" => {
                    let mut v = val;
                    if is_inch { v *= 25.4; }
                    current_f = v;
                    if v > 0.0 {
                        min_feedrate = min_feedrate.min(v);
                        max_feedrate = max_feedrate.max(v);
                    }
                }
                _ => {}
            }
        }

        if changed {
            let m_type = move_type.unwrap_or(if last_is_rapid { 0 } else { 1 });
            
            if m_type == 2 || m_type == 3 {
                // Arc move
                let arc_points = linearize_arc(
                    [last_x, last_y, last_z],
                    [current_x, current_y, current_z],
                    [arc_i, arc_j],
                    m_type == 2,
                    64 // Increased segments for circular precision
                );
                
                for p in arc_points {
                    let dist = ((p[0]-last_x).powi(2) + (p[1]-last_y).powi(2) + (p[2]-last_z).powi(2)).sqrt();
                    total_dist_cut += dist;
                    points.push(GCodePoint {
                        x: p[0], y: p[1], z: p[2],
                        is_rapid: false,
                        line_number: (i + 1) as u32,
                        feedrate: current_f,
                    });
                    
                    bbox_min[0] = bbox_min[0].min(p[0]);
                    bbox_min[1] = bbox_min[1].min(p[1]);
                    bbox_min[2] = bbox_min[2].min(p[2]);
                    bbox_max[0] = bbox_max[0].max(p[0]);
                    bbox_max[1] = bbox_max[1].max(p[1]);
                    bbox_max[2] = bbox_max[2].max(p[2]);

                    if first_move {
                        workpiece_max_z = p[2];
                        workpiece_min_z = p[2];
                        first_move = false;
                    } else {
                        workpiece_max_z = workpiece_max_z.max(p[2]);
                        workpiece_min_z = workpiece_min_z.min(p[2]);
                    }

                    last_x = p[0];
                    last_y = p[1];
                    last_z = p[2];
                }
                last_is_rapid = false;
            } else {
                // Linear move (G0/G1)
                let is_rapid = m_type == 0;
                let dist = ((current_x - last_x).powi(2) + (current_y - last_y).powi(2) + (current_z - last_z).powi(2)).sqrt();
                
                if is_rapid { total_dist_rapid += dist; } else { total_dist_cut += dist; }

                points.push(GCodePoint {
                    x: current_x, y: current_y, z: current_z,
                    is_rapid,
                    line_number: (i + 1) as u32,
                    feedrate: current_f,
                });

                if !is_rapid {
                    if first_move {
                        workpiece_max_z = current_z;
                        workpiece_min_z = current_z;
                        first_move = false;
                    } else {
                        workpiece_max_z = workpiece_max_z.max(current_z);
                        workpiece_min_z = workpiece_min_z.min(current_z);
                    }
                }

                bbox_min[0] = bbox_min[0].min(current_x);
                bbox_min[1] = bbox_min[1].min(current_y);
                bbox_min[2] = bbox_min[2].min(current_z);
                bbox_max[0] = bbox_max[0].max(current_x);
                bbox_max[1] = bbox_max[1].max(current_y);
                bbox_max[2] = bbox_max[2].max(current_z);

                last_x = current_x;
                last_y = current_y;
                last_z = current_z;
                last_is_rapid = is_rapid;
            }
            last_f = current_f;
        }
    }

    // Sanitize bounding box if no points were found
    if points.is_empty() {
        bbox_min = [0.0, 0.0, 0.0];
        bbox_max = [0.0, 0.0, 0.0];
    }

    // Basic time estimate
    let f_cut_avg = if max_feedrate > 0.0 { max_feedrate } else { 1000.0 };
    let f_rapid_avg = 3000.0;
    let estimated_time_s = (total_dist_cut / (f_cut_avg / 60.0)) + (total_dist_rapid / (f_rapid_avg / 60.0));

    Ok(GCodeAnalysis {
        points,
        bbox_min,
        bbox_max,
        total_dist_cut,
        total_dist_rapid,
        estimated_time_s,
        min_z: bbox_min[2],
        max_z: bbox_max[2],
        workpiece_min_z,
        workpiece_max_z,
        min_feedrate: if min_feedrate == f32::MAX { 0.0 } else { min_feedrate },
        max_feedrate: max_feedrate,
    })
}
