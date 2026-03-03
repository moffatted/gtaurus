/**
 * @file uiStore.ts
 * @purpose Controls global UI states such as settings modal visibility and active tab selection.
 */
import { create } from 'zustand';

export type SettingsTab = 'dashboard' | 'ui' | 'machine';

interface UIState {
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  settingsSection: string | null;
  aiAssistantOpen: boolean;
  fluidNCManagerOpen: boolean;
  machineStatsOpen: boolean;
  toolChangerOpen: boolean;
  toolLibraryOpen: boolean;
  
  zIndexMap: Record<string, number>;
  
  openSettings: (tab?: SettingsTab, section?: string) => void;
  closeSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setSettingsSection: (section: string | null) => void;
  
  openAIAssistant: () => void;
  closeAIAssistant: () => void;
  toggleAIAssistant: () => void;

  openFluidNCManager: () => void;
  closeFluidNCManager: () => void;
  toggleFluidNCManager: () => void;

  openMachineStats: () => void;
  closeMachineStats: () => void;
  toggleMachineStats: () => void;

  openToolChanger: () => void;
  closeToolChanger: () => void;
  toggleToolChanger: () => void;

  openToolLibrary: () => void;
  closeToolLibrary: () => void;
  toggleToolLibrary: () => void;

  bringToFront: (windowId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  settingsTab: 'dashboard',
  settingsSection: null,
  aiAssistantOpen: false,
  fluidNCManagerOpen: false,
  machineStatsOpen: false,
  toolChangerOpen: false,
  toolLibraryOpen: false,

  zIndexMap: {
    aiAssistant: 100,
    fluidNCManager: 110,
    machineStats: 120,
    toolChanger: 200, // Tool changer is critical, keep it high
    toolLibrary: 115
  },

  openSettings: (tab, section) => set((state) => ({ 
    settingsOpen: true, 
    settingsTab: tab || state.settingsTab,
    settingsSection: section || null
  })),
  closeSettings: () => set({ settingsOpen: false, settingsSection: null }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setSettingsSection: (section) => set({ settingsSection: section }),

  openAIAssistant: () => set((state) => {
    state.bringToFront('aiAssistant');
    return { aiAssistantOpen: true };
  }),
  closeAIAssistant: () => set({ aiAssistantOpen: false }),
  toggleAIAssistant: () => set((state) => {
    if (!state.aiAssistantOpen) state.bringToFront('aiAssistant');
    return { aiAssistantOpen: !state.aiAssistantOpen };
  }),

  openFluidNCManager: () => set((state) => {
    state.bringToFront('fluidNCManager');
    return { fluidNCManagerOpen: true };
  }),
  closeFluidNCManager: () => set({ fluidNCManagerOpen: false }),
  toggleFluidNCManager: () => set((state) => {
    if (!state.fluidNCManagerOpen) state.bringToFront('fluidNCManager');
    return { fluidNCManagerOpen: !state.fluidNCManagerOpen };
  }),

  openMachineStats: () => set((state) => {
    state.bringToFront('machineStats');
    return { machineStatsOpen: true };
  }),
  closeMachineStats: () => set({ machineStatsOpen: false }),
  toggleMachineStats: () => set((state) => {
    if (!state.machineStatsOpen) state.bringToFront('machineStats');
    return { machineStatsOpen: !state.machineStatsOpen };
  }),

  openToolChanger: () => set((state) => {
    state.bringToFront('toolChanger');
    return { toolChangerOpen: true };
  }),
  closeToolChanger: () => set({ toolChangerOpen: false }),
  toggleToolChanger: () => set((state) => {
    if (!state.toolChangerOpen) state.bringToFront('toolChanger');
    return { toolChangerOpen: !state.toolChangerOpen };
  }),

  openToolLibrary: () => set((state) => {
    state.bringToFront('toolLibrary');
    return { toolLibraryOpen: true };
  }),
  closeToolLibrary: () => set({ toolLibraryOpen: false }),
  toggleToolLibrary: () => set((state) => {
    if (!state.toolLibraryOpen) state.bringToFront('toolLibrary');
    return { toolLibraryOpen: !state.toolLibraryOpen };
  }),

  bringToFront: (windowId) => set((state) => {
    const maxZ = Math.max(...Object.values(state.zIndexMap));
    return {
      zIndexMap: {
        ...state.zIndexMap,
        [windowId]: maxZ + 1
      }
    };
  }),
}));
