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

// Wrapper Components
const ConsolePanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.consolePanel}</div>;
}
const ControlsPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.controlsPanel}</div>;
}
const FileManagerPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.fileManagerPanel}</div>;
}
const ProbePanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.probePanel}</div>;
}
const WorkpiecePanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.workpiecePanel}</div>;
}


export function DockLayout(props: DockLayoutProps) {
  const { settings, setDashboardPanelEnabled, setDashboardLayout } = useSettingsStore();
  const { theme } = useThemeStore();
  const [api, setApi] = useState<any>(null);
  const prevOrderRef = useRef<string>('');
    const prevLayoutRef = useRef<string | undefined>(settings.dashboardLayout);
    const controlsWidthGuardDisposeRef = useRef<(() => void) | null>(null);
  const isRebuildingRef = useRef<boolean>(false);

    const clearControlsWidthGuard = useCallback(() => {
        if (controlsWidthGuardDisposeRef.current) {
            controlsWidthGuardDisposeRef.current();
            controlsWidthGuardDisposeRef.current = null;
        }
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

    const attachControlsWidthGuard = useCallback((panel: any, minW: number) => {
        clearControlsWidthGuard();

        if (typeof panel?.onDidDimensionsChange !== 'function' || typeof panel?.setSize !== 'function') {
            return;
        }

        const disposable = panel.onDidDimensionsChange(() => {
            if (typeof panel.width === 'number' && panel.width < minW) {
                panel.setSize({ width: minW });
            }
        });

        controlsWidthGuardDisposeRef.current = () => {
            if (disposable && typeof disposable.dispose === 'function') {
                disposable.dispose();
            }
        };
    }, [clearControlsWidthGuard]);

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
      macros: MacrosPanel,
      visualizer: BedVisualizer,
      autolevel: AutoLevelPanel,
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
           setDashboardPanelEnabled(event.id, false);
      });
  }, [settings.dashboardLayout, buildLayout, setDashboardLayout, setDashboardPanelEnabled]);

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
            if (id === 'controls') {
                attachControlsWidthGuard(panel, nextMinW);
            }
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
            if (id === 'controls') {
                attachControlsWidthGuard(addedPanel, nextMinW);
            }
        } else if (!enabled && panel) {
            if (id === 'controls') {
                clearControlsWidthGuard();
            }
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
            clearControlsWidthGuard();
        };

    }, [settings.dashboardPanels, api, enforcePanelConstraints, attachControlsWidthGuard, clearControlsWidthGuard]);

  return (
    <DockLayoutContext.Provider value={props}>
        <div className="h-full w-full relative dock-layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}> 
            <DockviewReact
                components={components}
                onReady={onReady}
                className={theme === 'light' ? "dockview-theme-light flex-1" : "dockview-theme-dark flex-1"}
            />
        </div>
    </DockLayoutContext.Provider>
  );
}
