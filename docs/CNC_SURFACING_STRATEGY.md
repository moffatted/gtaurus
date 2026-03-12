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

- **Surfacing Area**: Typically defined by the stock bounding box.
- **Step-over**: 40–70% of the cutter diameter for optimal overlap.
- **Depth per Pass**: 0.1–0.5 mm (application-dependent).
- **Final Z Height**: The new established "Zero" level.

---

## 🧠 Surfacing Strategies

### 1. Raster Surfacing (Most Common)

This is the most straightforward method to implement and visualize.

- **Mechanism**: Generate parallel lines along the X or Y axis, offset by the step-over distance.
- **Advantages**: Low computational overhead, easy to visualize in Three.js, and simple material removal logic.

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

### Rust: Surfacing Toolpath Generation

```rust
#[tauri::command]
pub fn generate_surfacing_toolpath(
    width: f32,
    height: f32,
    depth: f32,
    stepover: f32,
    direction: String,
) -> Vec<(f32, f32, f32)> {
    let mut path = Vec::new();
    let mut offset = 0.0;
    let along_x = direction == "x";

    while offset < (if along_x { height } else { width }) {
        if along_x {
            // Horizontal raster line
            path.push((0.0, offset, depth));
            path.push((width, offset, depth));
        } else {
            // Vertical raster line
            path.push((offset, 0.0, depth));
            path.push((offset, height, depth));
        }
        offset += stepover;
    }
    path
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
