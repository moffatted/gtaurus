import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface GCodePoint {
  x: number;
  y: number;
  z: number;
  is_rapid: boolean;
  line_number: number;
  feedrate: number;
}

export interface GCodeAnalysis {
  points: GCodePoint[];
  bbox_min: [number, number, number];
  bbox_max: [number, number, number];
  total_dist_cut: number;
  total_dist_rapid: number;
  estimated_time_s: number;
  min_z: number;
  max_z: number;
  workpiece_min_z: number;
  workpiece_max_z: number;
  min_feedrate: number;
  max_feedrate: number;
}

export type StockOrigin = 'Center' | 'FrontLeft' | 'FrontRight' | 'BackLeft' | 'BackRight';

interface VisualizerState {
  isOpen: boolean;
  isParsing: boolean;
  analysis: GCodeAnalysis | null;
  error: string | null;
  progress: number; // 0 to 1
  stockOrigin: StockOrigin;
  
  // Actions
  openVisualizer: (filePath: string) => Promise<void>;
  closeVisualizer: () => void;
  setProgress: (p: number) => void;
  setStockOrigin: (origin: StockOrigin) => void;
}

export const useVisualizerStore = create<VisualizerState>((set) => ({
  isOpen: false,
  isParsing: false,
  analysis: null,
  error: null,
  progress: 0, // Default to empty
  stockOrigin: 'Center',

  openVisualizer: async (filePath: string) => {
    set({ isOpen: true, isParsing: true, error: null, analysis: null });
    try {
      const result = await invoke<GCodeAnalysis>('parse_gcode_file', { path: filePath });
      set({ analysis: result, isParsing: false });
    } catch (err) {
      set({ error: String(err), isParsing: false });
    }
  },

  closeVisualizer: () => set({ isOpen: false, analysis: null, error: null, progress: 0, stockOrigin: 'Center' }),
  setProgress: (p: number) => set({ progress: p }),
  setStockOrigin: (origin: StockOrigin) => set({ stockOrigin: origin }),
}));
