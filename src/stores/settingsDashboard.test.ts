import { describe, it, expect } from 'vitest';
import { buildDashboardPanels } from './settingsDashboard';

const available = [
  { id: 'controls', label: 'Controls', enabled: true, defaultWidth: 600, defaultHeight: 541, minWidth: 380, minHeight: 450 },
  { id: 'visualizer', label: 'Visualizer', enabled: true, defaultWidth: 800, defaultHeight: 600 },
  { id: 'console', label: 'Console', enabled: false, defaultWidth: 400, defaultHeight: 300 },
];

describe('buildDashboardPanels', () => {
  it('returns all available panels when savedPanels is undefined', () => {
    const result = buildDashboardPanels(undefined, available);
    expect(result).toHaveLength(available.length);
    expect(result.map((p) => p.id)).toEqual(expect.arrayContaining(['controls', 'visualizer', 'console']));
  });

  it('assigns order to panels added from available', () => {
    const result = buildDashboardPanels(undefined, available);
    result.forEach((p) => expect(typeof p.order).toBe('number'));
  });

  it('merges saved panel properties with available defaults', () => {
    const saved = [{ id: 'controls', label: 'Controls', enabled: false, order: 0 }];
    const result = buildDashboardPanels(saved, available);
    const controls = result.find((p) => p.id === 'controls')!;
    expect(controls.enabled).toBe(false);
    expect(controls.defaultWidth).toBe(600);
  });

  it('uses label from available, not from saved', () => {
    const saved = [{ id: 'controls', label: 'Old Label', enabled: true, order: 0 }];
    const result = buildDashboardPanels(saved, available);
    expect(result.find((p) => p.id === 'controls')!.label).toBe('Controls');
  });

  it('drops saved panels whose id no longer exists in available', () => {
    const saved = [
      { id: 'controls', label: 'Controls', enabled: true, order: 0 },
      { id: 'obsolete-panel', label: 'Old', enabled: true, order: 1 },
    ];
    const result = buildDashboardPanels(saved, available);
    expect(result.find((p) => p.id === 'obsolete-panel')).toBeUndefined();
  });

  it('adds panels from available that are missing from saved', () => {
    const saved = [{ id: 'controls', label: 'Controls', enabled: true, order: 0 }];
    const result = buildDashboardPanels(saved, available);
    expect(result.find((p) => p.id === 'visualizer')).toBeDefined();
    expect(result.find((p) => p.id === 'console')).toBeDefined();
  });

  it('migrates legacy dro+jog panels to controls panel', () => {
    const legacySaved = [
      { id: 'dro', label: 'DRO', enabled: true, order: 0 },
      { id: 'jog', label: 'Jog', enabled: true, order: 1 },
      { id: 'visualizer', label: 'Visualizer', enabled: true, order: 2 },
    ];
    const result = buildDashboardPanels(legacySaved, available);
    expect(result.find((p) => p.id === 'dro')).toBeUndefined();
    expect(result.find((p) => p.id === 'jog')).toBeUndefined();
    const controls = result.find((p) => p.id === 'controls');
    expect(controls).toBeDefined();
    expect(controls!.enabled).toBe(true);
  });

  it('disables controls if both legacy dro and jog were disabled', () => {
    const legacySaved = [
      { id: 'dro', label: 'DRO', enabled: false, order: 0 },
      { id: 'jog', label: 'Jog', enabled: false, order: 1 },
    ];
    const result = buildDashboardPanels(legacySaved, available);
    const controls = result.find((p) => p.id === 'controls');
    expect(controls!.enabled).toBe(false);
  });
});
