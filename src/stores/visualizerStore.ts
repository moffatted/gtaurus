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
  tool_diameter: number;
  tool_type: string;
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
export type PlaybackMode = 'continuous' | 'operation-step';

interface VisualizerState {
  isOpen: boolean;
  isParsing: boolean;
  analysis: GCodeAnalysis | null;
  error: string | null;
  progress: number; // 0 to 1
  stockOrigin: StockOrigin;
  playbackMode: PlaybackMode;
  isToolChangePaused: boolean;
  currentOperationId: number | null;
  
  // Actions
  openVisualizer: (filePath: string) => Promise<void>;
  closeVisualizer: () => void;
  setProgress: (p: number) => void;
  setStockOrigin: (origin: StockOrigin, stockWidth?: number, stockHeight?: number, updateFn?: (patch: any) => void) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  goToOperationStart: (opId: number) => void;
  goToOperationEnd: (opId: number) => void;
  nextOperation: () => void;
  clearToolChangePause: () => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  isOpen: false,
  isParsing: false,
  analysis: null,
  error: null,
  progress: 0, 
  stockOrigin: 'FrontLeft',
  playbackMode: 'continuous',
  isToolChangePaused: false,
  currentOperationId: null, 

  openVisualizer: async (filePath: string) => {
    set({ isOpen: true, isParsing: true, error: null, analysis: null });
    try {
      const result = await invoke<GCodeAnalysis>('parse_gcode_file', { path: filePath });
      set({ 
        analysis: result, 
        isParsing: false,
        isToolChangePaused: false,
        currentOperationId: result.operations.length > 0 ? result.operations[0].id : null
      });
    } catch (err) {
      set({ error: String(err), isParsing: false });
    }
  },

  closeVisualizer: () => set({ 
    isOpen: false, 
    analysis: null, 
    error: null, 
    progress: 0, 
    stockOrigin: 'FrontLeft',
    playbackMode: 'continuous',
    isToolChangePaused: false,
    currentOperationId: null
  }),
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

  setPlaybackMode: (mode: PlaybackMode) => {
    set({ playbackMode: mode, isToolChangePaused: false, progress: 0 });
  },

  goToOperationStart: (opId: number) => {
    const { analysis } = get();
    if (!analysis) return;
    const op = analysis.operations.find(o => o.id === opId);
    if (!op) return;
    const targetProgress = op.start_point_idx / analysis.points.length;
    set({ progress: targetProgress, currentOperationId: opId, isToolChangePaused: false });
  },

  goToOperationEnd: (opId: number) => {
    const { analysis } = get();
    if (!analysis) return;
    const op = analysis.operations.find(o => o.id === opId);
    if (!op) return;
    const targetProgress = (op.end_point_idx + 1) / analysis.points.length;
    set({ progress: Math.min(1, targetProgress), currentOperationId: opId, isToolChangePaused: false });
  },

  nextOperation: () => {
    const { analysis, currentOperationId } = get();
    if (!analysis || currentOperationId === null) return;
    const currentIdx = analysis.operations.findIndex(o => o.id === currentOperationId);
    if (currentIdx < 0 || currentIdx >= analysis.operations.length - 1) return;
    const nextOp = analysis.operations[currentIdx + 1];
    set({ currentOperationId: nextOp.id, isToolChangePaused: true });
    const targetProgress = nextOp.start_point_idx / analysis.points.length;
    set({ progress: targetProgress });
  },

  clearToolChangePause: () => {
    set({ isToolChangePaused: false });
  },
}));
