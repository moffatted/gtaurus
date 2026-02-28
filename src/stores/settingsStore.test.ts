/**
 * @file settingsStore.test.ts
 * @purpose Unit tests for the settings store, verifying persistence and incremental updates.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSettingsStore, DEFAULT_SETTINGS } from './settingsStore';

// Mock the Tauri store plugin to prevent actual file I/O during tests
vi.mock('@tauri-apps/plugin-store', () => ({
  Store: {
    load: vi.fn().mockResolvedValue({
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    }),
  }
}));

describe('settingsStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useSettingsStore.setState({ settings: DEFAULT_SETTINGS, initialized: true });
  });

  it('initializes with default settings', () => {
    const state = useSettingsStore.getState();
    expect(state.initialized).toBe(true);
    expect(state.settings.showAutolevelMesh).toBe(false);
  });

  it('updates settings incrementally', () => {
    const { updateSettings } = useSettingsStore.getState();
    
    // Toggle autolevel mesh
    updateSettings({ showAutolevelMesh: true });

    const state = useSettingsStore.getState();
    expect(state.settings.showAutolevelMesh).toBe(true);
  });

  it('enables and disables dashboard panels', () => {
    const { setDashboardPanelEnabled } = useSettingsStore.getState();
    
    // Controls panel is enabled by default, so we should test disabling or test a disabled one instead like 'manager'
    const managerPanelInitial = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'manager');
    expect(managerPanelInitial?.enabled).toBe(false);

    // Enable manager panel
    setDashboardPanelEnabled('manager', true);
    
    const managerPanelUpdated = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'manager');
    expect(managerPanelUpdated?.enabled).toBe(true);
  });
});
