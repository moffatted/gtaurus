import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

export interface GCodePoint {
  x: number;
  y: number;
  z: number;
  is_rapid: boolean;
  line_number: number;
  feedrate: number;
  operation_id: number;
}

export interface OperationInfo {
  id: number;
  tool_number: number | null;
  tool_name: string | null;
  start_point_idx: number;
  end_point_idx: number;
  start_line: number;
  end_line: number;
}

export interface GCodeAnalysis {
  points: GCodePoint[];
  operations: OperationInfo[];
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
  wcs: string;
  unit: string;
  comments: string[];
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
  setStockOrigin: (origin: StockOrigin, stockWidth?: number, stockHeight?: number, updateFn?: (patch: any) => void) => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  isOpen: false,
  isParsing: false,
  analysis: null,
  error: null,
  progress: 0, 
  stockOrigin: 'FrontLeft', 

  openVisualizer: async (filePath: string) => {
    set({ isOpen: true, isParsing: true, error: null, analysis: null });
    try {
      const result = await invoke<GCodeAnalysis>('parse_gcode_file', { path: filePath });
      set({ analysis: result, isParsing: false });
    } catch (err) {
      set({ error: String(err), isParsing: false });
    }
  },

  closeVisualizer: () => set({ isOpen: false, analysis: null, error: null, progress: 0, stockOrigin: 'FrontLeft' }),
  setProgress: (p: number) => set({ progress: p }),
  setStockOrigin: (origin: StockOrigin, stockWidth?: number, stockHeight?: number, updateFn?: (patch: any) => void) => {
    const { analysis } = get();
    set({ stockOrigin: origin });
    
    if (analysis && stockWidth !== undefined && stockHeight !== undefined && updateFn) {
      const jobWidth = analysis.bbox_max[0] - analysis.bbox_min[0];
      const jobDepth = analysis.bbox_max[1] - analysis.bbox_min[1];
      
      let targetOX = 0;
      let targetOY = 0;

      switch(origin) {
        case 'FrontLeft':
          targetOX = 0 - analysis.bbox_min[0];
          targetOY = 0 - analysis.bbox_min[1];
          break;
        case 'FrontRight':
          targetOX = stockWidth - analysis.bbox_max[0];
          targetOY = 0 - analysis.bbox_min[1];
          break;
        case 'BackLeft':
          targetOX = 0 - analysis.bbox_min[0];
          targetOY = stockHeight - analysis.bbox_max[1];
          break;
        case 'BackRight':
          targetOX = stockWidth - analysis.bbox_max[0];
          targetOY = stockHeight - analysis.bbox_max[1];
          break;
        case 'Center':
          targetOX = (stockWidth - jobWidth) / 2 - analysis.bbox_min[0];
          targetOY = (stockHeight - jobDepth) / 2 - analysis.bbox_min[1];
          break;
      }
      
      updateFn({ offsetX: targetOX, offsetY: targetOY });
    }
  },
}));
