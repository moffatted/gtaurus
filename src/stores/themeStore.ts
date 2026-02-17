import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  initTheme: () => Promise<void>;
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}


export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',
  
  setTheme: async (theme: Theme) => {
    set({ theme });
    const s = await getStore();
    await s.set('theme', theme);
    await s.save();
    
    // Apply theme to document
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  },
  
  initTheme: async () => {
    try {
      const s = await getStore();
      const savedTheme = await s.get<Theme>('theme');
      const theme = savedTheme || 'light';
      set({ theme });
      
      // Apply theme to document
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Default to light theme
      const theme = 'light';
      set({ theme });
      document.documentElement.classList.add('light');
    }
  },
}));
