# CNC Surfacing Strategy — Implementation Plan

## Scope (confirmed with user)

- **Strategy**: Raster surfacing only (pilot)
- **UI**: Dedicated `SurfacingWizard` modal (matching `CarveWizard` pattern)
- **After generation**: Save G-code to local storage path + open in `GCodeVisualizer`

---

## Git Feature Branch

All work for this feature is done on a dedicated branch, kept separate from `main` until the full surfacing pipeline is verified.

**Create the branch:**

```bash
git checkout main
git pull origin main
git checkout -b feature/cnc-surfacing-wizard
```

**Commit checkpoints (one commit per logical unit):**

| Commit | Scope | Message |
|--------|-------|---------|
| 1 | Rust | `feat(surfacing): add generate_surfacing_toolpath command` |
| 2 | Rust | `feat(surfacing): register surfacing command in mod.rs and lib.rs` |
| 3 | Store | `feat(surfacing): add isSurfacingWizardOpen state to wizardStore` |
| 4 | UI | `feat(surfacing): add SurfacingWizard component (4-step wizard)` |
| 5 | UI | `feat(surfacing): mount SurfacingWizard and wire trigger button` |

**Merge back to main when:**

- All 5 commits are clean
- `cargo build` passes with no errors
- `npm run typecheck` (or `tsc --noEmit`) passes
- The wizard opens, generates valid G-code, saves the file, and opens it in the GCodeVisualizer

```bash
git checkout main
git merge --no-ff feature/cnc-surfacing-wizard -m "feat: merge cnc surfacing wizard"
git push origin main
```

---

## Architecture Overview

```
User opens SurfacingWizard
        │
        ├─ Step 1: Tool Selection (filter to 'surfacing' type from toolStore)
        ├─ Step 2: Surfacing Parameters (dimensions, depth, stepover, angle, direction, etc.)
        ├─ Step 3: 2D Preview (canvas-based toolpath preview rendered in-browser)
        └─ Step 4: Generate → Save → Open Visualizer
                        │
                        └─ invoke('generate_surfacing_toolpath') [Rust]
                                │
                                └─ Returns G-code string
                                        │
                                        └─ invoke('save_local_file') → openVisualizer()
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/wizards/SurfacingWizard.tsx` | New 4-step wizard component |
| `src-tauri/src/commands/surfacing.rs` | Rust command: `generate_surfacing_toolpath` |

## Files to Modify

| File | Change |
|------|--------|
| `src/stores/wizardStore.ts` | Add `isSurfacingWizardOpen`, `openSurfacingWizard`, `closeSurfacingWizard` |
| `src-tauri/src/commands/mod.rs` | Add `pub mod surfacing;` |
| `src-tauri/src/lib.rs` | Register `commands::surfacing::generate_surfacing_toolpath` in invoke_handler |
| `src/App.tsx` (or `DashboardLayout.tsx`) | Mount `<SurfacingWizard />` and wire the trigger button |

---

## Step-by-Step Implementation

### 1. Rust Backend — `src-tauri/src/commands/surfacing.rs`

Implement `generate_surfacing_toolpath` as a `#[tauri::command]`:

**Parameters:**

```rust
pub fn generate_surfacing_toolpath(
    width: f32,           // Stock width (X), mm
    height: f32,          // Stock height (Y), mm
    total_depth: f32,     // Total material to remove, mm
    depth_per_pass: f32,  // Max depth per Z-layer, mm
    stepover: f32,        // Pass spacing, mm (e.g. 0.6 * tool_diameter)
    angle_deg: f32,       // 0 = X-parallel, 90 = Y-parallel, 45 = diagonal
    overtravel: f32,      // Extension past stock boundary, mm
    bidirectional: bool,  // true = zig-zag, false = unidirectional
    safe_z: f32,          // Retract height for rapids, mm
    feedrate: f32,        // Cut feedrate, mm/min
    plunge_rate: f32,     // Z plunge feedrate, mm/min
    spindle_rpm: u32,     // Spindle speed
    finish_pass: bool,    // Add a final 0.05mm cleanup pass
) -> Result<String, String>
```

**Returns:** G-code string

**Algorithm (raster):**

1. Compute number of Z passes: `ceil(total_depth / depth_per_pass)`
2. Emit G-code preamble: `G21` (mm), `G90` (absolute), `G94`, `M3 S{rpm}`, `G0 Z{safe_z}`
3. For each Z layer `i` (1..=num_passes):
   - `current_z = -(i as f32 * depth_per_pass).min(total_depth)`
   - Rotate the stock bounding box by `-angle_deg` to find scan axis extents
   - Generate parallel scan lines spaced `stepover` apart from `-(overtravel)` to `width/height + overtravel` (perpendicular axis)
   - For each scan line, alternating direction if `bidirectional`:
     - Rapid to start of line at `safe_z`
     - Plunge to `current_z` at `plunge_rate`
     - Cut to end of line at `feedrate`
     - If unidirectional: retract to `safe_z`, rapid back
   - Rotate points back to world coordinates
4. If `finish_pass`: emit one additional layer at `-(total_depth + 0.05)` (capped to `total_depth`)
5. Emit G-code postamble: `G0 Z{safe_z}`, `M5`, `M30`

**Register in `mod.rs`:** `pub mod surfacing;`
**Register in `lib.rs`:** `commands::surfacing::generate_surfacing_toolpath`

---

### 2. Zustand — `src/stores/wizardStore.ts`

Add surfacing wizard state alongside the existing carve wizard state:

```ts
isSurfacingWizardOpen: boolean;
openSurfacingWizard: () => void;
closeSurfacingWizard: () => void;
```

---

### 3. UI — `src/components/wizards/SurfacingWizard.tsx`

Pattern mirrors `CarveWizard.tsx`: uses `<Wizard>` from `src/components/ui/Wizard.tsx`.

**Local state:**

```ts
// Tool
selectedToolId: string | null

// Parameters (with sensible defaults)
surfacingWidth: number    // defaults to settings.stock.width
surfacingHeight: number   // defaults to settings.stock.height
totalDepth: number        // default 1.0
depthPerPass: number      // default 0.5
stepoverPct: number       // default 50 (% of tool diameter)
angleDeg: number          // default 0
bidirectional: boolean    // default true
overtravel: number        // default (toolDiameter/2 + 2)
safeZ: number             // defaults to settings.general.safeHeight
feedrate: number          // defaults to settings.general.feedRate
plungeRate: number        // default feedrate * 0.3
spindleRpm: number        // default 18000
finishPass: boolean       // default false

// Generation state
isGenerating: boolean
generatedGcode: string | null
error: string | null
```

**Steps:**

**Step 1 — Tool Selection**

- Title: "Select Surfacing Bit"
- Filters `tools` from `useToolStore` to `type === 'surfacing'` (shows all if none exist)
- Shows tool cards with diameter and name, selecting sets `selectedToolId`
- `canProceed`: `selectedToolId !== null`

**Step 2 — Surfacing Parameters**

- Title: "Configure Pass"
- Inputs: Width (X), Height (Y), Total Depth, Depth/Pass, Step-over %, Angle°, Direction toggle (Zig-zag / Unidirectional), Over-travel, Safe Z, Feedrate, Plunge Rate, Spindle RPM, Finish Pass toggle
- Inline summary: calculates and displays `numPasses`, `numLines`, estimated distance
- `canProceed`: all values > 0

**Step 3 — 2D Preview**

- Title: "Toolpath Preview"
- An HTML `<canvas>` element that renders the raster pattern in-browser using JS (no backend call needed for preview)
- Algorithm: same raster logic but in TypeScript — draws lines on canvas at the configured angle, stepover, and overtravel scaled to fit the canvas
- Shows stock boundary (rectangle), toolpath lines (colored), and direction arrows

**Step 4 — Generate & Save**

- Title: "Generate G-code"
- "Generate" button calls `invoke('generate_surfacing_toolpath', {...params})`
- On success: calls `invoke('save_local_file', { path: settings.gcodeStoragePath, filename: 'surfacing_[timestamp].nc', content: gcode })`
- Then calls `useGcodeStore.getState().setGcode(gcode, filename, fullPath)` and `useVisualizerStore.getState().openVisualizer(fullPath)` to open the visualizer
- Shows G-code line count and estimated depth summary
- `canProceed` / final action: "Open in Visualizer" (calls the above chain)

---

### 4. Wire Up Trigger

Find the location where "Start Carving" or the main action buttons live and add a "Surface Workpiece" button that calls `openSurfacingWizard()`.

- Likely location: `src/components/DashboardLayout.tsx` or `src/components/Sidebar.tsx`
- Check `src/App.tsx` for where `<CarveWizard />` is mounted and add `<SurfacingWizard />` beside it

---

## Key Constraints / Notes

- The `'surfacing'` `ToolType` already exists in `src/stores/toolStore.ts:11` and the visualizer already renders it (`VisualizerScene.tsx:47,63`).
- `save_local_file` already exists in `src-tauri/src/commands/file_system.rs` — no new Rust file system code needed.
- `openVisualizer(filePath)` already exists in `visualizerStore.ts` — it calls `parse_gcode_file` internally.
- The `<Wizard>` component (`src/components/ui/Wizard.tsx`) is fully reusable — just supply a `steps` array.
- No new Tauri plugins or Rust crates are required; the surfacing command is pure math with no I/O.
- G-code units default to `G21` (mm); the `carvingUnits` setting from `settingsStore` should be respected if `inches` is selected (output `G20` instead and scale parameters).
