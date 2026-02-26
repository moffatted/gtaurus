import { create } from 'zustand';

export type LineType = 'cmd' | 'ok' | 'error' | 'status' | 'msg' | 'alarm' | 'info' | 'sys';

export interface LogLine {
  id: number;
  text: string;
  type: LineType;
  ts: number;
}

interface ConsoleState {
  lines: LogLine[];
  appendLine: (text: string, type?: LineType) => void;
  clearLines: () => void;
}

let lineId = 0;

function classify(text: string): LineType {
  if (text.startsWith('[GTaurus]')) return 'sys';
  if (text === 'ok')               return 'ok';
  if (text.startsWith('error:'))   return 'error';
  if (text.startsWith('ALARM:'))   return 'alarm';
  if (text.startsWith('<') && text.endsWith('>')) return 'status';
  if (text.startsWith('[MSG:'))    return 'msg';
  if (text.startsWith('['))        return 'info';
  return 'info';
}

export const useConsoleStore = create<ConsoleState>((set) => ({
  lines: [],
  appendLine: (text, type) => set((state) => ({
    lines: [
      ...state.lines.slice(-999), 
      { 
        id: lineId++, 
        text, 
        type: type ?? classify(text), 
        ts: Date.now() 
      }
    ]
  })),
  clearLines: () => set({ lines: [] }),
}));
