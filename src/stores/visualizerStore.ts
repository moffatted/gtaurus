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
  tool_angle_deg: number | null;
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
  raw_lines: string[];
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
  isPlaying: boolean;
  isToolChangePaused: boolean;
  currentOperationId: number | null;
  currentLineIdx: number; // 0-based index into raw_lines — primary driver of playback
  playbackSpeed: number;
  
  // Actions
  openVisualizer: (filePath: string) => Promise<void>;
  closeVisualizer: () => void;
  setProgress: (p: number) => void;
  setIsPlaying: (playing: boolean) => void;
  stepLine: () => { paused: boolean; finished: boolean };
  setStockOrigin: (origin: StockOrigin, stockWidth?: number, stockHeight?: number, updateFn?: (patch: any) => void) => void;
  setPlaybackMode: (mode: PlaybackMode) => void;
  goToOperationStart: (opId: number) => void;
  goToOperationEnd: (opId: number) => void;
  nextOperation: () => void;
  clearToolChangePause: () => void;
  resumeFromToolChangePause: () => void;
  setPlaybackSpeed: (speed: number) => void;
}

export const useVisualizerStore = create<VisualizerState>((set, get) => ({
  isOpen: false,
  isParsing: false,
  analysis: null,
  error: null,
  progress: 0, 
  stockOrigin: 'FrontLeft',
  playbackMode: 'operation-step',
  isPlaying: false,
  isToolChangePaused: false,
  currentOperationId: null, 
  currentLineIdx: 0,
  playbackSpeed: 1.0,

  openVisualizer: async (filePath: string) => {
    set({ isOpen: true, isParsing: true, error: null, analysis: null });
    try {
      const result = await invoke<GCodeAnalysis>('parse_gcode_file', { path: filePath });
      
      // Debug: show operation boundaries and sample points
      console.log('🔧 G-CODE ANALYSIS:');
      console.log('Total points:', result.points.length);
      console.log('Total lines:', result.raw_lines.length);
      
      result.operations.forEach((op, i) => {
        const startPoint = result.points[op.start_point_idx];
        const endPoint = result.points[op.end_point_idx];
        console.log(`Op${i}:`, {
          id: op.id,
          tool: op.tool_number,
          name: op.tool_name,
          points: `${op.start_point_idx}-${op.end_point_idx}`,
          startLine: startPoint?.line_number || '?',
          endLine: endPoint?.line_number || '?',
          lineRange: `${op.start_line}-${op.end_line}`,
        });
      });
      
      set({ 
        analysis: result, 
        isParsing: false,
        isToolChangePaused: false,
        currentLineIdx: 0,
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
    currentLineIdx: 0,
    isPlaying: false,
    stockOrigin: 'FrontLeft',
    playbackMode: 'operation-step',
    isToolChangePaused: false,
    currentOperationId: null,
    playbackSpeed: 1.0
  }),

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),
  setProgress: (p: number) => {
    // Used by the scrubber — derive currentLineIdx from the fractional position.
    const { analysis } = get();
    const clamped = Math.min(1, Math.max(0, p));

    if (!analysis || analysis.raw_lines.length === 0) {
      set({ progress: clamped });
      return;
    }

    const totalLines = analysis.raw_lines.length;
    const lineIdx = Math.round(clamped * (totalLines - 1));
    const lineNum = lineIdx + 1; // 1-based

    let currentOpId: number | null = null;
    for (let i = analysis.points.length - 1; i >= 0; i--) {
      if (analysis.points[i].line_number <= lineNum) {
        currentOpId = analysis.points[i].operation_id;
        break;
      }
    }

    set({
      progress: clamped,
      currentLineIdx: lineIdx,
      currentOperationId: currentOpId,
      isToolChangePaused: false,
    });
  },
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
    set({ playbackMode: mode, isToolChangePaused: false, isPlaying: false, progress: 0, currentLineIdx: 0 });
  },

  goToOperationStart: (opId: number) => {
    const { analysis } = get();
    if (!analysis) return;
    const op = analysis.operations.find(o => o.id === opId);
    if (!op) return;
    const lineIdx = Math.max(0, op.start_line - 1);
    const progress = analysis.raw_lines.length <= 1 ? 0 : lineIdx / (analysis.raw_lines.length - 1);
    set({ currentLineIdx: lineIdx, progress, currentOperationId: opId, isToolChangePaused: false });
  },

  goToOperationEnd: (opId: number) => {
    const { analysis } = get();
    if (!analysis) return;
    const op = analysis.operations.find(o => o.id === opId);
    if (!op) return;
    const lineIdx = Math.min(analysis.raw_lines.length - 1, Math.max(0, op.end_line - 1));
    const progress = analysis.raw_lines.length <= 1 ? 1 : lineIdx / (analysis.raw_lines.length - 1);
    set({ currentLineIdx: lineIdx, progress: Math.min(1, progress), currentOperationId: opId, isToolChangePaused: false });
  },

  nextOperation: () => {
    const { analysis, currentOperationId } = get();
    if (!analysis || currentOperationId === null) return;
    const currentIdx = analysis.operations.findIndex(o => o.id === currentOperationId);
    if (currentIdx < 0 || currentIdx >= analysis.operations.length - 1) return;
    const nextOp = analysis.operations[currentIdx + 1];
    const lineIdx = Math.max(0, nextOp.start_line - 1);
    const progress = analysis.raw_lines.length <= 1 ? 0 : lineIdx / (analysis.raw_lines.length - 1);
    set({ currentLineIdx: lineIdx, progress, currentOperationId: nextOp.id, isToolChangePaused: true });
  },

  clearToolChangePause: () => {
    set({ isToolChangePaused: false });
  },

  resumeFromToolChangePause: () => {
    set({ isToolChangePaused: false, isPlaying: true });
  },

  setPlaybackSpeed: (speed: number) => {
    set({ playbackSpeed: speed });
  },

  stepLine: () => {
    const { analysis, currentLineIdx, playbackMode, isToolChangePaused } = get();

    if (!analysis || isToolChangePaused) {
      return { paused: true, finished: false };
    }

    const totalLines = analysis.raw_lines.length;
    const nextIdx = currentLineIdx + 1;

    if (nextIdx >= totalLines) {
      set({ progress: 1 });
      return { paused: false, finished: true };
    }

    const lineText = analysis.raw_lines[nextIdx] ?? '';
    const hasM6 = /\bM0?6\b/i.test(lineText);
    const lineNum = nextIdx + 1; // 1-based

    // Derive current operation from the last point at or before this line
    let currentOpId: number | null = null;
    for (let i = analysis.points.length - 1; i >= 0; i--) {
      if (analysis.points[i].line_number <= lineNum) {
        currentOpId = analysis.points[i].operation_id;
        break;
      }
    }

    const progress = totalLines <= 1 ? 1 : nextIdx / (totalLines - 1);

    if (hasM6 && playbackMode === 'operation-step') {
      // Find the operation whose start_line matches this M6 line
      const nextOp = analysis.operations.find(op => op.start_line === lineNum);
      set({
        currentLineIdx: nextIdx,
        progress,
        isToolChangePaused: true,
        isPlaying: false,
        currentOperationId: nextOp?.id ?? currentOpId,
      });
      return { paused: true, finished: false };
    }

    const finished = nextIdx >= totalLines - 1;
    set({
      currentLineIdx: nextIdx,
      progress,
      currentOperationId: currentOpId,
      isToolChangePaused: false,
      ...(finished ? { isPlaying: false } : {}),
    });

    return { paused: false, finished };
  },
}));
