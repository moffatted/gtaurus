/**
 * Platform detection utilities for Gtaurus
 * Detects whether the app is running in Tauri (desktop) or web browser
 */

/**
 * Check if the application is running in a Tauri environment
 * @returns true if running as a Tauri desktop app, false if running in web browser
 */
export const isTauriApp = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
};

/**
 * Check if the application is running in a web browser
 * @returns true if running in web browser, false if running as Tauri desktop app
 */
export const isWebApp = (): boolean => {
  return !isTauriApp();
};

/**
 * Get the platform name
 * @returns 'tauri' or 'web'
 */
export const getPlatform = (): 'tauri' | 'web' => {
  return isTauriApp() ? 'tauri' : 'web';
};
