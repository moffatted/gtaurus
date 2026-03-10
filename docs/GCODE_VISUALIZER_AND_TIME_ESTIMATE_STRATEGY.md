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

### 6.2 Heightmap Displacement (Optimized 2.5D)

Deforms a top-down grid based on Z-depth. This is the fastest method for 3-axis milling.

- **How it works**:
  - Create a highly subdivided `PlaneGeometry` (e.g., 512×512).
  - Use a displacement texture representing depth.
  - As the tool moves, update the texture pixels under the tool radius with the lowest Z-value reached.
- **Pros**: Native GPU acceleration via displacement shaders; extremely interactive.
- **Cons**: Limited to top-down "height-field" cuts; cannot represent undercuts or side-drilled holes.

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

1. **Immediate Step**: Perfect the **Heightmap Displacement** method. It provides the best UX for the majority of user projects (signs, PCB, pockets) with zero lag.
2. **Long-term Step**: Transition to **Voxel-based** simulation or **BVH Booleans** if the user needs full 5-axis or rotary axis simulation (e.g., carving a 3D statue).

If you want to start implementing one of these, I can provide the boilerplate for a Voxel or CSG-based approach.
