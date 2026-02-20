use crate::autolevel::gcode_state::GCodeState;
use crate::autolevel::height_map::HeightMap;
use gcode::{GCode, Mnemonic};
use glam::DVec3;

const MAX_SEGMENT_LEN: f64 = 2.0;

/// Warps the GCode stream across the provided point cloud (HeightMap),
/// segmenting long moves into smaller steps to properly follow the contours.
pub fn parse_and_warp(gcode_str: &str, map: &HeightMap) -> String {
    let mut state = GCodeState::new();
    let mut output = String::with_capacity(gcode_str.len() * 2);

    let parsed = gcode::parse(gcode_str);

    for command in parsed {
        let warped_command = process_gcode_command(&command, &mut state, map);
        output.push_str(&warped_command);
        output.push('\n');
    }

    output
}

fn process_gcode_command(command: &GCode, state: &mut GCodeState, map: &HeightMap) -> String {
    if command.mnemonic() == Mnemonic::General {
        match command.major_number() {
            0 => {
                // G0: Rapid move. We DO NOT warp rapid moves to maintain "Safe Z" clearance over clamps.
                // But we must update our internal positioning state.
                state.update_from_command(command);
                return command_to_string(command);
            }
            1 => {
                // G1: Linear Interpolation (Cutting Move). Must be warped!
                let (start_x, start_y, start_z) = (state.x, state.y, state.z);
                let (end_x, end_y, end_z) = state.get_target_coordinates(command);

                let start = DVec3::new(start_x, start_y, start_z);
                let end = DVec3::new(end_x, end_y, end_z);

                // Important: we apply state changes only AFTER getting the current ones.
                state.update_from_command(command);

                // Optimization: If the move is strictly vertical (Z only), don't bother segmenting,
                // just apply the offset at the current XY.
                if (end.x - start.x).abs() < f64::EPSILON && (end.y - start.y).abs() < f64::EPSILON
                {
                    let z_offset = map.get_z_offset(end.x, end.y);
                    let warped_z = end.z + z_offset;
                    return format_g1_command(end.x, end.y, warped_z, state.f);
                }

                let segments = segment_and_warp(start, end, map, MAX_SEGMENT_LEN);
                return format_segments_as_gcode(segments, state.f);
            }
            2 | 3 => {
                // G2/G3 are Arcs. The most robust way to auto-level an arc is to convert it to
                // tiny G1 segments and warp *those*.
                // For now, let's treat it as a pass-through to avoid complex Arc geometry math,
                // with a FIXME warning in the terminal if encountered.
                eprintln!("Warning: Auto-leveler encountered Arcs (G2/G3). Arc warping not yet supported.");
                state.update_from_command(command);
                return command_to_string(command);
            }
            _ => {}
        }
    }

    // Pass M-codes (coolant, spindle, tool change) and other G-codes through untouched
    command_to_string(command)
}

fn segment_and_warp(start: DVec3, end: DVec3, map: &HeightMap, max_len: f64) -> Vec<DVec3> {
    // Only looking at the XY distance for segmentation.
    // We don't want to segment purely vertical plunge moves.
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let distance_xy = (dx.powi(2) + dy.powi(2)).sqrt();

    if distance_xy <= max_len {
        let z_offset = map.get_z_offset(end.x, end.y);
        return vec![DVec3::new(end.x, end.y, end.z + z_offset)];
    }

    let num_segments = (distance_xy / max_len).ceil() as usize;
    let mut segments = Vec::with_capacity(num_segments);

    for i in 1..=num_segments {
        let t = i as f64 / num_segments as f64;
        let curr_x = start.x + dx * t;
        let curr_y = start.y + dy * t;
        let curr_z = start.z + (end.z - start.z) * t;

        // Apply the warp to the interpolated point
        let z_offset = map.get_z_offset(curr_x, curr_y);
        segments.push(DVec3::new(curr_x, curr_y, curr_z + z_offset));
    }

    segments
}

/// Helper to serialize the GCode AST back to a string ensuring it matches exactly
fn command_to_string(command: &GCode) -> String {
    let mut s = format!("{}{}", command.mnemonic(), command.major_number());
    if command.minor_number() > 0 {
        s.push_str(&format!(".{}", command.minor_number()));
    }

    for arg in command.arguments() {
        s.push_str(&format!(" {}{}", arg.letter, arg.value));
    }
    s
}

/// Serializes multiple generated segments back to G-code.
/// Crucially formats floats to `.3` to prevent sending overly huge strings to the controller.
fn format_segments_as_gcode(segments: Vec<DVec3>, feedrate: Option<f64>) -> String {
    let mut out = String::new();
    let mut first = true;

    for point in segments {
        if first {
            if let Some(f) = feedrate {
                out.push_str(&format!(
                    "G1 X{:.3} Y{:.3} Z{:.3} F{:.1}\n",
                    point.x, point.y, point.z, f
                ));
            } else {
                out.push_str(&format!(
                    "G1 X{:.3} Y{:.3} Z{:.3}\n",
                    point.x, point.y, point.z
                ));
            }
            first = false;
        } else {
            out.push_str(&format!(
                "G1 X{:.3} Y{:.3} Z{:.3}\n",
                point.x, point.y, point.z
            ));
        }
    }

    // Trim the trailing newline because the loop in `parse_and_warp` adds it
    out.trim_end().to_string()
}

fn format_g1_command(x: f64, y: f64, z: f64, feedrate: Option<f64>) -> String {
    if let Some(f) = feedrate {
        format!("G1 X{:.3} Y{:.3} Z{:.3} F{:.1}", x, y, z, f)
    } else {
        format!("G1 X{:.3} Y{:.3} Z{:.3}", x, y, z)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_warper_g0_passthrough() {
        let map = HeightMap::new(0.0, 0.0, 10.0, 2, 2);
        let gcode = "G0 X10.0 Y10.0 Z5.0";
        let output = parse_and_warp(gcode, &map);

        // Ensure G0 remains G0, and coordinates aren't mangled by 3-decimal place injection
        assert_eq!(output.trim(), "G0 X10 Y10 Z5");
    }

    #[test]
    fn test_segmentation_distance() {
        let mut map = HeightMap::new(0.0, 0.0, 100.0, 2, 2);
        // Slope going up from 0 to 10
        map.set_z_at_index(0, 1, 10.0);
        map.set_z_at_index(1, 1, 10.0);

        let start = DVec3::new(50.0, 0.0, 0.0);
        let end = DVec3::new(50.0, 100.0, 0.0);

        let segments = segment_and_warp(start, end, &map, 10.0);
        assert_eq!(segments.len(), 10);

        let midpoint = segments[4];
        assert_eq!(midpoint.x, 50.0);
        assert!((midpoint.y - 50.0).abs() < 0.1);
        assert!((midpoint.z - 5.0).abs() < 0.1);
    }
}
