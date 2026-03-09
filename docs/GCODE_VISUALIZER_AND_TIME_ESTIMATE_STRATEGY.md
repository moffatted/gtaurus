# G-code Visualizer & Time Estimation Strategy

This document outlines the technical strategy for implementing a high-performance 3D toolpath visualizer and a precise job duration estimator within the Gtaurus (Tauri/Next.js) environment.

## 1. Executive Summary

G-code files for complex 3D carvings can reach millions of lines. To maintain a responsive T3/Tauri UI, heavy lifting must be offloaded to the Rust backend. The visualization will utilize **React Three Fiber (R3F)** for high-performance WebGL rendering, while the time estimation algorithm will simulate machine kinematics (acceleration, feedrate limits) to provide realistic job completion times.

---

## 1. Geometric Data Extraction

The parser operates on a line-by-line streaming basis to minimize memory footprint. Key responsibilities include:

- **Streaming Implementation**: Read files line-by-line to minimize memory footprint.
- **Coordinate Normalization**:
  - Handle **G20/G21** (Inches/Metric).
  - Handle **G90/G91** (Absolute/Relative).
  - Track current machine state (last X, Y, Z, F).
- **Arc Interpolation (G2/G3)**:
  - Convert circular arcs into a series of small linear segments.
  - **Resolution Strategy**: Dynamic segmentation based on a configurable tolerance (e.g., $0.01\text{mm}$ or $0.5^\circ$ steps).

### 1.2 Data Structure

The backend returns a serialized JSON array of segments optimized for GPU buffers.

```rust
struct ToolpathSegment {
    start: [f32; 3],  // X, Y, Z
    end: [f32; 3],    // X, Y, Z
    is_rapid: bool,   // G0 vs G1/2/3
    feedrate: f32,    // Associated feed for time calc
    line_number: u32, // Mapping back to G-code editor
}
```

---

## 2. 3D Visualization Pipeline

To maintain 60FPS fluid interaction during preview:

- **Procedural Geometry**: Use `BufferGeometry` to minimize draw calls.
- **Instanced Scrubbing**: Allow users to slide through the toolpath chronological progression.
- **Heatmap Overlays**: Toggleable views for feedrate and Z-depth intensity.
- **InstancedMesh**: For rendering identical tool markers or repeated features.

### 2.1 Visual Tokens:

- **Plunges**: Bright high-contrast markers for material entry points.
- **Rapids**: Dashed or dim red lines for G0 travel.
- **Cutting**: High-signal cyan or orange for G1/G2/G3 moves.
- **Solid Simulation (Material Removal)**:
  - **Approach**: Thickened paths using `TubeGeometry` or `MeshLine`.
  - **Visual Trick**: Render "Material" as a semi-transparent block. Overlapping cylinders create a visual approximation of the final carved volume.
- **Z-Depth Heatmap**: Dynamic color gradient based on Z-depth to help the operator identify deep plunges.

### 2.2 Scene Integration

- **Bounding Box Calculation**: Rust provides min/max coordinates for automatic camera centering.
- **Work Envelope**: A wireframe box representing the machine's physical limits ($X, Y, Z$ travel).
- **Interactive Scrubber**: A UI slider that moves a 3D tool model along the path, synced with the code editor line.

---

## 3. High-Fidelity Time Estimation

A simple $D/F$ (Distance / Feedrate) calculation is insufficient for modern CNC operations. Gtaurus implements a multi-pass kinematic model:

### 3.1 Kinematic Model Parameters:

- **Max Acceleration ($A_{max}$)**: Defined per axis in $mm/s^2$.
- **Junction Deviation ($J_d$)**: Determines the maximum allowable velocity change at path corners.
- **Feedrate Override ($F_{ovr}$)**: Real-time scaling factor.

### 3.2 The Acceleration Profile

For every segment, the estimator calculates:

1.  **Starting Velocity ($V_{start}$)**: Determined by the junction with the previous segment.
2.  **Target Velocity ($V_{target}$)**: The commanded Feedrate ($F$).
3.  **Distance to Accelerate**: $d_{accel} = \frac{V_{target}^2 - V_{start}^2}{2A}$.
4.  **Actual Velocity**: In many short segments, the tool may never reach the commanded feedrate if the segment length is less than the required acceleration distance.

### 3.3 Canned Cycles & Dwells

- **G4 Dwells**: Add literal seconds.
- **G8x Cycles**: Expand "pecking" cycles into individual movements to calculate the true vertical distance traveled.

---

## 4. Implementation Roadmap

- [x] **Phase 1**: Rust backend parser for bbox and basic distance.
- [x] **Phase 2**: Frontend Integration & Global Modal.
- [ ] **Phase 3**: R3F implementation with BufferGeometry. (In Progress)
- [ ] **Phase 4**: Advanced Kinematic Time Estimation.
- [ ] **Phase 5**: Progress scrubber & Layer analysis.

---

## 5. Optimization Targets

- **Web Workers**: Threading the geometry generation for ultra-large (50MB+) G-code files.
- **GPU Picking**: Efficient selection of individual toolpath segments for metadata inspection.
- **LOD (Level of Detail)**: Decimate toolpaths when zoomed out to protect VRAM.
- **Frustum Culling**: Only render segments within the active camera view.
- **Coordinate Systems**: Ensure $G54-G59$ offsets are correctly handled to align the visualizer with the physical machine workspace.
