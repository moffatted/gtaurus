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

  // ─── updateSettings ───────────────────────────────────────────────────────

  it('updateSettings merges partial patch into settings', () => {
    useSettingsStore.getState().updateSettings({ gcodeStoragePath: '/new/path' });
    expect(useSettingsStore.getState().settings.gcodeStoragePath).toBe('/new/path');
  });

  it('updateSettings clamps statusPollInterval to minimum 1000ms', () => {
    useSettingsStore.getState().updateSettings({
      connection: { ...DEFAULT_SETTINGS.connection, statusPollInterval: 100 },
    });
    expect(useSettingsStore.getState().settings.connection.statusPollInterval).toBe(1000);
  });

  it('updateSettings allows statusPollInterval >= 1000ms', () => {
    useSettingsStore.getState().updateSettings({
      connection: { ...DEFAULT_SETTINGS.connection, statusPollInterval: 5000 },
    });
    expect(useSettingsStore.getState().settings.connection.statusPollInterval).toBe(5000);
  });

  // ─── Dashboard layout ─────────────────────────────────────────────────────

  it('setDashboardLayout stores layout JSON', () => {
    useSettingsStore.getState().setDashboardLayout('{"panels":[]}');
    expect(useSettingsStore.getState().settings.dashboardLayout).toBe('{"panels":[]}');
  });

  it('resetDashboardLayout clears dashboardLayout', () => {
    useSettingsStore.getState().setDashboardLayout('{"panels":[]}');
    useSettingsStore.getState().resetDashboardLayout();
    expect(useSettingsStore.getState().settings.dashboardLayout).toBeUndefined();
  });

  it('setDashboardPanelDimensions updates panel dimensions', () => {
    useSettingsStore.getState().setDashboardPanelDimensions('controls', { defaultWidth: 800, defaultHeight: 600 });
    const panel = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'controls');
    expect(panel?.defaultWidth).toBe(800);
    expect(panel?.defaultHeight).toBe(600);
  });

  // ─── Dashboard panel move ─────────────────────────────────────────────────

  it('moveDashboardPanelDown moves panel down', () => {
    const before = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'controls');
    const beforeOrder = before!.order;
    useSettingsStore.getState().moveDashboardPanelDown('controls');
    const after = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'controls');
    expect(after!.order).toBeGreaterThan(beforeOrder);
  });

  it('moveDashboardPanelUp moves panel up', () => {
    // Move console down first so it has room to move back up
    useSettingsStore.getState().moveDashboardPanelDown('console');
    const before = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'console');
    const beforeOrder = before!.order;
    useSettingsStore.getState().moveDashboardPanelUp('console');
    const after = useSettingsStore.getState().settings.dashboardPanels.find(p => p.id === 'console');
    expect(after!.order).toBeLessThan(beforeOrder);
  });

  // ─── Connection helpers ───────────────────────────────────────────────────

  it('setTerminalFontSize updates font size', () => {
    useSettingsStore.getState().setTerminalFontSize(18);
    expect(useSettingsStore.getState().settings.connection.terminalFontSize).toBe(18);
  });

  it('setTerminalScrollback updates scrollback', () => {
    useSettingsStore.getState().setTerminalScrollback(2000);
    expect(useSettingsStore.getState().settings.connection.terminalScrollback).toBe(2000);
  });

  it('setShowAutolevelMesh updates flag', () => {
    useSettingsStore.getState().setShowAutolevelMesh(true);
    expect(useSettingsStore.getState().settings.showAutolevelMesh).toBe(true);
  });

  // ─── Subsection setters ───────────────────────────────────────────────────

  it('setGeneralSettings patches general settings', () => {
    useSettingsStore.getState().setGeneralSettings({ feedRate: 2500 });
    expect(useSettingsStore.getState().settings.general.feedRate).toBe(2500);
  });

  it('setGeneralSettings preserves other general fields', () => {
    const originalUnits = useSettingsStore.getState().settings.general.carvingUnits;
    useSettingsStore.getState().setGeneralSettings({ feedRate: 999 });
    expect(useSettingsStore.getState().settings.general.carvingUnits).toBe(originalUnits);
  });

  it('setProbeSettings patches probe settings', () => {
    useSettingsStore.getState().setProbeSettings({ maxTravel: 80 });
    expect(useSettingsStore.getState().settings.probe.maxTravel).toBe(80);
  });

  it('setSpindleSettings patches spindle settings', () => {
    useSettingsStore.getState().setSpindleSettings({ maxRPM: 30000 });
    expect(useSettingsStore.getState().settings.spindle.maxRPM).toBe(30000);
  });

  it('setStatsSettings patches stats settings', () => {
    useSettingsStore.getState().setStatsSettings({ enabled: true });
    expect(useSettingsStore.getState().settings.stats.enabled).toBe(true);
  });

  it('setStockSettings patches stock settings', () => {
    useSettingsStore.getState().setStockSettings({ width: 500 });
    expect(useSettingsStore.getState().settings.stock.width).toBe(500);
  });

  it('setAtcSettings patches atc settings', () => {
    useSettingsStore.getState().setAtcSettings({ enabled: true });
    expect(useSettingsStore.getState().settings.atc.enabled).toBe(true);
  });

  it('setCameraSettings patches camera settings', () => {
    useSettingsStore.getState().setCameraSettings({ streamUrl: 'http://192.168.1.1/stream' });
    expect(useSettingsStore.getState().settings.camera.streamUrl).toBe('http://192.168.1.1/stream');
  });

  it('setToolLibrarySettings patches toolLibrary settings', () => {
    useSettingsStore.getState().setToolLibrarySettings({ enabled: true });
    expect(useSettingsStore.getState().settings.toolLibrary.enabled).toBe(true);
  });

  it('setFluidncManagerSettings patches fluidncManager settings', () => {
    useSettingsStore.getState().setFluidncManagerSettings({ enabled: true });
    expect(useSettingsStore.getState().settings.fluidncManager.enabled).toBe(true);
  });

  it('setRotarySettings patches rotary settings', () => {
    useSettingsStore.getState().setRotarySettings({ enabled: true });
    expect(useSettingsStore.getState().settings.rotary.enabled).toBe(true);
  });

  // ─── Macros ───────────────────────────────────────────────────────────────

  it('addMacro appends a macro with a generated UUID', () => {
    useSettingsStore.getState().addMacro({ name: 'Park', content: 'G0 Z10' });
    const macros = useSettingsStore.getState().settings.macros;
    const added = macros.find(m => m.name === 'Park');
    expect(added).toBeDefined();
    expect(added?.id).toBeTruthy();
    expect(added?.content).toBe('G0 Z10');
  });

  it('updateMacro edits an existing macro', () => {
    useSettingsStore.getState().addMacro({ name: 'OldName', content: 'G0 Z5' });
    const macros = useSettingsStore.getState().settings.macros;
    const id = macros.find(m => m.name === 'OldName')!.id;
    useSettingsStore.getState().updateMacro(id, { name: 'NewName' });
    const updated = useSettingsStore.getState().settings.macros.find(m => m.id === id);
    expect(updated?.name).toBe('NewName');
    expect(updated?.content).toBe('G0 Z5'); // unchanged
  });

  it('deleteMacro removes the macro by id', () => {
    useSettingsStore.getState().addMacro({ name: 'ToDelete', content: '' });
    const id = useSettingsStore.getState().settings.macros.find(m => m.name === 'ToDelete')!.id;
    useSettingsStore.getState().deleteMacro(id);
    expect(useSettingsStore.getState().settings.macros.find(m => m.id === id)).toBeUndefined();
  });

  it('deleteMacro does not affect other macros', () => {
    useSettingsStore.getState().addMacro({ name: 'Keep', content: 'G28' });
    useSettingsStore.getState().addMacro({ name: 'Remove', content: '' });
    const removeId = useSettingsStore.getState().settings.macros.find(m => m.name === 'Remove')!.id;
    useSettingsStore.getState().deleteMacro(removeId);
    expect(useSettingsStore.getState().settings.macros.find(m => m.name === 'Keep')).toBeDefined();
  });

  // ─── resetSettings ────────────────────────────────────────────────────────

  it('resetSettings restores default settings', () => {
    useSettingsStore.getState().setGeneralSettings({ feedRate: 9999 });
    useSettingsStore.getState().resetSettings();
    expect(useSettingsStore.getState().settings.general.feedRate).toBe(DEFAULT_SETTINGS.general.feedRate);
  });
});
