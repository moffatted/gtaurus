import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";
import { isTauriApp } from "../utils/platform";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ToolType = 'endmill' | 'v-bit' | 'ballnose' | 'surfacing' | 'other';

export interface Bit {
  id: string;
  name: string;
  type: ToolType;
  diameter: number; // mm
  number: number; // Tool number (T1, T2, etc)
  fluteCount: number;
  fluteLength?: number; // mm — cutting edge length
  overallLength?: number; // mm — total stick-out length
  angle?: number; // degrees (v-bit tip angle)
  usageTimeSec: number;
  usageDistanceMm: number;
  material: string; // carbide, hss, etc.
  lastMaintenanceDate: string; // ISO date
  notes?: string;
}

interface ToolStoreState {
  tools: Bit[];
  activeToolId: string | null;
}

interface ToolStoreActions {
  initTools: () => Promise<void>;
  addTool: (tool: Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>) => void;
  updateTool: (id: string, patch: Partial<Bit>) => void;
  deleteTool: (id: string) => void;
  setActiveTool: (id: string | null) => void;
  recordUsage: (id: string, timeSec: number, distanceMm: number) => void;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

const DEFAULT_TOOLS: Bit[] = [
  {
    id: '1/8-downcut',
    name: '1/8" Downcut Endmill',
    type: 'endmill',
    diameter: 3.175,
    number: 1,
    fluteCount: 2,
    fluteLength: 12,
    overallLength: 38,
    usageTimeSec: 0,
    usageDistanceMm: 0,
    material: 'Carbide',
    lastMaintenanceDate: new Date().toISOString(),
    notes: 'Standard 1/8" bit for wood and plastics.'
  },
  {
    id: '1/4-upcut',
    name: '1/4" Upcut Endmill',
    type: 'endmill',
    diameter: 6.35,
    number: 2,
    fluteCount: 2,
    fluteLength: 20,
    overallLength: 50,
    usageTimeSec: 0,
    usageDistanceMm: 0,
    material: 'Carbide',
    lastMaintenanceDate: new Date().toISOString(),
    notes: 'Heavy material removal.'
  },
  {
    id: '60v-bit',
    name: '60° V-Bit',
    type: 'v-bit',
    diameter: 12.7,
    number: 3,
    fluteCount: 1,
    fluteLength: 10,
    overallLength: 40,
    angle: 60,
    usageTimeSec: 0,
    usageDistanceMm: 0,
    material: 'Carbide',
    lastMaintenanceDate: new Date().toISOString(),
    notes: 'For detail carving and chamfering.'
  },
  {
    id: 'ball-1/4',
    name: '1/4" Ballnose',
    type: 'ballnose',
    diameter: 6.35,
    number: 5,
    fluteCount: 2,
    fluteLength: 22,
    overallLength: 50,
    usageTimeSec: 0,
    usageDistanceMm: 0,
    material: 'Carbide',
    lastMaintenanceDate: new Date().toISOString(),
    notes: '3D contouring and finish passes.'
  },
  {
    id: '1-surfacing',
    name: '1" Surfacing Bit',
    type: 'surfacing',
    diameter: 25.4,
    number: 4,
    fluteCount: 3,
    fluteLength: 6,
    overallLength: 45,
    usageTimeSec: 0,
    usageDistanceMm: 0,
    material: 'Carbide',
    lastMaintenanceDate: new Date().toISOString(),
    notes: 'For wasteboard surfacing.'
  }
];

// ─── Storage helpers ─────────────────────────────────────────────────────────

const STORE_KEY = "tools_library";
const FILE_PATH = "tools.json";

let _store: Store | null = null;
async function getTauriStore() {
  if (!_store) {
    _store = await Store.load(FILE_PATH);
  }
  return _store;
}

async function loadFromStorage(): Promise<ToolStoreState | null> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      const val = await s.get<ToolStoreState>(STORE_KEY);
      return val ?? null;
    } else {
      const saved = localStorage.getItem(STORE_KEY);
      return saved ? JSON.parse(saved) : null;
    }
  } catch (err) {
    console.error("[toolStore] Failed to load:", err);
    return null;
  }
}

async function saveToStorage(state: ToolStoreState) {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      await s.set(STORE_KEY, state);
      await s.save();
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    }
  } catch (err) {
    console.error("[toolStore] Failed to save:", err);
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useToolStore = create<ToolStoreState & ToolStoreActions>((set) => ({
  tools: DEFAULT_TOOLS,
  activeToolId: DEFAULT_TOOLS[0].id,

  initTools: async () => {
    const saved = await loadFromStorage();
    if (saved) {
      set({ 
        tools: (saved.tools as Bit[]) || DEFAULT_TOOLS, 
        activeToolId: saved.activeToolId 
      });
    }
  },

  addTool: (t) => {
    const newTool: Bit = {
      ...t,
      id: crypto.randomUUID(),
      usageTimeSec: 0,
      usageDistanceMm: 0,
      lastMaintenanceDate: new Date().toISOString(),
    };
    set((state) => {
      const next = { ...state, tools: [...state.tools, newTool] };
      void saveToStorage({ tools: next.tools, activeToolId: next.activeToolId });
      return next;
    });
  },

  updateTool: (id, patch) => {
    set((state) => {
      const next = {
        ...state,
        tools: state.tools.map(t => t.id === id ? { ...t, ...patch } : t)
      };
      void saveToStorage({ tools: next.tools, activeToolId: next.activeToolId });
      return next;
    });
  },

  deleteTool: (id) => {
    set((state) => {
      const isActive = state.activeToolId === id;
      const next = {
        ...state,
        tools: state.tools.filter(t => t.id !== id),
        activeToolId: isActive ? null : state.activeToolId
      };
      void saveToStorage({ tools: next.tools, activeToolId: next.activeToolId });
      return next;
    });
  },

  setActiveTool: (id) => {
    set((state) => {
      const next = { ...state, activeToolId: id };
      void saveToStorage({ tools: next.tools, activeToolId: next.activeToolId });
      return next;
    });
  },

  recordUsage: (id, timeSec, distanceMm) => {
    set((state) => {
      const next = {
        ...state,
        tools: state.tools.map(t => 
          t.id === id 
            ? { ...t, usageTimeSec: t.usageTimeSec + timeSec, usageDistanceMm: t.usageDistanceMm + distanceMm } 
            : t
        )
      };
      void saveToStorage({ tools: next.tools, activeToolId: next.activeToolId });
      return next;
    });
  }
}));
