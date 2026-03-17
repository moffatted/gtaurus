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

## 📐 Why Stock Z-Height (Thickness) Is Critical

The X and Y dimensions tell the CNC *where* to move. The Z-dimension (stock thickness) tells it *how deep* it is safe to cut. Omitting or incorrectly entering the stock thickness is one of the most common causes of broken bits, motor stalls, and fire hazards in CNC surfacing.

### 1. Determining Depth of Cut and Number of Passes

Surfacing bits remove large surface areas but are not designed to take deep bites in a single vertical plunge. Knowing the stock thickness allows the CAM software to:

- Calculate the minimum number of Z-passes needed to reach the target depth safely.
- Enforce a per-pass limit (stepdown) that respects the bit's rated chip load and the machine's rigidity.
- Prevent the bit from being "buried" on the first plunge if the stock is thicker than expected.

**Example**: Stock is 25 mm thick, target final thickness is 18 mm → 7 mm must be removed. With a 2 mm stepdown that requires 4 passes (3 × 2 mm + 1 × 1 mm).

### 2. Finding and Setting Z-Zero at the High Point

Real-world lumber is rarely perfectly flat — boards are frequently bowed, cupped, or twisted. The correct Z-zero strategy is:

1. Measure the thickness at multiple points across the board (a digital caliper or dial indicator is ideal).
2. Identify the **highest point** (thickest spot).
3. Set Z-zero at that highest point.

If Z-zero is set at a low spot instead, the bit will collide with the higher sections as it traverses the X/Y axes — at full rapid speed.

> **Pro Tip**: Many experienced operators deliberately *overestimate* the stock thickness by 0.2–0.5 mm in software. This ensures the very first pass is a "ghost cut" (cutting air or the lightest possible skim) rather than immediately taking a full stepdown bite. It is far better to cut air than to snap a bit.

### 3. Calculating Final Thickness (S3S / S4S Processing)

Surfacing is often the first step in dimensioning rough lumber:

| Term | Meaning |
| --- | --- |
| **S2S** | Surfaced 2 Sides — top and bottom faces flattened |
| **S3S** | Surfaced 3 Sides — both faces + one edge |
| **S4S** | Surfaced 4 Sides — all faces and edges dimensioned |

Knowing the starting thickness is required to target a specific finished dimension and to avoid removing more material than intended.

### 4. Safe Rapid Clearance Height

The machine rapids between lines at `Safe Z`. If `Safe Z` is set lower than the actual stock top, the bit will plough through the material during every repositioning move.

**Rule**: `Safe Z` must always be set **above the stock top surface**, not above the assumed Z-zero.

The recommended formula used in gTaurus:

```text
Safe Z = stock_thickness + clearance_gap   (default clearance_gap = 5 mm)
```

When `stock_thickness` is read from `settings.stock.thickness` the wizard auto-computes this value and displays a warning if the user manually enters a `Safe Z` that is less than or equal to `stock_thickness`.

### 5. Inputs Required for a Complete Surfacing Strategy

| Input | Source in gTaurus | Purpose |
| --- | --- | --- |
| Stock X length | `settings.stock.width` | XY boundary of toolpath |
| Stock Y length | `settings.stock.height` | XY boundary of toolpath |
| **Stock thickness (Z)** | **`settings.stock.thickness`** | **Safe Z, pass count, over-depth guard** |
| Target removal depth | Wizard — Total Depth field | How much material to remove |
| Stepdown per pass | Wizard — Depth/Pass field | Chip-load safety limit |
| Safe Z clearance | Auto-computed (thickness + gap) | Rapid move safety height |

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

## Types of Surfacing Bits

Surfacing bits (also called spoilboard bits, flattening bits, fly cutters, or planer bits) are designed to remove a thin, uniform layer of material across a wide area. They differ from standard end mills in that they prioritize surface area coverage over precision profiling.

---

### 1. By Construction Type

#### Carbide-Tipped (Brazed)

Carbide cutting edges are permanently brazed (welded) onto a steel body.

- **Pros**: Lower upfront cost; widely available.
- **Cons**: When edges dull the entire bit must be replaced or professionally re-sharpened.
- **Best for**: Occasional use, hobbyist shops, budget builds.

#### Insert Carbide (Replaceable Knives)

Small square or triangular carbide inserts are held in pockets by a single set-screw or bolt.

- **Pros**: Most cost-effective long-term — rotate the insert to a fresh corner (typically 4 usable sides) or replace an insert for a few dollars.
- **Cons**: Higher initial purchase price; inserts must be seated properly to avoid runout.
- **Best for**: Production environments, frequent use, shops that run a variety of materials.

#### Solid Carbide

The entire cutting head is machined from a single carbide blank.

- **Pros**: Exceptional rigidity and runout accuracy; ideal for very shallow finishing passes.
- **Cons**: Expensive; not repairable if chipped.
- **Best for**: Precision aluminum or PCB surfacing.

---

### 2. By Blade Geometry

#### Wing Count

| Wings | Characteristic | Typical Use |
| --- | --- | --- |
| 2-wing | Aggressive chip clearance; faster material removal | Rough passes, softwoods |
| 3-wing | Balance of speed and finish quality | General purpose |
| 4-wing | Smoother finish; higher feed rates possible | Hardwoods, MDF |
| 5-wing | Finest surface finish; highest RPM requirement | Finish passes, sheet goods |

#### "2+2" Design

Four inserts arranged so two cut the floor flat and two act as side scorers. The scoring action severs wood fibers at the edge of the cut before the floor inserts clear the material, which virtually eliminates the fuzzy edge artifact common on MDF and veneered sheet goods.

#### Shear / Up-Shear Angle

Blades set at a positive helix angle rather than radially straight.

- **Up-shear**: Pulls chips upward and away from the surface. Ideal for soft, fibrous materials (balsa, foam, soft MDF).
- **Down-shear**: Pushes material down for a cleaner top face. Used on laminates and veneers where tear-out on the top surface must be avoided.
- **Straight (0°)**: Standard geometry; most common for spoilboard flattening.

---

### 3. By Center-Cutting Ability

#### Non-Center Cutting (Most Common)

Large surfacing bits typically have a relief hole or gap at the center spindle. The cutting edges do not reach the exact center of rotation, so the bit **cannot plunge vertically** into solid material.

- **Implication for G-code**: Toolpaths must ramp in from the edge of the stock or start with the cutter partially overhanging the edge. The surfacing wizard handles this automatically via the **overtravel** parameter.

#### Center-Cutting

Some smaller-diameter surfacing and fly-cutter designs are fully center-cutting and can plunge directly.

- **Typical diameter range**: Under 25 mm.
- **Implication for G-code**: Plunge moves are safe anywhere within the stock boundary.

---

### 4. By Cutter Style

#### Shell Mill / Face Mill

A wide-body tool (typically 25–80 mm) with multiple insert pockets arranged around the perimeter of a flat face. Produces a very flat, consistent surface in fewer passes due to wide cut width.

- **Spindle requirement**: High-torque spindle (2.2 kW+); not suitable for trim routers.
- **Typical step-over**: 60–80% of cutter diameter.

#### Fly Cutter

A single-insert tool that sweeps a large arc. Very wide effective cutting diameter from a lightweight body.

- **Pros**: Extremely low cost; can surface 150 mm+ in a single pass.
- **Cons**: Interrupted cut (one tooth); more vibration at high feed rates; requires very sharp insert to avoid burnishing.
- **Typical RPM**: 8,000–18,000 depending on diameter.

#### Spoilboard / Surfacing Router Bit

The most common form for hobbyist CNC routers. A dedicated multi-flute bit in the 22–50 mm diameter range, designed to run at router speeds (15,000–22,000 RPM).

- **Pros**: Runs on standard trim routers and spindles; plug-and-play with most hobby CNC setups.
- **Cons**: Narrower than a shell mill so more passes are required for wide stock.

---

### 5. Diameter vs. Step-over Reference

| Bit Diameter | Recommended Step-over (40–70%) | Passes for 750 mm wide stock |
| --- | --- | --- |
| 22 mm | 9–15 mm | ~50–85 |
| 32 mm | 13–22 mm | ~34–58 |
| 38 mm | 15–27 mm | ~28–50 |
| 50 mm | 20–35 mm | ~22–38 |
| 80 mm | 32–56 mm | ~14–24 |

---

### 6. Material Compatibility

| Material | Recommended Bit Type | Notes |
| --- | --- | --- |
| Pine / Softwood | Insert carbide, 2–3 wing | Low RPM to avoid burning |
| Hardwood (oak, maple) | Insert carbide, 3–4 wing | Climb milling preferred for finish |
| MDF / Plywood | Insert carbide "2+2" or shear | Fine dust — dust extraction critical |
| Aluminum | Solid carbide or fine-pitch insert | Flood coolant or air blast recommended |
| HDPE / PVC | 2-wing, up-shear | Sharp edges; low feed to avoid melting |
| PCB (FR4) | Solid carbide | Highly abrasive; short tool life expected |
| Foam / Balsa | Up-shear, 2-wing | Very low depth-per-pass to avoid tearing |

---

### 7. Future Integration Notes

The following bit attributes are candidates for inclusion in the **Tool Library** to enable the surfacing wizard to auto-populate recommended parameters:

- `is_center_cutting: bool` — gates whether a plunge move is safe
- `wing_count: u8` — used to suggest feed rate scaling
- `shear_angle_deg: f32` — informs chip-load calculations
- `effective_diameter_mm: f32` — used directly for step-over computation
- `max_rpm: u32` / `min_rpm: u32` — guards against over/under-speed warnings
- `material_tags: Vec<String>` — filters recommended presets in the wizard
