# Material Visualization Strategy

In most CNC and laser software, visualizing the material (the stock or workpiece) in the bed visualizer is usually an external setting or manual entry, rather than something embedded in the gcode itself.

## Current Industry Practices

Here is how it is typically handled depending on the software you are using:

### 1. Manual Entry (CAM Software)

In professional CAM (Computer-Aided Manufacturing) software like Fusion 360, Vectric VCarve, or Carveco, you define the material during the "Setup" phase.

- **Where it goes:** You enter the dimensions (Length, Width, Thickness) manually into the software's workspace settings.
- **Visualization:** The software creates a 3D box (the "Stock") around your design. This is for your preview only; when you export the gcode, it only contains the tool's movement paths, not the "image" of the wood or metal.

### 2. Laser Software (e.g., LightBurn)

For laser cutting and etching, visualizing the material is often done via a Camera Overlay or manual workspace alignment.

- **Camera Overlay:** If your machine has a camera, you click a "Background" or "Update Overlay" button. This takes a photo of the actual material on the bed and places it behind your design in the workspace.
- **Manual Framing:** If you don't have a camera, you use the "Frame" button to move the laser head around the boundary of your material to ensure the design fits.
- **Material Library:** LightBurn's Material Library stores settings (speed/power) for different materials, but it doesn't automatically "draw" the material on the screen for you.

### 3. Machine Controllers (e.g., OctoPrint, CNCjs, gSender)

If you are using a "Bed Visualizer" plugin (like the one in OctoPrint), these are almost exclusively for leveling, not for material visualization.

- **Bed Level Visualizer:** This uses G29 or similar commands to probe the bed's surface and show you a topographic 3D map of how warped your bed is. It does not show the material you are cutting.
- **Visualizer Tabs:** Tools like NC Viewer or the visualizer in CNCjs show the "Tool Path" (the lines the bit will follow) but generally do not show the physical block of material unless you use a simulator like CAMotics.

## Summary Table

| Method | Where to put it? | Is it in the gcode? |
| :--- | :--- | :--- |
| **CAM Setup** | Stock/Job Setup settings in the software. | No (Software only). |
| **Laser Visualization** | Camera capture or manual background image. | No. |
| **Simulators (CAMotics)** | "Workpiece" configuration settings. | No (User-defined). |
| **Bed Leveling** | Probing commands (e.g., M420 V). | Yes, but only for height data. |

---

## Gtaurus Implementation Strategy (Enhanced)

To make Gtaurus feel premium, we should offer "Virtual Stock" visualization. This bridges the gap between raw toolpaths and the final workpiece.

### Conceptual Features

1. **Manual Stock Definition**: A dedicated panel or settings group where the user enters `Width`, `Height`, `Thickness`, and `Origin` (Center vs. Bottom-Left).
2. **Material Textures**: Pre-defined presets for typical materials (Pine, MDF, Aluminum, Carbon Fiber) to provide realistic 3D feedback.
3. **Ghosting/Transparency**: The ability to make the stock semi-transparent so the user can see toolpaths *inside* the material (crucial for 3D paths).
4. **Auto-Framing Bounds**: If a G-code file is loaded, Gtaurus can "guess" the minimal stock size required by calculating the bounding box of the paths.

### The Bottom Line

If you want to see a 3D block of wood or a specific image of your material behind your toolpaths, you must enter those dimensions manually into your CAM software or simulator settings. Gcode is "blind" to the material; it only knows where the tool should move in 3D space.

---

## Technical Implementation Plan

### 1. State Management (`settingsStore.ts`)

Add a `stock` object to the `Settings` interface:

```typescript
export interface StockSettings {
  enabled: boolean;
  width: number;
  height: number;
  thickness: number;
  offsetX: number; // Offset from Machine Origin (0,0)
  offsetY: number;
  material: 'pine' | 'mdf' | 'aluminum' | 'pvc';
  opacity: number;
}
```

### 2. 3D Component (`BedVisualizer.tsx`)

Create a `<StockMesh />` component that:

- Uses `BoxGeometry` based on the width/height/thickness settings.
- Positions it relative to the machine origin.
- Applies a `meshStandardMaterial` with a color or texture matching the selected material.
- Uses `opacity` for transparency mode.

### 3. UI Controls (`SettingsPanel.tsx`)

Add a "Workpiece / Stock" section within **General** or a new **Visualizer** section:

- Toggle for visualization.
- Numeric inputs for X, Y, Z dimensions.
- Origin offset controls.
- Dropdown for material selection.

### 4. Integration with G-code

When a file is parsed in the future:

- Display a "Match Stock to Path" button to automatically set dimensions to the toolpath bounding box.
