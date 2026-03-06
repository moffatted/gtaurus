/**
 * @file themeStore.ts
 * @purpose Manages the application's visual theme (light/dark mode) and persists the selection.
 */
import { create } from 'zustand';
import { Store } from '@tauri-apps/plugin-store';
import { isTauriApp } from '../utils/platform';

export type Theme = 'light' | 'dark' | 'midnight' | 'nord' | 'dracula' | 'bamboo';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  initTheme: () => Promise<void>;
}

let store: Store | null = null;

async function getStore(): Promise<Store | null> {
  if (store) return store;
  
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn("[theme] Store.load timed out after 3s");
      resolve(null);
    }, 3000);

    Store.load('settings.json')
      .then((s) => {
        clearTimeout(timer);
        store = s;
        resolve(s);
      })
      .catch((err) => {
        clearTimeout(timer);
        console.error("[theme] Store.load failed:", err);
        resolve(null);
      });
  });
}

/** Apply [data-theme] to <html> immediately — synchronous, never fails */
function applyThemeToDom(theme: Theme): void {
  // Always include 'dark' class if the theme is a dark variant for tailwind 'dark:' utility support
  const isDark = theme !== 'light';
  
  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(isDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  
  console.log('[theme] Applied to DOM:', theme, 'isDark:', isDark);
}

/** Persist theme to storage — async, failures are non-fatal */
async function persistTheme(theme: Theme): Promise<void> {
  try {
    if (isTauriApp()) {
      const s = await getStore();
      if (!s) return;
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
      if (!s) return null;

      return await new Promise((resolve) => {
        const timer = setTimeout(() => {
          console.warn("[theme] s.get timed out after 2s");
          resolve(null);
        }, 2000);

        s.get<Theme>('theme').then((val) => {
          clearTimeout(timer);
          resolve(val ?? null);
        }).catch((err) => {
          clearTimeout(timer);
          console.error("[theme] s.get failed:", err);
          resolve(null);
        });
      });
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
