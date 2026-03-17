/**
 * @file settingsStore.ts
 * @purpose Central configuration store for all user-defined application and hardware settings.
 */
import { create } from "zustand";
import { Store } from "@tauri-apps/plugin-store";
import { isTauriApp } from "../utils/platform";
import { transport } from '../services/transportService';

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
  /** Default width in pixels for the panel (used by DockView setSize). */
  defaultWidth?: number;
  /** Default height in pixels for the panel (used by DockView setSize). */
  defaultHeight?: number;
}

export interface ConnectionSettings {
  preferredMode: "serial" | "telnet" | "websocket";
  serialPort: string;
  baudRate: number;
  terminalFontSize: number;
  terminalScrollback: number;
  // Visualizer Settings
  wsHost: string;
  wsPort: number;
  bridgeHost: string;
  bridgePort: number;
  statusPollInterval: number;
}

export interface GeneralSettings {
  carvingUnits: "mm" | "inches";
  firmwareFallback: "Grbl" | "GrblHAL";
  legacyGrblMode: boolean;
  safeHeight: number;
  bedSizeX: number;
  bedSizeY: number;
  bedSizeZ: number;
  /** Homing direction per axis. 'min' = endstop at 0, travel positive. 'max' = endstop at 0, travel negative. */
  homingPositionX: "min" | "max";
  homingPositionY: "min" | "max";
  homingPositionZ: "min" | "max";
  reverseX: boolean;
  reverseY: boolean;
  reverseZ: boolean;
  feedRate: number;
  postJobAction: boolean;
  postJobMacroId: string | null;
  uiScale: number;
}

export interface ProbeSettings {
  // Movement
  fastFeedrate: number;
  slowFeedrate: number;
  retractDistance: number;
  maxTravel: number;
  signalState: "NO" | "NC";
  switchOffMethod: "Timer" | "Optical" | "Move";
  transmissionPower: number;
  triggerFilter: number;
  probeType: string;
  // Calibration
  stylusDiameter: number;
  zOffset: number;
  runout: number;
  deflectionOffsets: {
    xPos: number;
    xNeg: number;
    yPos: number;
    yNeg: number;
  };
  // 3-Axis Corner Probe
  xWallThickness: number;
  yWallThickness: number;
  holeDiameter: number;
  xyDropDistance: number;
  // Safety
  protectedPositioning: boolean;
  overtravelLimit: number;
  hardStop: boolean;
  // Logic
  wcoUpdate: boolean;
  toleranceCheck: number;
  toolBreakageTolerance: number;
}

export interface SpindleSettings {
  // Dynamic Performance
  accelTime: number;
  decelTime: number;
  minRPM: number;
  maxRPM: number;
  // Speed Control
  pwmFrequency: number;
  pulleyRatio: number;
  scalingMaxVoltage: number;
  scalingMaxRPM: number;
  // CSS & Limits
  cssLimitRPM: number;
  invertDirection: boolean;
  // Thermal & Power
  currentLimit: number;
  minPowerThreshold: number;
  brakingMethod: "Coast" | "DC" | "Regen";
  // Interaction & Feedback
  orientDegree: number;
  ssoStep: number;
  warmupEnabled: boolean;
}

export interface AtcSettings {
  enabled: boolean;
  toolChangeMpos: { x: number; y: number; z: number };
  probeMpos: { x: number; y: number; z: number };
  probeRapidZ: number;
  probeSearchDistance: number;
  probePlateThickness: number;
  probeFeedrate: number;
  slowProbeFeedrate: number;
}

export interface CameraSettings {
  enabled: boolean;
  streamUrl: string;
  crowsnestConfigPath: string;
  showCrosshair: boolean;
}

export interface JobHistoryEntry {
  id: string;
  startTime: number;
  endTime?: number;
  durationSec?: number;
  status: 'running' | 'completed' | 'failed';
}

export interface StatsSettings {
  enabled: boolean;
  // Collection filters
  enableLogging: boolean;
  minJobDurationSec: number;
  // Job metrics
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  jobHistory: JobHistoryEntry[];
  // Time metrics
  totalMachineOnTimeSec: number;
  totalSpindleTimeSec: number;
  totalCuttingTimeSec: number;
  totalRapidTimeSec: number;
  // Performance
  machineUtilizationRate: number; // 0-1 percentage
  averageCycleTimeSec: number;
  // OEE targets
  targetAvailability: number;
  targetPerformance: number;
  targetQuality: number;
}

export interface AiSettings {
  enabled: boolean;
  tier: "free" | "pro" | "local";
  apiKey: string;
  freeModel: string;
  proModel: string;
  localModel: string;
  localBaseUrl: string;
  localApiKey: string;
  conciseMode: boolean;
}


export interface Macro {
  id: string;
  name: string;
  content: string;
}

export interface StockSettings {
  enabled: boolean;
  width: number;
  height: number;
  thickness: number;
  zeroX: number;
  zeroY: number;
  workOffsetX: number;
  workOffsetY: number;
  workOffsetZ: number;
  material: 'pine' | 'mdf' | 'aluminum' | 'pvc' | 'pcb' | 'darkoak';
  opacity: number;
  zeroPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
}

export interface ToolLibrarySettings {
  enabled: boolean;
  fusionLibraryPath?: string; // Custom path to a Fusion 360 Library.json
}

export interface FluidNCManagerSettings {
  enabled: boolean;
}

export interface RotarySettings {
  enabled: boolean;
  strategy: "A_Swap" | "B_Dedicated";
  swapAxis: "X" | "Y" | "Z";       // Only used if strategy === "A_Swap"
  rotaryType: "Roller" | "Chuck";
  
  // Calibration
  stepsPerRevolution: number;
  microstepping: number;
  rollerDiameter: number;          // Used for Roller
  objectDiameter: number;          // Used for Chuck

  // Firmware Configs (FluidNC)
  standardConfigPath: string;
  rotaryConfigPath: string;

  // Generic GRBL Settings
  maxRate: number;
  acceleration: number;
}


export interface Settings {
  // Dashboard section
  dashboardPanels: DashboardPanel[];
  /** JSON string for the DockView layout. */
  dashboardLayout?: string;
  // Connection
  connection: ConnectionSettings;
  // General
  general: GeneralSettings;
  // Probe
  probe: ProbeSettings;
  // Spindle
  spindle: SpindleSettings;
  // Stats
  stats: StatsSettings;
  showAutolevelMesh: boolean;
  // File Manager
  gcodeStoragePath: string;
  // AI
  ai: AiSettings;
  // Stock / Workpiece
  stock: StockSettings;
  // ATC
  atc: AtcSettings;
  // Camera
  camera: CameraSettings;
  // Macros
  macros: Macro[];
  // Tool Library
  toolLibrary: ToolLibrarySettings;
  // FluidNC Manager
  fluidncManager: FluidNCManagerSettings;
  // Rotary
  rotary: RotarySettings;
}

// ─── Defaults ───────────────────────────────────────────────────────────────

/**
 * Built-in panel types. These are the panels a user can place on the
 * Dashboard. Initially all disabled — users opt-in via Settings > Dashboard.
 */
export const AVAILABLE_DASHBOARD_PANELS: Omit<DashboardPanel, "order">[] = [
  { id: "controls", label: "Controls", enabled: true, defaultWidth: 600, defaultHeight: 541 },
  { id: "console", label: "G-code Console", enabled: true, defaultHeight: 250 },
  { id: "visualizer", label: "Bed Visualizer", enabled: false },
  { id: "fileManager", label: "File Manager", enabled: false, defaultWidth: 350 },
  { id: "probe", label: "Probe Panel", enabled: false, defaultWidth: 320 },
  { id: "macros", label: "Macros", enabled: false },
  { id: "workpiece", label: "Workpiece", enabled: false },
  { id: "autolevel", label: "Auto-Leveling", enabled: false, defaultWidth: 350 },
];

export const DEFAULT_SETTINGS: Settings = {
  dashboardPanels: AVAILABLE_DASHBOARD_PANELS.map((p, i) => ({
    ...p,
    order: i,
  })),
  connection: {
    preferredMode: "websocket",
    serialPort: "",
    baudRate: 115200,
    terminalFontSize: 14,
    terminalScrollback: 1000,
    wsHost: "192.168.68.61",
    wsPort: 23,
    bridgeHost: "192.168.68.64",
    bridgePort: Number(import.meta.env.VITE_BACKEND_PORT) || 9001,
    statusPollInterval: 2000,
  },
  general: {
    carvingUnits: "mm",
    firmwareFallback: "Grbl",
    legacyGrblMode: false,
    safeHeight: 5,
    bedSizeX: 300,
    bedSizeY: 180,
    bedSizeZ: 45,
    homingPositionX: "min",
    homingPositionY: "min",
    homingPositionZ: "max",
    reverseX: false,
    reverseY: false,
    reverseZ: false,
    feedRate: 1000,
    postJobAction: false,
    postJobMacroId: '4', // Default to "Park Position" macro ID
    uiScale: 1.0,
  },
  probe: {
    fastFeedrate: 500,
    slowFeedrate: 50,
    retractDistance: 2,
    maxTravel: 50,
    signalState: "NC",
    switchOffMethod: "Timer",
    transmissionPower: 1,
    triggerFilter: 10,
    probeType: "Touch-Trigger Probe",
    stylusDiameter: 6,
    zOffset: 5,
    runout: 0,
    deflectionOffsets: { xPos: 0, xNeg: 0, yPos: 0, yNeg: 0 },
    xWallThickness: 2.63,
    yWallThickness: 2.63,
    holeDiameter: 14.86,
    xyDropDistance: 3,
    protectedPositioning: true,
    overtravelLimit: 5,
    hardStop: true,
    wcoUpdate: true,
    toleranceCheck: 0.1,
    toolBreakageTolerance: 0.5,
  },
  spindle: {
    accelTime: 3,
    decelTime: 5,
    minRPM: 3000,
    maxRPM: 24000,
    pwmFrequency: 5,
    pulleyRatio: 1,
    scalingMaxVoltage: 10,
    scalingMaxRPM: 24000,
    cssLimitRPM: 5000,
    invertDirection: false,
    currentLimit: 10,
    minPowerThreshold: 10,
    brakingMethod: "Coast",
    orientDegree: 0,
    ssoStep: 10,
    warmupEnabled: true,
  },
  stats: {
    enabled: true,
    enableLogging: true,
    minJobDurationSec: 10,
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0,
    jobHistory: [],
    totalMachineOnTimeSec: 0,
    totalSpindleTimeSec: 0,
    totalCuttingTimeSec: 0,
    totalRapidTimeSec: 0,
    machineUtilizationRate: 0,
    averageCycleTimeSec: 0,
    targetAvailability: 0.85,
    targetPerformance: 0.9,
    targetQuality: 0.98,
  },
  showAutolevelMesh: false,
  gcodeStoragePath: "", // Will be initialized to home/gcode_files
  ai: {
    enabled: true,
    tier: "free",
    apiKey: "",
    freeModel: "gemini-1.5-flash",
    proModel: "gemini-1.5-pro",
    localModel: "qwen/qwen2.5-coder-14b",
    localBaseUrl: "http://192.168.68.57:1473/v1",
    localApiKey: "lm-studio",
    conciseMode: true,
  },

  stock: {
    enabled: false,
    width: 112,
    height: 112,
    thickness: 15,
    zeroX: 0,
    zeroY: 0,
    workOffsetX: 56,
    workOffsetY: 56,
    workOffsetZ: 0,
    material: 'pine',
    opacity: 1.0,
    zeroPosition: 'bottom-left',
  },
  atc: {
    enabled: true,
    toolChangeMpos: { x: 0, y: 0, z: -10 },
    probeMpos: { x: 50, y: 50, z: -80 },
    probeRapidZ: -20,
    probeSearchDistance: 50,
    probePlateThickness: 15.0,
    probeFeedrate: 100,
    slowProbeFeedrate: 20,
  },
  camera: {
    enabled: true,
    streamUrl: "http://192.168.68.64:8080/stream",
    crowsnestConfigPath: "/home/eddiem/printer_data/config/crowsnest.conf",
    showCrosshair: false,
  },
  macros: [
    { id: '1', name: 'Probe Z', content: 'G38.2 Z-50 F100\nG10 L20 P1 Z0\nG0 Z5' },
    { id: '2', name: 'Start Spindle', content: 'M3 S12000' },
    { id: '3', name: 'Stop Spindle', content: 'M5' },
    { id: '4', name: 'Park Position', content: 'G0 G53 Z0\nG0 G53 X0 Y0' },
    { id: '5', name: 'Return to Home', content: 'G0 G53 Z0\nG0 G53 X0 Y0' },
  ],
  toolLibrary: {
    enabled: true,
  },
  fluidncManager: {
    enabled: true,
  },
  rotary: {
    enabled: false,
    strategy: "A_Swap",
    swapAxis: "Y",
    rotaryType: "Roller",
    stepsPerRevolution: 200,
    microstepping: 16,
    rollerDiameter: 40,
    objectDiameter: 50,
    standardConfigPath: "config.yaml",
    rotaryConfigPath: "rotary.yaml",
    maxRate: 5000,
    acceleration: 50,
  },
};

// ─── Storage helpers ─────────────────────────────────────────────────────────

const STORE_KEY = "appSettings";
let tauriStore: Store | null = null;

async function getTauriStore(): Promise<Store | null> {
  if (tauriStore) return tauriStore;
  
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn("[settings] Store.load timed out after 3s");
      resolve(null);
    }, 3000);

    Store.load("settings.json")
      .then((s) => {
        clearTimeout(timer);
        tauriStore = s;
        resolve(s);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("[settings] Store.load failed:", err);
        resolve(null);
      });
  });
}

async function loadFromStorage(): Promise<Settings | null> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      if (!s) return null;
      
      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.warn("[settings] s.get timed out after 2s");
          resolve(null);
        }, 2000);
        
        s.get<Settings>(STORE_KEY).then((val) => {
          clearTimeout(timer);
          resolve(val ?? null);
        }).catch((err) => {
          clearTimeout(timer);
          console.error("[settings] s.get failed:", err);
          resolve(null);
        });
      });
    } else {
      const raw = localStorage.getItem(STORE_KEY);
      return raw ? (JSON.parse(raw) as Settings) : null;
    }
  } catch (err) {
    console.error("[settings] Failed to load from storage:", err);
    return null;
  }
}

function normalizeSavedStock(savedStock: any): Partial<StockSettings> {
  if (!savedStock) return {};

  return {
    ...savedStock,
    zeroX: savedStock.zeroX ?? savedStock.posX ?? DEFAULT_SETTINGS.stock.zeroX,
    zeroY: savedStock.zeroY ?? savedStock.posY ?? DEFAULT_SETTINGS.stock.zeroY,
    workOffsetX: savedStock.workOffsetX ?? savedStock.offsetX ?? DEFAULT_SETTINGS.stock.workOffsetX,
    workOffsetY: savedStock.workOffsetY ?? savedStock.offsetY ?? DEFAULT_SETTINGS.stock.workOffsetY,
    workOffsetZ: savedStock.workOffsetZ ?? savedStock.offsetZ ?? DEFAULT_SETTINGS.stock.workOffsetZ,
  };
}

function normalizeSavedProbe(savedProbe: any): Partial<ProbeSettings> {
  if (!savedProbe) return {};

  const toNumber = (value: any, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    ...savedProbe,
    xWallThickness: toNumber(savedProbe.xWallThickness, DEFAULT_SETTINGS.probe.xWallThickness),
    yWallThickness: toNumber(savedProbe.yWallThickness, DEFAULT_SETTINGS.probe.yWallThickness),
    holeDiameter: toNumber(savedProbe.holeDiameter, DEFAULT_SETTINGS.probe.holeDiameter),
    xyDropDistance: toNumber(savedProbe.xyDropDistance, DEFAULT_SETTINGS.probe.xyDropDistance),
  };
}

async function saveToStorage(settings: Settings): Promise<void> {
  try {
    if (isTauriApp()) {
      const s = await getTauriStore();
      if (!s) return;
      await s.set(STORE_KEY, settings);
      await s.save();
    } else {
      localStorage.setItem(STORE_KEY, JSON.stringify(settings));
    }
  } catch (err) {
    console.error("[settings] Failed to save:", err);
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings;
  initialized: boolean;

  healStoragePath: () => Promise<string | null>;

  /** Load settings from disk. Call once on app start. */
  initSettings: () => Promise<void>;

  /** Replace the entire settings object and persist. */
  updateSettings: (patch: Partial<Settings>) => void;

  // Dashboard helpers
  setDashboardPanelEnabled: (id: string, enabled: boolean) => void;
  setDashboardPanelDimensions: (id: string, dims: { defaultWidth?: number; defaultHeight?: number }) => void;
  setDashboardLayout: (layout: string) => void;
  moveDashboardPanelUp: (id: string) => void;
  moveDashboardPanelDown: (id: string) => void;
  // Connection helpers
  setTerminalFontSize: (size: number) => void;
  setTerminalScrollback: (lines: number) => void;
  setShowAutolevelMesh: (show: boolean) => void;
  // General
  setGeneralSettings: (patch: Partial<GeneralSettings>) => void;
  // Probe
  setProbeSettings: (patch: Partial<ProbeSettings>) => void;
  // Spindle
  setSpindleSettings: (patch: Partial<SpindleSettings>) => void;
  // Stats
  setStatsSettings: (patch: Partial<StatsSettings>) => void;
  // AI
  setAiSettings: (patch: Partial<AiSettings>) => void;
  // Stock
  setStockSettings: (patch: Partial<StockSettings>) => void;
  // ATC
  setAtcSettings: (patch: Partial<AtcSettings>) => void;
  // Camera
  setCameraSettings: (patch: Partial<CameraSettings>) => void;
  // Tool Library
  setToolLibrarySettings: (patch: Partial<ToolLibrarySettings>) => void;
  // FluidNC Manager
  setFluidncManagerSettings: (patch: Partial<FluidNCManagerSettings>) => void;
  // Rotary
  setRotarySettings: (patch: Partial<RotarySettings>) => void;
  // Macros
  addMacro: (macro: Omit<Macro, 'id'>) => void;
  updateMacro: (id: string, patch: Partial<Macro>) => void;
  deleteMacro: (id: string) => void;
  // General
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  initialized: false,

  healStoragePath: async () => {
    try {
      const home = await transport.invoke<string>('get_home_dir');
      const path = `${home}/gcode_files`.replace(/\\/g, '/');
      await transport.invoke('ensure_dir_exists', { path });
      
      const { updateSettings } = get();
      updateSettings({ gcodeStoragePath: path });
      console.log("[settings] Healed storage path to:", path);
      return path;
    } catch (err) {
      console.error("[settings] Path healing failed:", err);
      return null;
    }
  },

  initSettings: async () => {
    const saved = await loadFromStorage();

    if (saved) {
      // 1. Migrate old "dro" or "jog" to "controls"
      const hasOldPanels = saved.dashboardPanels.some(p => p.id === 'dro' || p.id === 'jog');
      let migratedPanels = [...saved.dashboardPanels];
      
      if (hasOldPanels) {
          const dro = migratedPanels.find(p => p.id === 'dro');
          const jog = migratedPanels.find(p => p.id === 'jog');
          const wasEnabled = (dro?.enabled || jog?.enabled) ?? true;
          
          // Remove old ones
          migratedPanels = migratedPanels.filter(p => p.id !== 'dro' && p.id !== 'jog');
          
          // Ensure "controls" is present and inherits enabled state
          if (!migratedPanels.find(p => p.id === 'controls')) {
              migratedPanels.push({ 
                  id: "controls", 
                  label: "Controls", 
                  enabled: wasEnabled, 
                  order: 0,
                  defaultWidth: 600,
                  defaultHeight: 541
              });
          } else {
              migratedPanels = migratedPanels.map(p => 
                  p.id === 'controls' ? { ...p, enabled: wasEnabled } : p
              );
          }
      }

      // 2. Filter out any panels that are no longer supported
      const validIds = new Set(AVAILABLE_DASHBOARD_PANELS.map(p => p.id));
      let merged = migratedPanels.filter(p => validIds.has(p.id));

      // 3. Add any newly introduced panels
      const currentIds = new Set(merged.map((p) => p.id));
      AVAILABLE_DASHBOARD_PANELS.forEach((p) => {
        if (!currentIds.has(p.id)) {
          merged.push({ ...p, order: merged.length });
        }
      });

      // 4. Force labels to match definitions (handles renames)
      const labelMap = new Map(AVAILABLE_DASHBOARD_PANELS.map(p => [p.id, p.label]));
      merged = merged.map(p => ({
          ...p,
          label: labelMap.get(p.id) || p.label
      }));

      const aiSettings = { ...DEFAULT_SETTINGS.ai, ...saved?.ai };
      if (aiSettings.localModel === "qwen-2.5-coder-14b") {
        aiSettings.localModel = "qwen/qwen2.5-coder-14b";
      }

      set({
        settings: { 
          ...DEFAULT_SETTINGS, 
          ...saved, 
          connection: { ...DEFAULT_SETTINGS.connection, ...saved?.connection },
          general: { ...DEFAULT_SETTINGS.general, ...saved?.general },
          probe: { ...DEFAULT_SETTINGS.probe, ...normalizeSavedProbe(saved?.probe) },
          spindle: { ...DEFAULT_SETTINGS.spindle, ...saved?.spindle },
          stats: { ...DEFAULT_SETTINGS.stats, ...saved?.stats },
          ai: aiSettings,
          stock: { ...DEFAULT_SETTINGS.stock, ...normalizeSavedStock(saved?.stock) },
          atc: { ...DEFAULT_SETTINGS.atc, ...saved?.atc },
          camera: { ...DEFAULT_SETTINGS.camera, ...saved?.camera },
          toolLibrary: { ...DEFAULT_SETTINGS.toolLibrary, ...saved?.toolLibrary },
          fluidncManager: { ...DEFAULT_SETTINGS.fluidncManager, ...saved?.fluidncManager },
          rotary: { ...DEFAULT_SETTINGS.rotary, ...saved?.rotary },
          dashboardPanels: merged 
        },
        initialized: true,
      });
    } else {
      set({ initialized: true });
    }

    // Background auto-provisioning
    void (async () => {
      try {
        const current = get().settings;
        let path = current.gcodeStoragePath;
        let needsRefresh = !path;

        if (path) {
          try {
            await transport.invoke('ensure_dir_exists', { path });
          } catch {
            needsRefresh = true;
          }
        }

        if (needsRefresh) {
          const home = await transport.invoke<string>('get_home_dir');
          const newPath = `${home}/gcode_files`.replace(/\\/g, '/');
          await transport.invoke('ensure_dir_exists', { path: newPath });
          get().updateSettings({ gcodeStoragePath: newPath });
        }
      } catch (err) {
        console.warn("[settings] Background storage provisioning failed (expected in browser or disconnected):", err);
      }
    })();
  },

  updateSettings: (patch) => {
    let next = { ...get().settings, ...patch };
    
    // Safety check for status polling interval
    if (next.connection.statusPollInterval < 1000) {
      next = {
        ...next,
        connection: { ...next.connection, statusPollInterval: 1000 }
      };
    }

    set({ settings: next });
    void saveToStorage(next);
  },

  setDashboardPanelEnabled: (id, enabled) => {
    const panels = get().settings.dashboardPanels.map((p) =>
      p.id === id ? { ...p, enabled } : p,
    );
    const next = { ...get().settings, dashboardPanels: panels };
    set({ settings: next });
    void saveToStorage(next);
  },

  setDashboardPanelDimensions: (id, dims) => {
    const panels = get().settings.dashboardPanels.map((p) =>
      p.id === id ? { ...p, ...dims } : p,
    );
    const next = { ...get().settings, dashboardPanels: panels };
    set({ settings: next });
    void saveToStorage(next);
  },

  setDashboardLayout: (layout) => {
    const next = { ...get().settings, dashboardLayout: layout };
    set({ settings: next });
    void saveToStorage(next);
  },

  moveDashboardPanelUp: (id) => {
    const panels = [...get().settings.dashboardPanels].sort(
      (a, b) => a.order - b.order,
    );
    const idx = panels.findIndex((p) => p.id === id);
    if (idx <= 0) return;
    // Swap order values with the panel above
    const reordered = panels.map((p, i) => {
      if (i === idx - 1) return { ...p, order: idx };
      if (i === idx) return { ...p, order: idx - 1 };
      return p;
    });
    const next = { ...get().settings, dashboardPanels: reordered };
    set({ settings: next });
    void saveToStorage(next);
  },

  moveDashboardPanelDown: (id) => {
    const panels = [...get().settings.dashboardPanels].sort(
      (a, b) => a.order - b.order,
    );
    const idx = panels.findIndex((p) => p.id === id);
    if (idx < 0 || idx >= panels.length - 1) return;
    const reordered = panels.map((p, i) => {
      if (i === idx) return { ...p, order: idx + 1 };
      if (i === idx + 1) return { ...p, order: idx };
      return p;
    });
    const next = { ...get().settings, dashboardPanels: reordered };
    set({ settings: next });
    void saveToStorage(next);
  },

  setTerminalFontSize: (size) =>
    set((state) => {
      const next = {
        ...state.settings,
        connection: { ...state.settings.connection, terminalFontSize: size },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setTerminalScrollback: (lines) =>
    set((state) => {
      const next = {
        ...state.settings,
        connection: { ...state.settings.connection, terminalScrollback: lines },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setShowAutolevelMesh: (show) =>
    set((state) => {
      const next = {
        ...state.settings,
        showAutolevelMesh: show,
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setGeneralSettings: (patch) =>
    set((state) => {
      const next = {
        ...state.settings,
        general: { ...state.settings.general, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setProbeSettings: (patch) =>
    set((state) => {
      const next = {
        ...state.settings,
        probe: { ...state.settings.probe, ...normalizeSavedProbe(patch) },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setSpindleSettings: (patch: Partial<SpindleSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        spindle: { ...state.settings.spindle, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setStatsSettings: (patch: Partial<StatsSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        stats: { ...state.settings.stats, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setAiSettings: (patch: Partial<AiSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        ai: { ...state.settings.ai, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setStockSettings: (patch: Partial<StockSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        stock: { ...state.settings.stock, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setAtcSettings: (patch: Partial<AtcSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        atc: { ...state.settings.atc, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setCameraSettings: (patch: Partial<CameraSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        camera: { ...state.settings.camera, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setToolLibrarySettings: (patch: Partial<ToolLibrarySettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        toolLibrary: { ...state.settings.toolLibrary, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setFluidncManagerSettings: (patch: Partial<FluidNCManagerSettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        fluidncManager: { ...state.settings.fluidncManager, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  setRotarySettings: (patch: Partial<RotarySettings>) =>
    set((state) => {
      const next = {
        ...state.settings,
        rotary: { ...state.settings.rotary, ...patch },
      };
      void saveToStorage(next);
      return { settings: next };
    }),
  addMacro: (m) => set((state) => {
    const macro: Macro = { ...m, id: crypto.randomUUID() };
    const next = {
      ...state.settings,
      macros: [...state.settings.macros, macro]
    };
    void saveToStorage(next);
    return { settings: next };
  }),
  updateMacro: (id, patch) => set((state) => {
    const next = {
      ...state.settings,
      macros: state.settings.macros.map(m => m.id === id ? { ...m, ...patch } : m)
    };
    void saveToStorage(next);
    return { settings: next };
  }),
  deleteMacro: (id) => set((state) => {
    const next = {
      ...state.settings,
      macros: state.settings.macros.filter(m => m.id !== id)
    };
    void saveToStorage(next);
    return { settings: next };
  }),
  resetSettings: () => {
    set({ settings: DEFAULT_SETTINGS });
    void saveToStorage(DEFAULT_SETTINGS);
  },
}));
