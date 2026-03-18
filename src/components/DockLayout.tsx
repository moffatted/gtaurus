/**
 * @file DockLayout.tsx
 * @purpose Implements the flexible docking system for UI panels using Dockview.
 */
import { ReactNode, useState, useMemo, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview';
import 'dockview-core/dist/styles/dockview.css';
import { BedVisualizer } from './BedVisualizer';
import { useSettingsStore } from '../stores/settingsStore';
import type { DashboardPanel } from '../stores/settingsStore';
import { AutoLevelPanel } from './AutoLevelPanel';
import { MacrosPanel } from './MacrosPanel';
import { useThemeStore } from '../stores/themeStore';
import "./DockLayout.css"; 

const DEFAULT_PANEL_MIN_WIDTH = 100;
const DEFAULT_PANEL_MIN_HEIGHT = 100;

interface DockLayoutProps {
  consolePanel: ReactNode;
  controlsPanel: ReactNode;
  fileManagerPanel: ReactNode;
  probePanel: ReactNode;
  workpiecePanel: ReactNode;
}

// Context to provide panel content to wrapper components
const DockLayoutContext = createContext<DockLayoutProps | null>(null);

function PanelShell({ panelId, children }: { panelId: string; children: ReactNode }) {
    const panel = useSettingsStore((state) =>
        state.settings.dashboardPanels.find((p) => p.id === panelId)
    );

    const minWidthPx = panel?.minWidth ? `${panel.minWidth}px` : undefined;
    const minHeightPx = panel?.minHeight ? `${panel.minHeight}px` : undefined;

    return (
        <div
            className="h-full w-full"
            style={{
                overflowX: 'auto',
                overflowY: 'auto',
            }}
        >
            <div
                className="h-full"
                style={{
                    width: minWidthPx ? `max(100%, ${minWidthPx})` : '100%',
                    height: minHeightPx ? `max(100%, ${minHeightPx})` : '100%',
                    minWidth: minWidthPx ?? '100%',
                    minHeight: minHeightPx ?? '100%',
                }}
            >
                {children}
            </div>
        </div>
    );
}

// Wrapper Components
const ConsolePanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <PanelShell panelId="console">{ctx.consolePanel}</PanelShell>;
}
const ControlsPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <PanelShell panelId="controls">{ctx.controlsPanel}</PanelShell>;
}
const FileManagerPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <PanelShell panelId="fileManager">{ctx.fileManagerPanel}</PanelShell>;
}
const ProbePanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <PanelShell panelId="probe">{ctx.probePanel}</PanelShell>;
}
const WorkpiecePanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <PanelShell panelId="workpiece">{ctx.workpiecePanel}</PanelShell>;
}
const MacrosPanelWrapper = () => (
    <PanelShell panelId="macros">
        <MacrosPanel />
    </PanelShell>
);
const AutoLevelPanelWrapper = () => (
    <PanelShell panelId="autolevel">
        <AutoLevelPanel />
    </PanelShell>
);
const VisualizerPanelWrapper = () => (
    <PanelShell panelId="visualizer">
        <BedVisualizer />
    </PanelShell>
);


export function DockLayout(props: DockLayoutProps) {
  const { settings, setDashboardPanelEnabled, setDashboardLayout } = useSettingsStore();
  const { theme } = useThemeStore();
  const [api, setApi] = useState<any>(null);
  const prevOrderRef = useRef<string>('');
    const prevLayoutRef = useRef<string | undefined>(settings.dashboardLayout);
    const panelSizeGuardDisposersRef = useRef<Record<string, () => void>>({});
  const isRebuildingRef = useRef<boolean>(false);

    const clearPanelSizeGuard = useCallback((panelId: string) => {
        const dispose = panelSizeGuardDisposersRef.current[panelId];
        if (dispose) {
            dispose();
            delete panelSizeGuardDisposersRef.current[panelId];
        }
    }, []);

    const clearAllPanelSizeGuards = useCallback(() => {
        Object.values(panelSizeGuardDisposersRef.current).forEach((dispose) => dispose());
        panelSizeGuardDisposersRef.current = {};
    }, []);

    const enforcePanelConstraints = useCallback((panel: any, minW: number, minH: number) => {
        const constraints = { minimumWidth: minW, minimumHeight: minH };

        if (typeof panel?.setConstraints === 'function') {
            panel.setConstraints(constraints);
        }

        const groupApi = panel?.group?.api;
        if (groupApi && typeof groupApi.setConstraints === 'function') {
            groupApi.setConstraints(constraints);
        }

        // If current panel dimensions are already below configured minimums,
        // request an immediate resize back to the floor.
        if (typeof panel?.setSize === 'function') {
            if (typeof panel.width === 'number' && panel.width < minW) {
                panel.setSize({ width: minW });
            }
            if (typeof panel.height === 'number' && panel.height < minH) {
                panel.setSize({ height: minH });
            }
        }
    }, []);

    const attachPanelSizeGuard = useCallback((panel: any, panelId: string, minW: number, minH: number) => {
        clearPanelSizeGuard(panelId);

        if (typeof panel?.onDidDimensionsChange !== 'function' || typeof panel?.setSize !== 'function') {
            return;
        }

        const disposable = panel.onDidDimensionsChange(() => {
            if (typeof panel.width === 'number' && panel.width < minW) {
                panel.setSize({ width: minW });
            }
            if (typeof panel.height === 'number' && panel.height < minH) {
                panel.setSize({ height: minH });
            }
        });

        panelSizeGuardDisposersRef.current[panelId] = () => {
            if (disposable && typeof disposable.dispose === 'function') {
                disposable.dispose();
            }
        };
    }, [clearPanelSizeGuard]);

    const minDashboardWidth = useMemo(() => {
        const activePanels = [...settings.dashboardPanels]
            .filter((p) => p.enabled)
            .sort((a, b) => a.order - b.order);

        if (activePanels.length === 0) return 0;

        // In this layout pattern index 0 and odd indices add horizontal columns.
        return activePanels.reduce((sum, panel, index) => {
            if (index === 0 || index % 2 === 1) {
                return sum + (panel.minWidth ?? DEFAULT_PANEL_MIN_WIDTH);
            }
            return sum;
        }, 0);
    }, [settings.dashboardPanels]);

  const buildLayout = useCallback((apiInstance: any) => {
      console.log("Initializing Layout...");
      isRebuildingRef.current = true;
      try {
          apiInstance.clear();
          const activePanels = [...settings.dashboardPanels]
              .filter(p => p.enabled)
              .sort((a, b) => a.order - b.order);

          activePanels.forEach((panelData, index) => {
              const panelConfig: any = {
                  id: panelData.id,
                  component: panelData.id,
                  title: panelData.label,
                  renderer: 'always',
                  minimumWidth: panelData.minWidth ?? DEFAULT_PANEL_MIN_WIDTH,
                  minimumHeight: panelData.minHeight ?? DEFAULT_PANEL_MIN_HEIGHT,
                  initialWidth: panelData.defaultWidth,
                  initialHeight: panelData.defaultHeight
              };

              if (index === 0) {
                 apiInstance.addPanel(panelConfig);
              } else {
                 panelConfig.position = { 
                     direction: index % 2 === 1 ? 'right' : 'below'
                 };
                 apiInstance.addPanel(panelConfig);
              }
          });
      } finally {
          isRebuildingRef.current = false;
      }
  }, [settings.dashboardPanels]);

  const components = useMemo(() => ({
      console: ConsolePanel,
      controls: ControlsPanel,
      dro: ControlsPanel,
      jog: ControlsPanel,
      fileManager: FileManagerPanel,
      probe: ProbePanelWrapper,
      workpiece: WorkpiecePanelWrapper,
      macros: MacrosPanelWrapper,
      visualizer: VisualizerPanelWrapper,
      autolevel: AutoLevelPanelWrapper,
      default: (_props: IDockviewPanelProps) => <div className="p-4">Unknown Panel</div>
  }), []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
      console.log("Dockview Ready Event Fired");
      const apiInstance = event.api;
      setApi(apiInstance);

      let loaded = false;
      if (settings.dashboardLayout) {
          try {
              console.log("Loading saved layout from store...");
              apiInstance.fromJSON(JSON.parse(settings.dashboardLayout));
              loaded = true;
          } catch(e) {
              console.error("Failed to load saved dockview layout", e);
          }
      }

      if (!loaded) {
          buildLayout(apiInstance);
      }
      
      apiInstance.onDidLayoutChange(() => {
          if (isRebuildingRef.current) return;
          setDashboardLayout(JSON.stringify(apiInstance.toJSON()));
      });

      apiInstance.onDidRemovePanel((event: any) => {
           if (isRebuildingRef.current) return;
           clearPanelSizeGuard(event.id);
           setDashboardPanelEnabled(event.id, false);
      });
  }, [settings.dashboardLayout, buildLayout, setDashboardLayout, setDashboardPanelEnabled, clearPanelSizeGuard]);

  useEffect(() => {
     if (!api) return;
     const currentOrder = [...settings.dashboardPanels]
         .sort((a, b) => a.order - b.order)
         .map(p => p.id)
         .join(',');

     if (prevOrderRef.current && prevOrderRef.current !== currentOrder) {
         console.log("Settings panel order changed! Rebuilding dock layout...");
         buildLayout(api);
     }
     prevOrderRef.current = currentOrder;
  }, [settings.dashboardPanels, api, buildLayout]);

    useEffect(() => {
        if (!api) return;

        const hadSavedLayout = Boolean(prevLayoutRef.current);
        const hasSavedLayout = Boolean(settings.dashboardLayout);

        // A transition from saved layout -> no layout means user requested a reset.
        if (hadSavedLayout && !hasSavedLayout) {
            buildLayout(api);
        }

        prevLayoutRef.current = settings.dashboardLayout;
    }, [settings.dashboardLayout, api, buildLayout]);

  useEffect(() => {
    if (!api) return;

    const syncPanel = (panelDef: DashboardPanel) => {
        const { id, enabled, label, defaultWidth, defaultHeight, minWidth, minHeight } = panelDef;
        const panel = api.getPanel(id);
        const nextMinW = minWidth ?? DEFAULT_PANEL_MIN_WIDTH;
        const nextMinH = minHeight ?? DEFAULT_PANEL_MIN_HEIGHT;

        if (enabled && panel) {
          enforcePanelConstraints(panel, nextMinW, nextMinH);
          attachPanelSizeGuard(panel, id, nextMinW, nextMinH);
        }

        if (enabled && !panel) {
            const activePanels = [...settings.dashboardPanels]
              .filter(p => p.enabled)
              .sort((a, b) => a.order - b.order);
            const index = activePanels.findIndex(p => p.id === id);
            const dir = (index > 0 && index % 2 === 1) ? 'right' : 'below';

            const addedPanel = api.addPanel({
                id: id,
                component: id,
                title: label,
                renderer: 'always',
                minimumHeight: nextMinH,
                minimumWidth: nextMinW,
                initialWidth: defaultWidth,
                initialHeight: defaultHeight,
                position: { 
                    direction: dir
                }
            });

            enforcePanelConstraints(addedPanel, nextMinW, nextMinH);
            attachPanelSizeGuard(addedPanel, id, nextMinW, nextMinH);
        } else if (!enabled && panel) {
            clearPanelSizeGuard(id);
            try {
                if ('close' in panel && typeof (panel as any).close === 'function') {
                    (panel as any).close();
                } else {
                    api.removePanel(panel);
                }
            } catch (e) {
                console.error(`Failed to close panel ${id}`, e);
            }
        }
    };

    settings.dashboardPanels.forEach((panelDef) => {
            syncPanel(panelDef);
    });

        return () => {
            clearAllPanelSizeGuards();
        };

    }, [settings.dashboardPanels, api, enforcePanelConstraints, attachPanelSizeGuard, clearPanelSizeGuard, clearAllPanelSizeGuards]);

  return (
    <DockLayoutContext.Provider value={props}>
            <div
                className="h-full w-full relative dock-layout-container"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                }}
            >
                <div
                    style={{
                        minWidth: minDashboardWidth > 0 ? `${minDashboardWidth}px` : '100%',
                        minHeight: '100%',
                        display: 'flex',
                        flex: 1,
                    }}
                >
                    <DockviewReact
                        components={components}
                        onReady={onReady}
                        className={theme === 'light' ? "dockview-theme-light flex-1" : "dockview-theme-dark flex-1"}
                    />
                </div>
            </div>
    </DockLayoutContext.Provider>
  );
}
