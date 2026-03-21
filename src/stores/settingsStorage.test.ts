import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettingsFromStorage, saveSettingsToStorage } from './settingsStorage';
import type { Settings } from './settingsStore';

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

const makeSettings = (gcodeStoragePath = '/default/path'): Settings =>
    ({ gcodeStoragePath } as unknown as Settings);

describe('settingsStorage (localStorage / web mode)', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('loadSettingsFromStorage returns null when key is absent', async () => {
        const result = await loadSettingsFromStorage('gtaurus-settings');
        expect(result).toBeNull();
    });

    it('saveSettingsToStorage writes JSON to localStorage', async () => {
        const settings = makeSettings('/path/a');
        await saveSettingsToStorage('gtaurus-settings', settings);
        const raw = localStorage.getItem('gtaurus-settings');
        expect(raw).not.toBeNull();
        const parsed = JSON.parse(raw!);
        expect(parsed.gcodeStoragePath).toBe('/path/a');
    });

    it('loadSettingsFromStorage reads and parses JSON from localStorage', async () => {
        const settings = makeSettings('/path/b');
        localStorage.setItem('gtaurus-settings', JSON.stringify(settings));
        const result = await loadSettingsFromStorage('gtaurus-settings');
        expect(result).not.toBeNull();
        expect(result!.gcodeStoragePath).toBe('/path/b');
    });

    it('save then load round-trips the settings object', async () => {
        const settings = makeSettings('/path/roundtrip');
        await saveSettingsToStorage('gtaurus-settings', settings);
        const result = await loadSettingsFromStorage('gtaurus-settings');
        expect(result).toMatchObject({ gcodeStoragePath: '/path/roundtrip' });
    });

    it('loadSettingsFromStorage with a different key returns null when not set', async () => {
        await saveSettingsToStorage('key-a', makeSettings());
        const result = await loadSettingsFromStorage('key-b');
        expect(result).toBeNull();
    });
});
