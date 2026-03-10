# G-code Visualizer & Time Estimation Strategy

This document outlines the technical strategy for implementing a high-performance 3D toolpath visualizer and a precise job duration estimator within the Gtaurus (Tauri/Next.js) environment.

## Current Implementation Snapshot (March 2026)

- Rust parser is active in production and returns point-level toolpath data plus aggregate metadata.
- Heightmap-based material removal is implemented and visually validated with correct depth scaling (example: 3mm cut on 6mm stock).
- Carved surface depth is generated from a canvas heightfield and applied to geometry vertices on the CPU, followed by normal recomputation for stable lighting.
- UI includes stock visualization, tool bit position/progress, bed/grid, WCS axes, and job footprint overlay.
- Time estimation currently uses distance/feed based approximation; advanced kinematic estimation remains planned.

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
  - **Current Resolution Strategy**: Fixed segmentation (64 segments per arc) for stable preview quality.
  - **Planned Improvement**: Dynamic segmentation based on tolerance (e.g., $0.01\text{mm}$ or $0.5^\circ$ steps).

### 1.2 Current Backend Data Structure

The backend currently returns point-based motion data plus aggregate analysis metadata.

```rust
struct GCodePoint {
  x: f32,
  y: f32,
  z: f32,
  is_rapid: bool,
  line_number: u32,
  feedrate: f32,
}

struct GCodeAnalysis {
  points: Vec<GCodePoint>,
  bbox_min: [f32; 3],
  bbox_max: [f32; 3],
  total_dist_cut: f32,
  total_dist_rapid: f32,
  estimated_time_s: f32,
  min_z: f32,
  max_z: f32,
  workpiece_min_z: f32,
  workpiece_max_z: f32,
  min_feedrate: f32,
  max_feedrate: f32,
  wcs: String,
  unit: String,
  comments: Vec<String>,
}
```

---

## 2. 3D Visualization Pipeline

To maintain 60FPS fluid interaction during preview:

- **Current Approach**: Heightmap-driven stock carving rendered in React Three Fiber.
- **Geometry Path**: A high-resolution plane stores carved topology; vertex heights are rebuilt from a canvas heightmap.
- **Lighting Fidelity**: Vertex normals are recomputed after displacement so cut depth reads correctly under scene lighting.
- **Interactive Progress**: Tool position and carved state update with progress through parsed points.
- **Planned Extensions**: Toolpath overlays, feedrate/depth heatmaps, and stronger segment-level diagnostics.

### 2.1 Visual Tokens

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

### 3.1 Kinematic Model Parameters

- **Max Acceleration ($A_{max}$)**: Defined per axis in $mm/s^2$.
- **Junction Deviation ($J_d$)**: Determines the maximum allowable velocity change at path corners.
- **Feedrate Override ($F_{ovr}$)**: Real-time scaling factor.

### 3.2 The Acceleration Profile

For every segment, the estimator calculates:

1. **Starting Velocity ($V_{start}$)**: Determined by the junction with the previous segment.
2. **Target Velocity ($V_{target}$)**: The commanded Feedrate ($F$).
3. **Distance to Accelerate**: $d_{accel} = \frac{V_{target}^2 - V_{start}^2}{2A}$.
4. **Actual Velocity**: In many short segments, the tool may never reach the commanded feedrate if the segment length is less than the required acceleration distance.

### 3.3 Canned Cycles & Dwells

- **G4 Dwells**: Add literal seconds.
- **G8x Cycles**: Expand "pecking" cycles into individual movements to calculate total distance and moves.

---

## 4. Implementation Roadmap

- [x] **Phase 1**: Rust backend parser for bbox and basic distance.
- [x] **Phase 2**: Frontend Integration & Global Modal.
- [x] **Phase 3**: R3F carving MVP (heightmap stock removal, tool progress, scene overlays).
- [ ] **Phase 4**: Advanced Kinematic Time Estimation.
- [ ] **Phase 5**: Advanced progress scrubber, layer analysis, and richer path diagnostics.

---

## 5. Optimization Targets

- **Web Workers**: Threading the geometry generation for ultra-large (50MB+) G-code files.
- **GPU Picking**: Efficient selection of individual toolpath segments for metadata inspection.
- **LOD (Level of Detail)**: Decimate toolpaths when zoomed out to protect VRAM.
- **Frustum Culling**: Only render segments within the active camera view.
- **Coordinate Systems**: Ensure $G54-G59$ offsets are correctly handled to align the visualizer with the physical machine workspace.

## 6. 3D CNC Carving Visualization Strategies

To visualize real-time material removal, we can employ several strategies depending on the required fidelity and performance constraints.

### 6.1 Boolean-based Geometry Carving (High Accuracy)

Subtracts a cutter mesh from the stock block for every toolpath segment.

- **How it works**:
  - Represent the workpiece as a high-density `BufferGeometry` or `BVH` (Bounding Volume Hierarchy).
  - Represent the cutter as a primitive (`CylinderGear` for end mills, `Sphere` for ball-nose).
  - Use Constructive Solid Geometry (CSG) for subtraction.
- **Libraries**:
  - `three-mesh-bvh`: High-speed raycasting and spatial indexing.
  - `three-bvh-csg`: Efficient, stable boolean operations.
- **Pros**: Produces actual manifold geometry; supports complex tool shapes.
- **Cons**: Computationally expensive for long paths; requires batching to maintain UI fluidity.

### 6.2 Heightmap Carving (Current Production Method)

Deforms a top-down grid based on Z-depth. This is the fastest method for 3-axis milling.

- **How it works**:
  - Create a highly subdivided `PlaneGeometry` (currently 512×512).
  - Paint a grayscale heightmap from parsed G-code points (white = surface, darker = deeper cut).
  - Use depth-preserving compositing so overlapping passes keep the deepest value.
  - Sample that heightmap to update geometry vertex heights, then recompute normals.
- **Pros**: Accurate and readable depth visualization for 3-axis top-down carving, interactive update speed, stable shading.
- **Cons**: Still a 2.5D model (no undercuts/side cuts), and steep walls can show resolution artifacts on extreme geometry.

### 6.3 Voxel-based Carving (Balanced Simulation)

The industry standard for complex CNC simulation.

- **How it works**:
  - Represent stock as a 3D voxel grid.
  - As the tool moves, voxels within the tool volume are flagged as "removed".
  - Use a "Marching Cubes" or "Dual Contouring" algorithm to generate a mesh from the voxels.
- **Pros**: Uniform performance regardless of path complexity; high accuracy for any 3D move.
- **Cons**: Requires custom voxel engine logic; high memory overhead for 1000^3 grids.

---

## 7. Recommendation for Gtaurus

Given the T3 stack's architecture and the current focus on 3-axis desktop milling:

1. **Immediate Step**: Continue refining the implemented **Heightmap Carving** method (edge quality, adaptive resolution, and performance on very large files). It currently provides the best UX for the majority of user projects (signs, PCB, pockets) with zero lag.
2. **Long-term Step**: Transition to **Voxel-based** simulation or **BVH Booleans** if the user needs full 5-axis or rotary axis simulation (e.g., carving a 3D statue).

## Visualizing Bit Changes

Multi-bit visualization should be implemented as an operation timeline, not a single monolithic stock state. The key idea is that each tool-change segment is its own operation, and each operation contributes to one cumulative stock result.

### 8.1 Required Data Model Changes (Parser + Store)

Current parser output is point-centric (`GCodePoint[]`). To support bit-change visualization, extend the analysis model with operation metadata and per-point operation assignment.

Proposed additions:

```rust
struct OperationInfo {
  id: u32,
  tool_number: Option<u32>,
  tool_name: Option<String>,
  start_point_idx: usize,
  end_point_idx: usize,
  start_line: u32,
  end_line: u32,
}

struct GCodePoint {
  x: f32,
  y: f32,
  z: f32,
  is_rapid: bool,
  line_number: u32,
  feedrate: f32,
  operation_id: u32,
}

struct GCodeAnalysis {
  // existing fields...
  operations: Vec<OperationInfo>,
}
```

Operation boundaries should be detected from:

- `Tn` tool selection
- `M6` tool change
- known tool-change comments when present

Notes:

- `operation_id` should be the canonical timeline identity.
- `tool_number` is metadata only (a tool can appear in multiple operations).

### 8.2 Heightmap Execution Model for Multi-Bit Jobs

For the current production method (heightmap carving), multi-bit support should remain cumulative:

1. Operation 1 paints/cuts the base heightmap.
2. Operation N paints only additional removal on top of prior state.
3. Composition mode remains depth-preserving (minimum height / deepest cut wins).

This preserves accuracy while avoiding a full architecture rewrite.

### 8.3 First Deliverable (Highest ROI): Color-per-Bit

Implement this first because it is high-value and low-risk.

- Assign each operation a stable color.
- Render operation tint as an overlay in playback/progress mode.
- Add legend: operation id, tool number/name, line range.

Outcome:

- Users can immediately see roughing vs finishing contribution.
- Multi-stage jobs become legible without changing carve-depth math.

### 8.4 Timeline and Tool-Change UX

Add operation-aware controls:

- **Playback Mode**: continuous (existing) and operation-step mode.
- **Jump Targets**: "After Operation N" quick navigation.
- **Tool Change Pause**: auto pause on operation boundary with instruction banner ("Swap to Tool X").

This aligns preview flow with real machine workflow.

### 8.5 Z-Offset Calibration (Mid-Carve Risk Preview)

Add a per-operation Z calibration value for simulation-only what-if analysis:

$$Z_{effective} = Z_{programmed} + \Delta Z_{operation}$$

Use this in the heightmap paint pass for that operation.

Warnings:

- if $Z_{effective} > Z_{programmed}$: air-cut risk
- if $Z_{effective} < Z_{programmed}$: overcut/gouge risk

This is especially useful for users who re-zero Z after an `M6`.

### 8.6 Rest Material Highlight (Advanced)

After operation metadata is available:

1. Build final reference heightmap from all operations.
2. Build current-operation heightmap for selected timeline point.
3. Compute remaining material map:

$$H_{remaining} = H_{current} - H_{final}$$

4. Highlight cells where $H_{remaining}$ exceeds tolerance.

This gives a clear "what this tool cannot reach" visualization.

### 8.7 Performance Plan

Avoid storing full heightmap snapshots for every operation at first.

- Store operation ranges and deterministically replay paint.
- Add checkpoint caching every N operations for fast scrubbing.
- Recompute only operation deltas between nearest checkpoint and target operation.

This keeps memory bounded while preserving interactivity on large files.

### 8.8 Recommended Rollout Order

1. Parser/store schema extension (`operation_id`, `operations[]`).
2. Color-per-Bit rendering + legend.
3. Operation-step timeline + tool-change pause UI.
4. Per-operation Z-offset calibration.
5. Rest material highlight.

This order delivers immediate user value while minimizing regression risk to the now-stable carve-depth implementation.