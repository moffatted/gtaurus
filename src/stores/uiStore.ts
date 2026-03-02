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
  
  openSettings: (tab?: SettingsTab, section?: string) => void;
  closeSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setSettingsSection: (section: string | null) => void;
  
  openAIAssistant: () => void;
  closeAIAssistant: () => void;
  toggleAIAssistant: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  settingsTab: 'dashboard',
  settingsSection: null,
  aiAssistantOpen: false,

  openSettings: (tab, section) => set((state) => ({ 
    settingsOpen: true, 
    settingsTab: tab || state.settingsTab,
    settingsSection: section || null
  })),
  closeSettings: () => set({ settingsOpen: false, settingsSection: null }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setSettingsSection: (section) => set({ settingsSection: section }),

  openAIAssistant: () => set({ aiAssistantOpen: true }),
  closeAIAssistant: () => set({ aiAssistantOpen: false }),
  toggleAIAssistant: () => set((state) => ({ aiAssistantOpen: !state.aiAssistantOpen })),
}));
