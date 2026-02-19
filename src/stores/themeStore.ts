import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';
import { isTauriApp } from '../utils/platform';

export type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => Promise<void>;
}

let store: Store | null = null;

async function getStore(): Promise<Store> {
  if (!store) {
    store = await Store.load('settings.json');
  }
  return store;
}

/** Apply .dark / .light class to <html> immediately — synchronous, never fails */
function applyThemeToDom(theme: Theme): void {
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  console.log('[theme] Applied to DOM:', theme, document.documentElement.className);
}

/** Persist theme to storage — async, failures are non-fatal */
async function persistTheme(theme: Theme): Promise<void> {
  try {
    if (isTauriApp()) {
      const s = await getStore();
      await s.set('theme', theme);
      await s.save();
    } else {
      localStorage.setItem('theme', theme);
    }
  } catch (error) {
    console.error('[theme] Failed to persist theme:', error);
  }
}

/** Load theme from storage — returns null if not found */
async function loadTheme(): Promise<Theme | null> {
  try {
    if (isTauriApp()) {
      const s = await getStore();
      const value = await s.get<Theme>('theme');
      return value ?? null;
    } else {
      const value = localStorage.getItem('theme');
      return value as Theme | null;
    }
  } catch (error) {
    console.error('[theme] Failed to load theme:', error);
    return null;
  }
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: 'light',

  // Synchronous from the caller's perspective — DOM updates immediately,
  // storage persistence is fire-and-forget.
  setTheme: (theme: Theme) => {
    // 1. Update React state
    set({ theme });
    // 2. Update DOM immediately (synchronous)
    applyThemeToDom(theme);
    // 3. Persist asynchronously (non-blocking)
    void persistTheme(theme);
  },

  initTheme: async () => {
    const savedTheme = await loadTheme();
    const theme = savedTheme || 'light';
    set({ theme });
    applyThemeToDom(theme);
  },
}));
