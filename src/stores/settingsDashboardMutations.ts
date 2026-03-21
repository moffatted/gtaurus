import type { Settings } from './settingsStore';

export function withDashboardPanelEnabled(settings: Settings, id: string, enabled: boolean): Settings {
  const panels = settings.dashboardPanels.map((p) =>
    p.id === id ? { ...p, enabled } : p,
  );
  return { ...settings, dashboardPanels: panels };
}

export function withDashboardPanelDimensions(
  settings: Settings,
  id: string,
  dims: { defaultWidth?: number; defaultHeight?: number; minWidth?: number; minHeight?: number },
): Settings {
  const panels = settings.dashboardPanels.map((p) =>
    p.id === id ? { ...p, ...dims } : p,
  );
  return { ...settings, dashboardPanels: panels };
}

export function withDashboardLayout(settings: Settings, layout?: string): Settings {
  return { ...settings, dashboardLayout: layout };
}

export function withoutDashboardLayout(settings: Settings): Settings {
  return { ...settings, dashboardLayout: undefined };
}

export function withDashboardPanelMovedUp(settings: Settings, id: string): Settings {
  const panels = [...settings.dashboardPanels].sort((a, b) => a.order - b.order);
  const idx = panels.findIndex((p) => p.id === id);
  if (idx <= 0) return settings;

  const reordered = panels.map((p, i) => {
    if (i === idx - 1) return { ...p, order: idx };
    if (i === idx) return { ...p, order: idx - 1 };
    return p;
  });

  return { ...settings, dashboardPanels: reordered };
}

export function withDashboardPanelMovedDown(settings: Settings, id: string): Settings {
  const panels = [...settings.dashboardPanels].sort((a, b) => a.order - b.order);
  const idx = panels.findIndex((p) => p.id === id);
  if (idx < 0 || idx >= panels.length - 1) return settings;

  const reordered = panels.map((p, i) => {
    if (i === idx) return { ...p, order: idx + 1 };
    if (i === idx + 1) return { ...p, order: idx };
    return p;
  });

  return { ...settings, dashboardPanels: reordered };
}
