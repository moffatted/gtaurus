/**
 * Central settings store for Gtaurus.
 *
 * All user-configurable settings live here. They are persisted to
 * `settings.json` via the Tauri plugin-store (or localStorage in web mode).
 *
 * To add a new settings section:
 *   1. Add its type to the `Settings` interface.
 *   2. Add a default value to `DEFAULT_SETTINGS`.
 *   3. Read/write from `useSettingsStore` in your component.
 */

import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';
import { isTauriApp } from '../utils/platform';

// ─── Types ─────────────────────────────────────────────────────────────────

/** A panel slot on the main Dashboard. */
export interface DashboardPanel {
  id: string;
  /** Human-readable label shown in the Dashboard settings. */
  label: string;
  /** Whether the panel is visible on the dashboard. */
  enabled: boolean;
  /** 0-based display order. Lower = appears first. */
  order: number;
}

export interface ConnectionSettings {
  preferredMode: 'serial' | 'websocket';
  serialPort: string;
  baudRate: number;
  wsHost: string;
  wsPort: number;
}

export interface Settings {
  // Dashboard section
  dashboardPanels: DashboardPanel[];
  // Connection
  connection: ConnectionSettings;
  // Future sections add their keys here
}

// ─── Defaults ───────────────────────────────────────────────────────────────

/**
 * Built-in panel types. These are the panels a user can place on the
 * Dashboard. Initially all disabled — users opt-in via Settings > Dashboard.
 */
export const AVAILABLE_DASHBOARD_PANELS: Omit<DashboardPanel, 'order'>[] = [
  { id: 'dro',           label: 'Digital Readout (DRO)', enabled: false },
  { id: 'console',       label: 'G-code Console',        enabled: false },
  { id: 'jogControls',   label: 'Jog Controls',          enabled: false },
  { id: 'fileManager',   label: 'File Manager',          enabled: false },
  { id: 'statusMonitor', label: 'Status Monitor',        enabled: false },
  { id: 'macros',        label: 'Macros',                enabled: false },
];

const DEFAULT_SETTINGS: Settings = {
  dashboardPanels: AVAILABLE_DASHBOARD_PANELS.map((p, i) => ({ ...p, order: i })),
  connection: {
    preferredMode: 'websocket',
    serialPort: '',
    baudRate: 115200,
    wsHost: '192.168.68.61',
    wsPort: 23,
  },
};


// ─── Storage helpers ─────────────────────────────────────────────────────────

const STORE_KEY = 'appSettings';
let tauriStore: Store | null = null;

async function getTauriStore(): Promise<Store> {
  if (!tauriStore) {
    tauriStore = await Store.load('settings.json');
  }
  return tauriStore;
}

async function loadFromStorage(): Promise<Settings | null> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      const value = await s.get<Settings>(STORE_KEY);
      return value ?? null;
    } else {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? (JSON.parse(raw) as Settings) : null;
    }
  } catch (err) {
    console.error('[settings] Failed to load:', err);
    return null;
  }
}

async function saveToStorage(settings: Settings): Promise<void> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      await s.set(STORE_KEY, settings);
      await s.save();
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error('[settings] Failed to save:', err);
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings;
  initialized: boolean;

  /** Load settings from disk. Call once on app start. */
  initSettings: () => Promise<void>;

  /** Replace the entire settings object and persist. */
  updateSettings: (patch: Partial<Settings>) => void;

  // Dashboard helpers
  setDashboardPanelEnabled: (id: string, enabled: boolean) => void;
  moveDashboardPanelUp: (id: string) => void;
  moveDashboardPanelDown: (id: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  initialized: false,

  initSettings: async () => {
    const saved = await loadFromStorage();
    if (saved) {
      // Merge saved panels with any newly added default panels
      // so new panel types appear after an app update.
      const savedIds = new Set(saved.dashboardPanels.map((p) => p.id));
      const merged = [...saved.dashboardPanels];
      AVAILABLE_DASHBOARD_PANELS.forEach((p) => {
        if (!savedIds.has(p.id)) {
          merged.push({ ...p, order: merged.length });
        }
      });
      set({ settings: { ...saved, dashboardPanels: merged }, initialized: true });
    } else {
      set({ initialized: true });
    }
  },

  updateSettings: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    void saveToStorage(next);
  },

  setDashboardPanelEnabled: (id, enabled) => {
    const panels = get().settings.dashboardPanels.map((p) =>
      p.id === id ? { ...p, enabled } : p
    );
    const next = { ...get().settings, dashboardPanels: panels };
    set({ settings: next });
    void saveToStorage(next);
  },

  moveDashboardPanelUp: (id) => {
    const panels = [...get().settings.dashboardPanels].sort((a, b) => a.order - b.order);
    const idx = panels.findIndex((p) => p.id === id);
    if (idx <= 0) return;
    // Swap order values with the panel above
    const reordered = panels.map((p, i) => {
      if (i === idx - 1) return { ...p, order: idx };
      if (i === idx)     return { ...p, order: idx - 1 };
      return p;
    });
    const next = { ...get().settings, dashboardPanels: reordered };
    set({ settings: next });
    void saveToStorage(next);
  },

  moveDashboardPanelDown: (id) => {
    const panels = [...get().settings.dashboardPanels].sort((a, b) => a.order - b.order);
    const idx = panels.findIndex((p) => p.id === id);
    if (idx < 0 || idx >= panels.length - 1) return;
    const reordered = panels.map((p, i) => {
      if (i === idx)     return { ...p, order: idx + 1 };
      if (i === idx + 1) return { ...p, order: idx };
      return p;
    });
    const next = { ...get().settings, dashboardPanels: reordered };
    set({ settings: next });
    void saveToStorage(next);
  },
}));
