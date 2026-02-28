/**
 * @file gcodeStore.ts
 * @purpose Handles G-code file data, including bounds calculation, path simulation, and real-time position tracking.
 */
import { create } from 'zustand';

export interface GcodePoint {
  x: number;
  y: number;
  z: number;
  isRapid: boolean;
}

interface GcodeStore {
  gcode: string;
  simulatedPath: GcodePoint[];
  actualPath: GcodePoint[];
  isSimulating: boolean;
  simulationSpeed: number; // Points per second
  simPos: GcodePoint | null;
  activeFileName: string | null;
  activeFilePath: string | null;
  /** The tool number requested by the current G-code file (e.g. from T1 M6) */
  fileToolNumber: number | null;
  /** Calculated bounds of the current G-code file (in Work Coordinates) */
  bounds: {
    minX: number; maxX: number;
    minY: number; maxY: number;
    minZ: number; maxZ: number;
  } | null;
  setGcode: (gcode: string, fileName?: string, filePath?: string) => void;
  simulate: () => Promise<void>;
  cancelSimulation: () => void;
  clearSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  addActualPoint: (point: GcodePoint) => void;
  clearActualPath: () => void;

  // Helper for actual path tracking
  lastActualPoint: GcodePoint | null;
  reset: () => void;
}

export const useGcodeStore = create<GcodeStore>((set, get) => ({
  gcode: '',
  simulatedPath: [],
  actualPath: [],
  isSimulating: false,
  simulationSpeed: 10,
  simPos: null,
  activeFileName: null,
  activeFilePath: null,
  fileToolNumber: null,
  bounds: null,
  lastActualPoint: null,

  setGcode: (gcode, fileName, filePath) => {
    // Parse for tool number (e.g. T1, T01, T12)
    const tMatch = gcode.match(/T(\d+)/i);
    const toolNum = tMatch ? parseInt(tMatch[1]) : null;

    // Fast bounds calculation (without animation logic)
    const lines = gcode.split('\n');
    let curX = 0, curY = 0, curZ = 0;
    let isRel = false, isInch = false;
    let minX = 0, maxX = 0, minY = 0, maxY = 0, minZ = 0, maxZ = 0;

    for (let raw of lines) {
       let line = raw.split('(')[0].split(';')[0].trim().toUpperCase();
       if (!line) continue;
       if (line.includes('G20')) isInch = true;
       if (line.includes('G21')) isInch = false;
       if (line.includes('G90')) isRel = false;
       if (line.includes('G91')) isRel = true;

       if (line.includes('X') || line.includes('Y') || line.includes('Z')) {
         const scale = isInch ? 25.4 : 1.0;
         const xm = line.match(/X([-+]?[0-9]*\.?[0-9]+)/);
         const ym = line.match(/Y([-+]?[0-9]*\.?[0-9]+)/);
         const zm = line.match(/Z([-+]?[0-9]*\.?[0-9]+)/);
         
         if (xm) { const v = parseFloat(xm[1]) * scale; curX = isRel ? curX + v : v; }
         if (ym) { const v = parseFloat(ym[1]) * scale; curY = isRel ? curY + v : v; }
         if (zm) { const v = parseFloat(zm[1]) * scale; curZ = isRel ? curZ + v : v; }

         minX = Math.min(minX, curX); maxX = Math.max(maxX, curX);
         minY = Math.min(minY, curY); maxY = Math.max(maxY, curY);
         minZ = Math.min(minZ, curZ); maxZ = Math.max(maxZ, curZ);
       }
    }

    set({ 
      gcode, 
      activeFileName: fileName || null, 
      activeFilePath: filePath || null,
      fileToolNumber: toolNum,
      bounds: { minX, maxX, minY, maxY, minZ, maxZ }
    });
  },

  clearSimulation: () => set({ simulatedPath: [], isSimulating: false, simPos: null }),

  cancelSimulation: () => set({ isSimulating: false, simPos: null }),

  setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),

  clearActualPath: () => set({ actualPath: [], lastActualPoint: null }),

  addActualPoint: (point) => {
    const { actualPath, lastActualPoint } = get();
    
    // De-dupe points that are very close to save memory/rendering
    if (lastActualPoint) {
      const dist = Math.sqrt(
        Math.pow(point.x - lastActualPoint.x, 2) +
        Math.pow(point.y - lastActualPoint.y, 2) +
        Math.pow(point.z - lastActualPoint.z, 2)
      );
      if (dist < 0.1) return; 
    }

    set({ 
      actualPath: [...actualPath, point],
      lastActualPoint: point
    });
  },

  simulate: async () => {
    const { gcode } = get();
    if (!gcode) return;

    // Reset previous simulation
    set({ simulatedPath: [], isSimulating: true, simPos: { x: 0, y: 0, z: 0, isRapid: true } });

    const lines = gcode.split('\n');
    const fullPath: GcodePoint[] = [];
    
    let curX = 0;
    let curY = 0;
    let curZ = 0;
    let isRelative = false;
    let isInches = false;
    let curMoveMode: 'G0' | 'G1' = 'G0';

    // 1. Pre-parse the entire path for geometry
    for (let rawLine of lines) {
      let line = rawLine.split('(')[0].split(';')[0].trim().toUpperCase();
      if (!line) continue;

      if (line.includes('G20')) isInches = true;
      if (line.includes('G21')) isInches = false;
      if (line.includes('G90')) isRelative = false;
      if (line.includes('G91')) isRelative = true;
      if (line.match(/G00?\b/)) curMoveMode = 'G0';
      if (line.match(/G0?1\b/)) curMoveMode = 'G1';
      
      if (line.includes('X') || line.includes('Y') || line.includes('Z')) {
        const xMatch = line.match(/X([-+]?[0-9]*\.?[0-9]+)/);
        const yMatch = line.match(/Y([-+]?[0-9]*\.?[0-9]+)/);
        const zMatch = line.match(/Z([-+]?[0-9]*\.?[0-9]+)/);

        let newX = curX;
        let newY = curY;
        let newZ = curZ;
        const scale = isInches ? 25.4 : 1.0;

        if (xMatch) {
          const val = parseFloat(xMatch[1]) * scale;
          newX = isRelative ? curX + val : val;
        }
        if (yMatch) {
          const val = parseFloat(yMatch[1]) * scale;
          newY = isRelative ? curY + val : val;
        }
        if (zMatch) {
          const val = parseFloat(zMatch[1]) * scale;
          newZ = isRelative ? curZ + val : val;
        }

        fullPath.push({ x: newX, y: newY, z: newZ, isRapid: curMoveMode === 'G0' });
        curX = newX;
        curY = newY;
        curZ = newZ;
      }
    }

    // 2. Animate the population of simulatedPath with an initial delay for better visibility
    await new Promise(resolve => setTimeout(resolve, 500));
    for (let i = 0; i < fullPath.length; ) {
      if (!get().isSimulating) break; // Check for cancellation

      // Re-read simulationSpeed inside the loop to allow live speed changes
      const speed = get().simulationSpeed;
      
      // Calculate timing based on speed
      // If speed < 60, we process 1 point at a time with a larger delay
      // If speed >= 60, we target 60fps and batch points
      const isSlow = speed < 60;
      const batchSize = isSlow ? 1 : Math.floor(speed / 60);
      const delay = isSlow ? 1000 / speed : 1000 / 60;

      i += batchSize;
      const slice = fullPath.slice(0, Math.min(i, fullPath.length));
      const lastPoint = slice[slice.length - 1];

      set({ 
        simulatedPath: slice,
        simPos: lastPoint
      });

      await new Promise(resolve => setTimeout(resolve, delay));
    }

    set({ isSimulating: false }); // Keep simPos at the final point instead of setting to null
  },

  reset: () => set({
    gcode: '',
    simulatedPath: [],
    actualPath: [],
    isSimulating: false,
    simulationSpeed: 10, // Updated default simulation speed
    simPos: null,
    activeFileName: null,
    activeFilePath: null,
    bounds: null,
    lastActualPoint: null
  })
}));
