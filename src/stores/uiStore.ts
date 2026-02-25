import { create } from 'zustand';

export type SettingsTab = 'dashboard' | 'ui' | 'machine';

interface UIState {
  settingsOpen: boolean;
  settingsTab: SettingsTab;
  settingsSection: string | null;
  
  openSettings: (tab?: SettingsTab, section?: string) => void;
  closeSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  setSettingsSection: (section: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  settingsTab: 'dashboard',
  settingsSection: null,

  openSettings: (tab, section) => set((state) => ({ 
    settingsOpen: true, 
    settingsTab: tab || state.settingsTab,
    settingsSection: section || null
  })),
  closeSettings: () => set({ settingsOpen: false, settingsSection: null }),
  setSettingsTab: (tab) => set({ settingsTab: tab }),
  setSettingsSection: (section) => set({ settingsSection: section }),
}));
