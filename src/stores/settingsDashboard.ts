type DashboardPanelBase = {
  id: string;
  label: string;
  enabled: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
};

type DashboardPanelSaved = DashboardPanelBase & { order: number };

const LEGACY_CONTROLS_PANEL: DashboardPanelSaved = {
  id: "controls",
  label: "Controls",
  enabled: true,
  order: 0,
  defaultWidth: 600,
  defaultHeight: 541,
  minWidth: 380,
  minHeight: 450,
};

function migrateLegacyPanels(savedPanels: DashboardPanelSaved[]): DashboardPanelSaved[] {
  const hasOldPanels = savedPanels.some((p) => p.id === "dro" || p.id === "jog");
  if (!hasOldPanels) return [...savedPanels];

  const dro = savedPanels.find((p) => p.id === "dro");
  const jog = savedPanels.find((p) => p.id === "jog");
  const wasEnabled = (dro?.enabled || jog?.enabled) ?? true;

  const removedLegacy = savedPanels.filter((p) => p.id !== "dro" && p.id !== "jog");
  const controls = removedLegacy.find((p) => p.id === "controls");

  if (!controls) {
    return [...removedLegacy, { ...LEGACY_CONTROLS_PANEL, enabled: wasEnabled }];
  }

  return removedLegacy.map((p) => (p.id === "controls" ? { ...p, enabled: wasEnabled } : p));
}

export function buildDashboardPanels(
  savedPanels: DashboardPanelSaved[] | undefined,
  availablePanels: DashboardPanelBase[],
): DashboardPanelSaved[] {
  const migrated = migrateLegacyPanels(savedPanels ?? []);

  const validIds = new Set(availablePanels.map((p) => p.id));
  const merged = migrated.filter((p) => validIds.has(p.id));

  const currentIds = new Set(merged.map((p) => p.id));
  availablePanels.forEach((p) => {
    if (!currentIds.has(p.id)) {
      merged.push({ ...p, order: merged.length });
    }
  });

  const labelMap = new Map(availablePanels.map((p) => [p.id, p.label]));
  const defaultsMap = new Map(availablePanels.map((p) => [p.id, p]));

  return merged.map((p) => ({
    ...defaultsMap.get(p.id),
    ...p,
    label: labelMap.get(p.id) || p.label,
  }));
}
