# Auto-Leveling Widget Implementation Guide

## Overview

Finding high-quality, auto-leveling logic with a permissive license (like MIT or Apache 2.0) is crucial for porting to Rust, as many established CNC projects use the copyleft GPL license.

The core logic of auto-leveling typically involves two main steps:

1. **Probing:** Creating a point cloud of heights.
2. **Bilinear Interpolation:** Adjusting G-code Z values based on that point cloud.

## Top Porting Candidates

| Project | License | Tech Stack | Portability Note |
| :--- | :--- | :--- | :--- |
| **OpenCNCPilot** | MIT | C# / .NET | **Best Match.** Highly modular logic for G-code warping and bilinear interpolation. Clean math. |
| **cnccoder** | MIT/Apache | Rust | Already in Rust. Handles G-code generation and built for Rust ecosystem, though not a full auto-leveler. |
| **bCNC** | GPL-2.0 | Python | Reference only. Robust leveling and skew compensation, but restrictive license. |
| **CNCjs Autolevel** | MIT | Node.js | Great for seeing how a widget interacts with a live serial stream (GRBL/Smoothie). |

## Core Logic to Port (The "Widget" Math)

To build this in Rust, a standalone library acting as a G-code warper is ideal. Key mathematical operations:

- **Grid Sampling:** Define an X/Y bounding box and subdivide it into a grid (e.g., every 10mm).
- **Point Search:** For any given (X,Y) coordinate in the G-code, find the four surrounding probed points.
- **Bilinear Interpolation:** Calculate the height Z offset at a specific point.
- **Segmentation:** Long linear moves (e.g., `G1`) must be broken into smaller segments if they cross grid boundaries to ensure the tool follows the material's curvature rather than cutting a straight line in 3D space.

## Rust Implementation Details

### 1. Project Dependencies (`Cargo.toml`)

```toml
[package]
name = "rust-cnc-autolevel"
version = "0.1.0"
edition = "2021"

[dependencies]
gcode = "0.6.0"      # The gold standard for G-code parsing in Rust
serialport = "4.3.0" # Communicating with the GRBL/CNC hardware
regex = "1.10"       # Parsing [PRB:...] responses from the controller
glam = "0.25"        # Fast 2D/3D math library for Vec3 types
indicatif = "0.17"   # Optional: CLI progress bar during probing
```

### 2. The Data Structure & Interpolation

A standard 2D grid structure is used to hold probed Z points. For production `ndarray` is recommended, but a flat `Vec` works perfectly here.

```rust
pub struct HeightMap {
    pub min_x: f64,
    pub min_y: f64,
    pub spacing: f64,
    pub cols: usize,
    pub rows: usize,
    pub data: Vec<f64>, // Probed Z values
}

impl HeightMap {
    /// Bilinear interpolation to find Z at any (x, y)
    pub fn get_z_offset(&self, x: f64, y: f64) -> f64 {
        let gx = (x - self.min_x) / self.spacing;
        let gy = (y - self.min_y) / self.spacing;

        let ix = gx.floor() as usize;
        let iy = gy.floor() as usize;

        // Boundary checks omitted for brevity
        let tx = gx - ix as f64;
        let ty = gy - iy as f64;

        let z00 = self.data[iy * self.cols + ix];
        let z10 = self.data[iy * self.cols + (ix + 1)];
        let z01 = self.data[(iy + 1) * self.cols + ix];
        let z11 = self.data[(iy + 1) * self.cols + (ix + 1)];

        // The Bilinear Interpolation Formula
        (1.0 - tx) * (1.0 - ty) * z00 +
        tx * (1.0 - ty) * z10 +
        (1.0 - tx) * ty * z01 +
        tx * ty * z11
    }
}
```

### 3. Segmentation Algorithm (The "Secret Sauce")

Without segmentation, a 100mm move remains a straight line, ignoring measured dips/peaks. By calculating the Euclidean distance, long moves are divided by a maximum segment length (`max_len`).

```rust
pub struct Point3D { 
    pub x: f64, 
    pub y: f64, 
    pub z: f64 
}

pub fn segment_and_warp(start: Point3D, end: Point3D, map: &HeightMap, max_len: f64) -> Vec<Point3D> {
    let dx = end.x - start.x;
    let dy = end.y - start.y;
    let distance = (dx.powi(2) + dy.powi(2)).sqrt();

    if distance <= max_len {
        // Move is short enough, just warp the end point
        let warped_z = end.z + map.get_z_offset(end.x, end.y);
        return vec![Point3D { x: end.x, y: end.y, z: warped_z }];
    }

    let num_segments = (distance / max_len).ceil() as usize;
    let mut segments = Vec::with_capacity(num_segments);

    for i in 1..=num_segments {
        let t = i as f64 / num_segments as f64;
        let curr_x = start.x + dx * t;
        let curr_y = start.y + dy * t;
        let curr_z = start.z + (end.z - start.z) * t;

        // Apply the warp to the intermediate point
        segments.push(Point3D {
            x: curr_x,
            y: curr_y,
            z: curr_z + map.get_z_offset(curr_x, curr_y),
        });
    }
    segments
}
```

### 4. Code Pipeline & Logic Filter

The processing pipeline filters G-code so that only movement commands map to warped segments.

> **Critical Note:**
> G-code is "modal", meaning if a line only explicitly sets `X10`, the `Y` and `Z` must be retained from the prior state. When writing `update_state_from_args()` ensure coordinates update conditionally.
> Only warp the `Z` coordinate. Warping `X` or `Y` implicitly ruins dimensional accuracy!
> Apply warping only to "Cutting Moves" (`G1`, `G2`, `G3`) and maintain standard "Safe `Z`" clearance heights for Rapid Moves (`G0`).

```rust
use gcode::{Mnemonic, GCode};

struct GCodeState { /*... */ } // Holds current modal state

fn process_gcode_line(command: &GCode, state: &mut GCodeState, map: &HeightMap) -> String {
    match command.mnemonic() {
        Mnemonic::General(0) | Mnemonic::General(1) => {
            // G0 or G1: Linear Move
            let start = state.current_pos;
            let end = update_state_from_args(command, state); // Only updates X/Y/Z if present in cmd
            
            // Call segmentation logic
            let segments = segment_and_warp(start, end, map, 2.0);
            format_segments_as_gcode(segments)
        },
        Mnemonic::General(2) | Mnemonic::General(3) => {
            // G2 or G3: Arcs
            // Convert arcs to multiple small G1 segments first, then warp.
            process_arc_as_segments(command, state, map)
        },
        _ => {
            // Pass through M-codes, T-codes, or system commands (like G54) untouched
            command.to_string()
        }
    }
}
```

#### Handling "G-Code Bloat"

Dividing movements arbitrarily balloons file sizes, causing "stuttering".
**Precision Management:** Use `format!("{:.3}", val)` when dumping G-code strings to restrict float length to 3 decimals, keeping CNC buffer requirements stable.

### 5. GRBL Probe Response

The widget queries actual heights via `G38.2` cycles and waits for `[PRB:...]` patterns. A Regex parsing snippet ensures the probe returned a `:1` success status (a `:0` means probing failed).

```rust
use regex::Regex;

pub fn parse_probe_report(line: &str) -> Option<(f64, f64, f64)> {
    // Expected format: [PRB:120.000,80.000,-12.450:1]
    let re = Regex::new(r"\[PRB:([\d\.-]+),([\d\.-]+),([\d\.-]+):1\]").unwrap();

    re.captures(line).map(|cap| {
        (
            cap[1].parse::<f64>().unwrap_or(0.0),
            cap[2].parse::<f64>().unwrap_or(0.0),
            cap[3].parse::<f64>().unwrap_or(0.0),
        )
    })
}
```

### 6. Verification / Unit Testing

Validate mathematically expected segments over a simulated linear plane.

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_interpolation_warp() {
        // 1. Setup a simple 2x2 HeightMap (a 100x100mm square)
        // Bottom-left (0,0) is Z=0.0 | Top-right (100,100) is Z=10.0
        let map = HeightMap {
            min_x: 0.0,
            min_y: 0.0,
            spacing: 100.0,
            cols: 2,
            rows: 2,
            data: vec![
                0.0,  0.0,  // y=0: Z=0 for both x=0 and x=100
                10.0, 10.0, // y=100: Z=10 for both x=0 and x=100
            ],
        };

        // 2. Define a planar test move from mid-Y=0.0 to mid-Y=100.0
        let start = Point3D { x: 50.0, y: 0.0, z: 0.0 };
        let end = Point3D { x: 50.0, y: 100.0, z: 0.0 };
        
        // 3. Segment the move, slicing it into max 10mm parts
        let segments = segment_and_warp(start, end, &map, 10.0);

        // 4. Verification Check
        assert!(segments.len() >= 10, "Should have at least 10 segments");
        
        // Ensure mid-point evaluation holds up
        let midpoint = segments[segments.len() / 2];
        assert!((midpoint.z - 5.0).abs() < 0.1, "Midpoint Z should be ~5.0");
        
        let last_point = segments.last().unwrap();
        assert!((last_point.z - 10.0).abs() < 0.1, "Final Z should be ~10.0");
    }
}
```
