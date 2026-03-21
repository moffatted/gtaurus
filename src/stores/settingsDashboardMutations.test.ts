import { describe, it, expect } from 'vitest';
import {
  withDashboardPanelEnabled,
  withDashboardPanelDimensions,
  withDashboardLayout,
  withoutDashboardLayout,
  withDashboardPanelMovedUp,
  withDashboardPanelMovedDown,
} from './settingsDashboardMutations';
import type { Settings } from './settingsStore';

/** Minimal Settings stub — only the fields mutations touch */
function makeSettings(panels: { id: string; order: number; enabled: boolean }[]): Settings {
  return {
    dashboardPanels: panels.map((p) => ({
      ...p,
      label: p.id,
      defaultWidth: 400,
      defaultHeight: 300,
    })),
  } as unknown as Settings;
}

describe('withDashboardPanelEnabled', () => {
  it('enables a panel by id', () => {
    const s = makeSettings([{ id: 'console', order: 0, enabled: false }]);
    const result = withDashboardPanelEnabled(s, 'console', true);
    expect(result.dashboardPanels.find((p) => p.id === 'console')!.enabled).toBe(true);
  });

  it('disables a panel by id', () => {
    const s = makeSettings([{ id: 'console', order: 0, enabled: true }]);
    const result = withDashboardPanelEnabled(s, 'console', false);
    expect(result.dashboardPanels.find((p) => p.id === 'console')!.enabled).toBe(false);
  });

  it('leaves other panels unchanged', () => {
    const s = makeSettings([
      { id: 'console', order: 0, enabled: false },
      { id: 'visualizer', order: 1, enabled: true },
    ]);
    const result = withDashboardPanelEnabled(s, 'console', true);
    expect(result.dashboardPanels.find((p) => p.id === 'visualizer')!.enabled).toBe(true);
  });

  it('returns original settings when id not found', () => {
    const s = makeSettings([{ id: 'console', order: 0, enabled: false }]);
    const result = withDashboardPanelEnabled(s, 'nonexistent', true);
    expect(result.dashboardPanels).toEqual(s.dashboardPanels);
  });
});

describe('withDashboardPanelDimensions', () => {
  it('updates dimensions for the matching panel', () => {
    const s = makeSettings([{ id: 'console', order: 0, enabled: true }]);
    const result = withDashboardPanelDimensions(s, 'console', { defaultWidth: 800, minWidth: 200 });
    const panel = result.dashboardPanels.find((p) => p.id === 'console')!;
    expect(panel.defaultWidth).toBe(800);
    expect(panel.minWidth).toBe(200);
  });

  it('does not affect other panels', () => {
    const s = makeSettings([
      { id: 'console', order: 0, enabled: true },
      { id: 'visualizer', order: 1, enabled: true },
    ]);
    const result = withDashboardPanelDimensions(s, 'console', { defaultWidth: 999 });
    expect(result.dashboardPanels.find((p) => p.id === 'visualizer')!.defaultWidth).toBe(400);
  });
});

describe('withDashboardLayout', () => {
  it('sets the dashboard layout string', () => {
    const s = makeSettings([]);
    const result = withDashboardLayout(s, '{"some":"layout"}');
    expect(result.dashboardLayout).toBe('{"some":"layout"}');
  });

  it('clears the layout when called with undefined', () => {
    const s = { ...makeSettings([]), dashboardLayout: 'existing' };
    const result = withDashboardLayout(s, undefined);
    expect(result.dashboardLayout).toBeUndefined();
  });
});

describe('withoutDashboardLayout', () => {
  it('removes the dashboardLayout field', () => {
    const s = { ...makeSettings([]), dashboardLayout: '{"something":"here"}' };
    const result = withoutDashboardLayout(s);
    expect(result.dashboardLayout).toBeUndefined();
  });
});

describe('withDashboardPanelMovedUp', () => {
  it('swaps order of panel with the one above it', () => {
    const s = makeSettings([
      { id: 'a', order: 0, enabled: true },
      { id: 'b', order: 1, enabled: true },
      { id: 'c', order: 2, enabled: true },
    ]);
    const result = withDashboardPanelMovedUp(s, 'b');
    const panels = result.dashboardPanels;
    expect(panels.find((p) => p.id === 'b')!.order).toBe(0);
    expect(panels.find((p) => p.id === 'a')!.order).toBe(1);
    expect(panels.find((p) => p.id === 'c')!.order).toBe(2);
  });

  it('does nothing when panel is already first', () => {
    const s = makeSettings([
      { id: 'a', order: 0, enabled: true },
      { id: 'b', order: 1, enabled: true },
    ]);
    const result = withDashboardPanelMovedUp(s, 'a');
    expect(result.dashboardPanels.find((p) => p.id === 'a')!.order).toBe(0);
  });

  it('returns original settings when id not found', () => {
    const s = makeSettings([{ id: 'a', order: 0, enabled: true }]);
    expect(withDashboardPanelMovedUp(s, 'nonexistent')).toBe(s);
  });
});

describe('withDashboardPanelMovedDown', () => {
  it('swaps order of panel with the one below it', () => {
    const s = makeSettings([
      { id: 'a', order: 0, enabled: true },
      { id: 'b', order: 1, enabled: true },
      { id: 'c', order: 2, enabled: true },
    ]);
    const result = withDashboardPanelMovedDown(s, 'b');
    const panels = result.dashboardPanels;
    expect(panels.find((p) => p.id === 'b')!.order).toBe(2);
    expect(panels.find((p) => p.id === 'c')!.order).toBe(1);
    expect(panels.find((p) => p.id === 'a')!.order).toBe(0);
  });

  it('does nothing when panel is already last', () => {
    const s = makeSettings([
      { id: 'a', order: 0, enabled: true },
      { id: 'b', order: 1, enabled: true },
    ]);
    const result = withDashboardPanelMovedDown(s, 'b');
    expect(result.dashboardPanels.find((p) => p.id === 'b')!.order).toBe(1);
  });

  it('returns original settings when id not found', () => {
    const s = makeSettings([{ id: 'a', order: 0, enabled: true }]);
    expect(withDashboardPanelMovedDown(s, 'nonexistent')).toBe(s);
  });
});
