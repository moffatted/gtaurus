import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useThemeStore } from './themeStore';

vi.mock('@tauri-apps/plugin-store', () => ({
    Store: {
        load: vi.fn().mockResolvedValue({
            get: vi.fn().mockResolvedValue(null),
            set: vi.fn(),
            save: vi.fn(),
        }),
    },
}));

vi.mock('../utils/platform', () => ({
    isTauriApp: () => false,
    isWebApp: () => true,
}));

describe('themeStore', () => {
    beforeEach(() => {
        useThemeStore.setState({ theme: 'light' });
        document.documentElement.removeAttribute('data-theme');
        document.documentElement.className = '';
        localStorage.clear();
    });

    it('should default to light theme', () => {
        expect(useThemeStore.getState().theme).toBe('light');
    });

    it('setTheme should update store state', () => {
        useThemeStore.getState().setTheme('dark');
        expect(useThemeStore.getState().theme).toBe('dark');
    });

    it('setTheme should apply data-theme attribute to documentElement', () => {
        useThemeStore.getState().setTheme('midnight');
        expect(document.documentElement.getAttribute('data-theme')).toBe('midnight');
    });

    it('setTheme should add dark class for dark variants', () => {
        useThemeStore.getState().setTheme('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(document.documentElement.classList.contains('light')).toBe(false);
    });

    it('setTheme should add light class for light theme', () => {
        useThemeStore.getState().setTheme('dark');
        useThemeStore.getState().setTheme('light');
        expect(document.documentElement.classList.contains('light')).toBe(true);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('setTheme should persist to localStorage in web mode', () => {
        useThemeStore.getState().setTheme('nord');
        expect(localStorage.getItem('theme')).toBe('nord');
    });

    it('initTheme should load theme from localStorage', async () => {
        localStorage.setItem('theme', 'dracula');
        await useThemeStore.getState().initTheme();
        expect(useThemeStore.getState().theme).toBe('dracula');
        expect(document.documentElement.getAttribute('data-theme')).toBe('dracula');
    });

    it('initTheme should default to light when nothing is stored', async () => {
        await useThemeStore.getState().initTheme();
        expect(useThemeStore.getState().theme).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });

    it.each([
        ['dark', true],
        ['midnight', true],
        ['nord', true],
        ['dracula', true],
        ['bamboo', true],
        ['light', false],
    ] as const)('setTheme("%s") isDark=%s', (theme, isDark) => {
        useThemeStore.getState().setTheme(theme);
        expect(document.documentElement.classList.contains('dark')).toBe(isDark);
    });
});
