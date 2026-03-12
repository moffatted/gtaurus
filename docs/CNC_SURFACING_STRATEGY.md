# CNC Surfacing Strategy

A CNC surfacing strategy is a controlled, shallow, and uniform toolpath designed to remove the top layer of stock material. In a T3/Tauri application, this can be treated as a specialized case of toolpath generation combined with real-time 3D mesh modification for simulation.

To integrate surfacing into the **CNC Resume** and **Workpiece Simulation** workflows, the strategy covers three layers:

- **CAM Logic**: Generation of surfacing passes.
- **Simulation Logic**: Representation of cuts in the 3D workpiece mesh.
- **UI/UX Logic**: Exposing surfacing as a first-class operation.

---

## Understanding Workpiece Surfacing

Surfacing is a planar clearing operation with the following primary goals:

- **Uniform Removal**: Removing a consistent amount of material from the top of the stock.
- **Z-Reference Calibration**: Producing a perfectly flat reference surface for subsequent operations.
- **Stock Compensation**: Flattening warped, bowed, or uneven material.
- **Pocket Creation**: Optionally creating a "recessed" area if surfacing below the original stock height.

### Common Toolpath Patterns

- **Raster**: Zig-zag movements across the surface.
- **Offset Spiral**: Moving from the perimeter inward or vice versa.
- **One-Direction**: Climb-only milling for superior surface finish.

### Key Parameters

- **Surfacing Area**: Typically defined by the stock bounding box, but can be expanded for custom fixtures.
- **Step-over**: 40–70% of the cutter diameter for optimal overlap.
- **Total Depth**: The total amount of material to be removed.
- **Depth per Pass**: Maximum material removal in a single Z-layer (prevents tool deflection/stalling).
- **Over-travel (Overshoot)**: Extending the path past the stock boundary (e.g., 50% bit diameter + 2mm) to ensure clean edges.
- **Angle**: The direction of travel (0° for X, 90° for Y, or custom angles like 45° for grain alignment).
- **Cut Direction**:
  - **Bidirectional (Zig-Zag)**: Fastest, tool stays in the cut.
  - **Unidirectional (Climb/Conventional)**: Tool retracts and rapids back for each pass; superior finish.
- **Safe Retract Height**: The Z-height the tool lifts to during rapids between passes.
- **Finish Pass**: An optional final pass at a very shallow depth (e.g., 0.05mm) for high-quality surface finish.
- **Final Z Height**: The new established "Zero" level.

---

## 🧠 Surfacing Strategies

### 1. Raster Surfacing (Most Common)

This is the most straightforward method to implement and visualize.

- **Mechanism**: Generate parallel lines at a specified **Angle**, offset by the step-over distance.
- **Advantages**: Low computational overhead, easy to visualize in Three.js, and simple material removal logic. Supports **Bidirectional** travel to minimize air-time.
- **Grain Awareness**: Matching the angle to wood grain direction reduces tear-out.

### 2. Spiral/Offset Surfacing

A more advanced approach that often results in a better surface finish.

- **Mechanism**: Start at the stock perimeter and generate inward offset polygons until the center is reached.
- **Complexity**: Requires robust polygon offsetting (e.g., ClipperLib) and is more CPU-intensive.

### 3. Adaptive Surfacing (Height-Map Aware)

The "Professional" approach for high-precision flattening.

- **Mechanism**: Uses a height-map (probed or scanned) to remove only the required material to reach a flat plane.
- **Advantages**: Ideal for warped boards and integrates perfectly with resume logic.
- **Complexity**: Requires per-vertex mesh deformation and variable-Z toolpath generation.

---

## 🧱 3D Representation & Simulation

This layer ties directly into the **Three.js** simulation engine.

### Option A: Boolean Subtraction (Mesh CSG)

Subtracting a large rectangular volume from the workpiece mesh.

- **Pros**: Mathematically accurate.
- **Cons**: Computationally expensive, often prone to glitches in real-time.

### Option B: Height-Map Displacement (Recommended)

Treating the workpiece as a high-resolution grid of height samples.

- **Pros**: Extremely fast, native support for planar surfacing, and compatible with the broader carve simulation.
- **Cons**: Accuracy is dependent on grid resolution.

### Option C: Shader-Based Displacement

Using a height-map texture and vertex shaders for visualization.

- **Pros**: Fastest performance for purely visual feedback.
- **Cons**: Geometry is harder to export for physical analysis.

---

## 🧩 T3 + Tauri Architecture

### TypeScript (T3) — UI & Configuration

- Input for area, step-over, depth, and direction.
- Real-time 2D toolpath preview.
- Metadata calculation (estimated time, number of passes).

### Rust (Tauri Backend) — Geometry Engine

- High-performance toolpath generation.
- Polygon offsetting and height-map calculations.
- G-code generation and persistence.

### Three.js (Frontend) — Visualization

- Dynamic workpiece mesh rendering.
- Animated toolpath and cutter simulation.
- Real-time height-map updates during the "cut".

---

## 💻 Implementation Examples

```rust
#[tauri::command]
pub fn generate_surfacing_toolpath(
    width: f32,
    height: f32,
    total_depth: f32,      // Total removal (e.g. 2.0mm)
    depth_per_pass: f32,   // Max per layer (e.g. 0.5mm)
    stepover: f32,
    angle_deg: f32,        // 0 = X-wise, 90 = Y-wise
    overtravel: f32,       // Extension past boundary
    bidirectional: bool,   // Zig-zag vs Unidirectional
) -> Vec<Vec<(f32, f32, f32)>> {
    let mut all_layers = Vec::new();
    let num_passes = (total_depth / depth_per_pass).ceil() as i32;
    
    // Calculate vector components for arbitrary angle
    let angle_rad = angle_deg.to_radians();
    let dir_x = angle_rad.cos();
    let dir_y = angle_rad.sin();

    for i in 1..=num_passes {
        let current_z = -(i as f32 * depth_per_pass).min(total_depth);
        let mut layer_path = Vec::new();
        
        // Raster logic here (Simplified X/Y for example)
        // In full impl, we'd use a bounding box rotated by -angle_deg
        // and project back to world coordinates.
        
        all_layers.push(layer_path);
    }

    all_layers // Returns a list of layers, each containing a series of points
}
```

### TypeScript: Height-Map Update Logic

```typescript
/**
 * Updates the heightmap state based on a surfacing operation.
 */
function applySurfacing(
  heightmap: Float32Array, 
  toolpath: [number, number][], 
  surfacingZ: number
) {
  for (const [x, y] of toolpath) {
    const cell = getCellFromXY(x, y);
    // Only update if the new cut is deeper than existing material
    heightmap[cell] = Math.min(heightmap[cell], surfacingZ);
  }
  updateMeshFromHeightmap(heightmap);
}
```

---

## 🚀 Future Roadmap

The next phase involves selecting an initial strategy for implementation.

1. **Pilot Phase**: Implement simple **Raster Surfacing** to validate the mesh update pipeline.
2. **Integration**: Link surfacing depth to the **G54 Work Offset** automatically.
3. **Advanced**: Implement **Adaptive Surfacing** using probed height-map data.

**Next Question**: Should we begin with the basic Raster implementation or move directly into height-map-aware surfacing?
