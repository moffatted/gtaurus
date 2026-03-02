/**
 * @file DockLayout.tsx
 * @purpose Implements the flexible docking system for UI panels using Dockview.
 */
import { ReactNode, useState, useMemo, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview';
import 'dockview-core/dist/styles/dockview.css';
import { BedVisualizer } from './BedVisualizer';
import { useSettingsStore } from '../stores/settingsStore';
import { AutoLevelPanel } from './AutoLevelPanel';
import { MacrosPanel } from './MacrosPanel';
import { useThemeStore } from '../stores/themeStore';
import "./DockLayout.css"; 

interface DockLayoutProps {
  consolePanel: ReactNode;
  controlsPanel: ReactNode;
  managerPanel: ReactNode;
  fileManagerPanel: ReactNode;
  statsPanel: ReactNode;
  probePanel: ReactNode;
  workpiecePanel: ReactNode;
  toolsPanel: ReactNode;
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
const ManagerPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.managerPanel}</div>;
}
const FileManagerPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full">{ctx.fileManagerPanel}</div>;
}
const StatsPanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.statsPanel}</div>;
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
const ToolsPanelWrapper = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) return <div className="text-red-500 p-4">Error: Context Missing</div>;
    return <div className="h-full w-full overflow-hidden">{ctx.toolsPanel}</div>;
}

const PlaceholderPanel = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-full w-full bg-[var(--bg-primary)] p-4 text-center text-[var(--text-tertiary)] italic">
        {title} (Not implemented yet)
    </div>
);

export function DockLayout(props: DockLayoutProps) {
  const { settings, setDashboardPanelEnabled, setDashboardLayout } = useSettingsStore();
  const { theme } = useThemeStore();
  const [api, setApi] = useState<any>(null);
  const prevOrderRef = useRef<string>('');
  const isRebuildingRef = useRef<boolean>(false);

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
                  minimumHeight: 100,
                  minimumWidth: 100,
                  initialWidth: panelData.defaultWidth,
                  initialHeight: panelData.defaultHeight
              };

              if (panelData.id === 'controls') {
                  panelConfig.minimumWidth = 380;
                  panelConfig.minimumHeight = 450;
              }

              if (index === 0) {
                 apiInstance.addPanel(panelConfig);
              } else {
                 panelConfig.position = { 
                     direction: index % 2 === 1 ? 'right' : 'below',
                     size: index % 2 === 1 ? panelData.defaultWidth : panelData.defaultHeight
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
      manager: ManagerPanel,
      fileManager: FileManagerPanel,
      stats: StatsPanelWrapper,
      probe: ProbePanelWrapper,
      workpiece: WorkpiecePanelWrapper,
      tools: ToolsPanelWrapper,
      macros: MacrosPanel,
      toolchanger: () => <PlaceholderPanel title="Tool Changer" />,
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

    const syncPanel = (id: string, visible: boolean, title: string, defaultWidth?: number, defaultHeight?: number) => {
        const panel = api.getPanel(id);
        if (visible && !panel) {
            const activePanels = [...settings.dashboardPanels]
              .filter(p => p.enabled)
              .sort((a, b) => a.order - b.order);
            const index = activePanels.findIndex(p => p.id === id);
            const dir = (index > 0 && index % 2 === 1) ? 'right' : 'below';

            const minH = id === 'controls' ? 450 : 100;
            const minW = id === 'controls' ? 380 : 100;

            const size = dir === 'right' ? defaultWidth : defaultHeight;

            api.addPanel({
                id: id,
                component: id,
                title: title,
                renderer: 'always',
                minimumHeight: minH,
                minimumWidth: minW,
                initialWidth: defaultWidth,
                initialHeight: defaultHeight,
                position: { 
                    direction: dir,
                    size: size
                }
            });
        } else if (!visible && panel) {
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
       syncPanel(panelDef.id, panelDef.enabled, panelDef.label, panelDef.defaultWidth, panelDef.defaultHeight);
    });

  }, [settings.dashboardPanels, api]);

  return (
    <DockLayoutContext.Provider value={props}>
        <div className="h-full w-full relative dock-layout-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}> 
            <DockviewReact
                components={components}
                onReady={onReady}
                className={theme === 'dark' ? "dockview-theme-dark flex-1" : "dockview-theme-light flex-1"}
            />
        </div>
    </DockLayoutContext.Provider>
  );
}
