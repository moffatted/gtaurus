# Auto-Leveling Strategy

Finding high-quality, auto-leveling logic with a permissive license (like MIT or Apache 2.0) is the "golden ticket" for porting to Rust, as many established CNC projects use the copyleft GPL license.

The core logic of auto-leveling usually involves two steps: Probing (creating a point cloud of heights) and Bilinear Interpolation (adjusting G-code Z values based on that cloud).

## Top Candidates for Porting

| Project | License | Tech Stack | Portability Note |
| :--- | :--- | :--- | :--- |
| OpenCNCPilot | MIT | C# / .NET | Best Match. Highly modular logic for G-code warping and bilinear interpolation. The math is very clean. |
| cnccoder (Rust) | MIT/Apache | Rust | Already in Rust. While not a full "auto-leveler," it handles G-code generation and is built for the Rust ecosystem. |
| bCNC | GPL-2.0 | Python | Reference only. Features robust leveling and "skew" compensation, but the license is restrictive for direct porting into a private project. |
| CNCjs Autolevel | MIT | Node.js | Great for seeing how a "widget" interacts with a live serial stream (GRBL/Smoothie). |

## Core Logic to Port (The "Widget" Math)

To build this in Rust, you don't necessarily need a whole app; you need a library that performs G-code warping.

- **Grid Sampling**: Define a X/Y bounding box and subdivide it into a grid (e.g., every 10mm).
- **Point Search**: For any given X,Y coordinate in your G-code, find the four surrounding probed points.
- **Bilinear Interpolation**: Calculate the height offset $Z_{offset}$ at that specific point using standard bilinear interpolation mapping formulas.
- **Segmentation**: Long linear moves (G1) must be broken into smaller segments if they cross grid boundaries, ensuring the tool follows the curve of the material rather than cutting a straight line through the air.

### Recommended Strategy

I recommend looking at the OpenCNCPilot GitHub repository. Since it is MIT licensed, you can freely translate its `Plane.cs` or `HeightMap.cs` logic into idiomatic Rust. It specifically handles the "warping" of arcs (G2/G3) and linear moves (G1) by converting them into small segments.

---

## 1. The Data Structure

In Rust, we can use a simple 2D grid. For a production tool, you’d likely use `ndarray`, but a flat `Vec` works perfectly for a standalone widget.

```rust
struct HeightMap {
    min_x: f64,
    min_y: f64,
    spacing: f64,
    cols: usize,
    rows: usize,
    data: Vec<f64>, // Probed Z values
}

impl HeightMap {
    // Bilinear interpolation to find Z at any (x, y)
    fn get_z_offset(&self, x: f64, y: f64) -> f64 {
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

## 2. The Logic Flow

To port the behavior of a tool like OpenCNCPilot, your Rust logic should follow this pipeline:

1. **Parse**: Use a crate like `gcode` to parse the incoming file into an AST.
2. **Analyze**: Find the $X_{min}$, $Y_{min}$, $X_{max}$, $Y_{max}$ to suggest a probing grid.
3. **Warp (The "Meat")**:
    - Iterate through every G1, G2, or G3 move.
    - Check the distance of the move. If it's longer than your spacing, split it.
    - For every point (original or split), calculate the new $Z_{adj} = Z_{orig} + Z_{offset}$.
4. **Emit**: Write the modified G-code back to a string or serial port.

## 3. Mathematical Formula for Porting

When you implement the `get_z_offset`, you are essentially solving for a point on a surface defined by four points: $Q_{11}, Q_{21}, Q_{12}, Q_{22}$.

The formal equation you'll be translating into Rust is standard Bilinear Interpolation.

### Why Rust is better for this

- **Zero-cost abstractions**: Iterating over thousands of G-code segments and performing floating-point math is significantly faster than the Python-based implementations found in older CNC controllers.
- **Safety**: Handling serial communication (to actually perform the probing) is much more robust in Rust thanks to the `serialport` crate.

## 4. The Segmentation Algorithm

Segmentation is the "secret sauce" of auto-leveling. Without it, a 100mm move from (0,0) to (100,0) remains a single straight line in 3D space, completely ignoring the measured dips and peaks in between.

To solve this, you need to break long moves into smaller segments (usually 2mm to 5mm each) and recalculate the Z for every new vertex.

In Rust, you can implement this by calculating the Euclidean distance of a move and dividing it by a `max_segment_len`.

```rust
struct Point3D { x: f64, y: f64, z: f64 }

fn segment_and_warp(start: Point3D, end: Point3D, map: &HeightMap, max_len: f64) -> Vec<Point3D> {
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

### Handling the "G-code Bloat"

One trade-off with this approach is that your G-code file size will grow significantly (often 5x to 10x). When porting this to a Rust "widget":

- **Precision Management**: Use `format!("{:.3}", val)` to prevent sending 15 decimal places to the CNC controller, which can overwhelm the serial buffer.
- **State Tracking**: Keep track of the current X,Y,Z (the "modal" state). G-code often omits coordinates that haven't changed (e.g., G1 X10 without a Y value). Your Rust logic must fill these in using the last known position before calculating the warp.

### Visualizing the Warp

When your code runs, it effectively transforms a flat coordinate system into a "topographical" one.

## 5. Next Steps for your Port

- **Crate Selection**: Add `gcode` for parsing and `serialport` for hardware communication to your `Cargo.toml`.
- **Probing Routine**: You'll need to generate a `G38.2` (probe toward workpiece) command for each point in your grid and parse the result (usually a `[PRB:...]` response from GRBL).

### Handling the GRBL Probe Response

Here is how you handle the "feedback loop" from the hardware in Rust. GRBL returns a very specific string when a probe (`G38.2`) hits the surface.

```rust
use regex::Regex;

fn parse_probe_report(line: &str) -> Option<(f64, f64, f64)> {
    // Example string: [PRB:120.000,80.000,-12.450:1]
    // The ':1' at the end indicates success.
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

Why this approach works:

- **The Regex**: It’s strict. It looks for the `:1` at the end, which ensures the probe actually triggered. If it’s `:0`, the probe failed, and you shouldn't trust the data.
- **The Flow**: Your AI IDE will understand that it needs to map these parsed coordinates into your `HeightMap` vector.

**Pro-Tip**: When generating the G-code output, limit float precision to 3 decimal places. CNC controllers have tiny serial buffers, and long floats can choke the planner.

## 6. Project Configuration

The `Cargo.toml` configuration with specific crates known for stability in the CNC/Robotics space:

```toml
[package]
name = "rust-cnc-autolevel"
version = "0.1.0"
edition = "2021"

[dependencies]
# The gold standard for G-code parsing in Rust
gcode = "0.6.0"

# For communicating with the GRBL/CNC hardware
serialport = "4.3.0"

# For parsing the [PRB:...] responses from the controller
regex = "1.10"

# Essential for the bilinear interpolation and coordinate math
glam = "0.25" # Fast 2D/3D math library (better than raw f64 arrays)

# Optional: for a CLI progress bar during probing
indicatif = "0.17"
```

Why these specific crates?

- **gcode**: Read files lazily via Iterator rather than loading the whole file at once.
- **glam**: Simplifies math, e.g., using `Vec3` for simple distance and vector calculations.
- **serialport**: Solid cross-platform crate for handling GRBL's 115200 baud serial connection.

## 7. The Logic Filter (Ignore Non-moves)

To ensure you don't accidentally "warp" a tool change (M6) or a spindle speed command (S12000), you need a robust match strategy.

```rust
use gcode::{Mnemonic, GCode};

fn process_gcode_line(command: &GCode, state: &mut GCodeState, map: &HeightMap) -> String {
    match command.mnemonic() {
        Mnemonic::General(0) | Mnemonic::General(1) => {
            // G0 or G1: Linear Move
            let start = state.current_pos;
            let end = update_state_from_args(command, state);
            
            // This is where you call the segmentation logic we discussed
            let segments = segment_and_warp(start, end, map, 2.0);
            format_segments_as_gcode(segments)
        },
        Mnemonic::General(2) | Mnemonic::General(3) => {
            // G2 or G3: Arcs
            // Pro-tip: Convert Arcs to many small G1 segments first, then warp.
            // Most hobby CNCs handle small G1 segments smoother than warped arcs.
            process_arc_as_segments(command, state, map)
        },
        _ => {
            // Ignore M-codes, T-codes, or G-codes like G54 (Work Offset)
            // Just pass them through untouched to the machine
            command.to_string()
        }
    }
}
```

> **Warning:** When updating State from args (e.g., `update_state_from_args`), only update X, Y, and Z if they are explicitly present. If a command only specifies X, the Y and Z MUST remain at their last known values.

## 8. Testing the Interpolation Warp

Testing is your safety net in CNC development. This test simulates a 100mm move across a surface that slopes upward from 0mm to 10mm.

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
                0.0,  0.0,  // Bottom row (y=0): Z=0 for both x=0 and x=100
                10.0, 10.0, // Top row (y=100): Z=10 for both x=0 and x=100
            ],
        };

        // 2. Define a move from (50, 0, 0) to (50, 100, 0)
        // This move goes straight up the middle of the slope.
        let start = Point3D { x: 50.0, y: 0.0, z: 0.0 };
        let end = Point3D { x: 50.0, y: 100.0, z: 0.0 };
        
        // 3. Segment the move (max 10mm segments)
        let segments = segment_and_warp(start, end, &map, 10.0);

        // 4. Assertions
        assert!(segments.len() >= 10, "Should have at least 10 segments");
        
        // Check the midpoint (around y=50)
        let midpoint = segments[segments.len() / 2];
        assert!((midpoint.z - 5.0).abs() < 0.1, "Midpoint Z should be ~5.0");
        
        // Check the final point
        let last_point = segments.last().unwrap();
        assert!((last_point.z - 10.0).abs() < 0.1, "Final Z should be ~10.0");
    }
}
```

## 9. One Final Warning: The "Retract" Height

When your code processes a `G0` (Rapid Move), make sure your logic doesn't just warp the Z. Usually, `G0` is used to clear clamps. If your auto-leveler lowers a "clearance" move because the bed dips there, you might hit a fixture.

**Pro-tip**: Most developers only apply the warp to "Cutting Moves" (`G1`, `G2`, `G3`) and keep `G0` at a fixed "Safe Z" height.

## Comments from Gemini 3 Pro High

### 1. Architectural Fit

The auto-leveling logic should reside entirely within the Rust backend (`src-tauri`) rather than the React frontend. Your Rust backend is already built for high-performance processing and serial stream management, which is exactly what we need when parsing and heavily manipulating tens of thousands of G-code lines.

### 2. Implementation Approach

I would approach this in four distinct phases:

#### Phase 1: Probing Control & Data Collection

- **The UI**: We'll add a new "Auto-Leveling" panel in the React frontend where you define the Area Width/Height and Grid Spacing (e.g., probe every 10mm).
- **The Backend Routine**: When the user clicks "Start Probing", a Tauri command will trigger a Rust state machine that sequentially sends `G38.2` (probe) commands across the grid.
- **Regex Feedback Loop**: We will utilize the string processing pattern outlined in the strategy file to capture the `[PRB:...]` responses coming back from the serial port, using that strictly structured data to populate a `HeightMap` struct stored in the Tauri Managed State.

#### Phase 2: Visualization

- Since the `HeightMap` is a grid of Z-values, we can easily serialize this `Vec<f64>` data and send it to the frontend via a Tauri event.
- We can overlay this grid onto the 3D Bed Visualizer (which we've discussed previously), visually demonstrating the "topography" of the warped PCB or stock material before the cut even begins.

#### Phase 3: The G-Code "Warper" (Data Processing)

- **Parsing**: We'll use the `gcode` Rust crate to iterate through your loaded G-code file.
- **Modal State Tracking**: G-code is notoriously stateful (e.g., a line might just say `X10` without `Y` or `Z`). We need to build a `GCodeStateTracker` that remembers the last known coordinates so our Z-offset math always has the correct `(X, Y)` context.
- **Segmentation**: For any cutting move (`G1`, `G2`, `G3`) that travels farther than our chosen resolution (e.g., > 2mm), we will physically inject new G-code lines, breaking that long move into tiny segmented steps that ride the mathematically interpolated curves of the `HeightMap`.

#### Phase 4: Execution Strategy (Pre-processing vs. Live)

- Instead of doing the math while streaming the cut to the machine (which can potentially starve the CNC controller's planner buffer and cause stuttering), we should pre-process the entire file.
- When a file is loaded and a `HeightMap` exists, the backend instantly generates a "Warped" version of the file in memory. The streaming infrastructure can then blindly send this warped file via the serial port as normal.

### 3. Critical Safeguards

When implementing this, we'll need to pay close attention to the following pitfalls mentioned in the strategy doc:

- **Protecting G0**: We must never warp `G0` (Rapid) moves. `G0` moves are used for safe traversal over clamps. If the material dips 2mm in the center and we warp a `G0` clearance move down by 2mm, we risk hitting a fixture. We should only warp `G1`/`G2`/`G3`.
- **Buffer Bloat**: Because we are splitting long lines into dozens of smaller segments, the file size will explode. It's imperative that when we format the new Z coordinates into strings, we strictly enforce `format!("{:.3}", val)` (3 decimal places) to keep the serial payload size manageable for standard controllers like GRBL.

### 4.  Additional thoughts

- **Firmware Considerations**: FluidNC and grblHAL are distinct, parallel firmware projects for 32-bit CNC control. While both share a common ancestor in the original 8-bit Grbl, they took different architectural paths.

| Feature | FluidNC | grblHAL |
| :--- | :--- | :--- |
| **Primary Platform** | Specifically optimized for ESP32. | Broadly portable (Teensy 4.1, STM32, ESP32, RP2040, etc.). |
| **Configuration** | YAML-based. No recompiling needed; upload a text file. | $ Settings & Plugins. Often requires compiling for deep changes. |
| **Architecture** | Object-oriented C++. Focuses on ease of use and wireless. | C-based with a strict HAL. Focuses on performance and extensibility. |
| **G-code Protocol** | Upward-compatible with Grbl 1.1. | Highly compatible; works with most Grbl senders. |

#### Hardware Compatibility

Because both projects support the ESP32, you can often flash either firmware onto the same controller board (e.g., MKS DLC32 or Jackpot CNC Controller). FluidNC is typically the default for ESP32 due to its `config.yaml` system, while grblHAL is preferred for features like S-Curve acceleration or Ethernet support on Teensy.

#### Implications for the Rust Auto-Leveler

Both firmwares appear almost identical to a G-code sender. They both utilize the standard Grbl serial protocol:

- `ok` / `error` responses.
- `?` for status queries.
- `[PRB:...]` for probe results.

For initial development, FluidNC on an ESP32 provides the easiest testing setup. If the project eventually requires higher speeds or industrial features like high-speed encoder feedback, grblHAL on a Teensy 4.1 is the recommended path.
