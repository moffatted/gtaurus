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

  it('seeds AI clients in default settings', () => {
    const state = useSettingsStore.getState();
    expect(state.settings.ai.clients.length).toBeGreaterThan(0);
    expect(state.settings.ai.activeClientId).toBeTruthy();
  });

  it('updates active AI client when setAiSettings is called', () => {
    const { setAiSettings } = useSettingsStore.getState();
    const firstClient = useSettingsStore.getState().settings.ai.clients[0];

    const injectedClient = {
      ...firstClient,
      id: 'test-client-id',
      name: 'Test Client',
      tier: 'pro' as const,
      model: 'gemini-1.5-pro',
    };

    setAiSettings({
      clients: [firstClient, injectedClient],
      activeClientId: 'test-client-id',
    });

    const state = useSettingsStore.getState();
    expect(state.settings.ai.activeClientId).toBe('test-client-id');
    expect(state.settings.ai.tier).toBe('pro');
  });

  it('enables and disables dashboard panels', () => {
    const { setDashboardPanelEnabled } = useSettingsStore.getState();
    
    // Controls panel is enabled by default, so we should test disabling or test a disabled one instead like 'visualizer'
    const visualizerPanelInitial = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'visualizer');
    expect(visualizerPanelInitial?.enabled).toBe(false);

    // Enable visualizer panel
    setDashboardPanelEnabled('visualizer', true);
    
    const visualizerPanelUpdated = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'visualizer');
    expect(visualizerPanelUpdated?.enabled).toBe(true);
  });
});
