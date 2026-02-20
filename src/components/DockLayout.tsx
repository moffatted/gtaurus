import { ReactNode, useState, useMemo, createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview';
import 'dockview/dist/styles/dockview.css';
import { BedVisualizer } from './BedVisualizer';
import { useSettingsStore } from '../stores/settingsStore';
import "./DockLayout.css"; 

interface DockLayoutProps {
  consolePanel: ReactNode;
  droPanel: ReactNode;
  managerPanel: ReactNode;
  jogPanel: ReactNode;
}

// Context to provide panel content to wrapper components
const DockLayoutContext = createContext<DockLayoutProps | null>(null);

// Wrapper Components (Stable References) with Safety Checks
const ConsolePanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) {
        console.error("DockLayoutContext is missing in ConsolePanel!");
        return <div className="text-red-500 p-4">Error: Context Missing</div>;
    }
    return <div className="h-full w-full overflow-hidden">{ctx.consolePanel}</div>;
}
const DROPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) {
        console.error("DockLayoutContext is missing in DROPanel!");
        return <div className="text-red-500 p-4">Error: Context Missing</div>;
    }
    return <div className="h-full w-full overflow-hidden">{ctx.droPanel}</div>;
}
const ManagerPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) {
        console.error("DockLayoutContext is missing in ManagerPanel!");
        return <div className="text-red-500 p-4">Error: Context Missing</div>;
    }
    return <div className="h-full w-full overflow-hidden">{ctx.managerPanel}</div>;
}
const JogPanel = () => {
    const ctx = useContext(DockLayoutContext);
    if (!ctx) {
        console.error("DockLayoutContext is missing in JogPanel!");
        return <div className="text-red-500 p-4">Error: Context Missing</div>;
    }
    return <div className="h-full w-full overflow-hidden">{ctx.jogPanel}</div>;
}

// Placeholder Panel wrapper for unimplemented features
const PlaceholderPanel = ({ title }: { title: string }) => (
    <div className="flex items-center justify-center h-full w-full bg-[var(--bg-primary)] p-4 text-center text-[var(--text-tertiary)] italic">
        {title} (Not implemented yet)
    </div>
);

export function DockLayout(props: DockLayoutProps) {
  const { settings, setDashboardPanelEnabled } = useSettingsStore();
  const [api, setApi] = useState<any>(null);
  const prevOrderRef = useRef<string>('');
  const isRebuildingRef = useRef<boolean>(false);

  const buildLayout = useCallback((apiInstance: any) => {
      console.log("Initializing Layout...");
      isRebuildingRef.current = true;
      try {
          apiInstance.clear();

          // Get ordered and enabled panels from settings
          const activePanels = [...settings.dashboardPanels]
              .filter(p => p.enabled)
              .sort((a, b) => a.order - b.order);

      // Dynamically add panels
      activePanels.forEach((panelData, index) => {
          const panelConfig: any = {
              id: panelData.id,
              component: panelData.id,
              title: panelData.label,
              renderer: 'always',
              minimumHeight: 150,
              minimumWidth: 250
          };

          // Special constraints
          if (panelData.id === 'dro' || panelData.id === 'manager' || panelData.id === 'jog' || panelData.id === 'visualizer') {
              panelConfig.minimumHeight = 400;
              panelConfig.minimumWidth = panelData.id === 'jog' ? 250 : 300;
          }

          if (index === 0) {
             apiInstance.addPanel(panelConfig);
          } else {
             // Alternate direction to tile correctly: 'right', 'below', 'right'...
             // By omitting referencePanel, Dockview uses the active group (the last added panel)
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

  // Stable map of components
  const components = useMemo(() => ({
      console: ConsolePanel,
      dro: DROPanel,
      manager: ManagerPanel,
      jog: JogPanel,
      fileManager: () => <PlaceholderPanel title="File Manager" />,
      statusMonitor: () => <PlaceholderPanel title="Status Monitor" />,
      macros: () => <PlaceholderPanel title="Macros" />,
      toolchanger: () => <PlaceholderPanel title="Tool Changer" />,
      visualizer: BedVisualizer,
      default: (_props: IDockviewPanelProps) => <div className="p-4">Unknown Panel</div>
  }), []);

  const onReady = (event: DockviewReadyEvent) => {
      console.log("Dockview Ready Event Fired");
      const apiInstance = event.api;
      setApi(apiInstance);

      // Restore layout or Default (Bumped to v5 to force reset)
      const saved = localStorage.getItem('dockview-layout-v5');
      let loaded = false;
      if (saved) {
          try {
              console.log("Loading saved layout...");
              apiInstance.fromJSON(JSON.parse(saved));
              loaded = true;
          } catch(e) {
              console.error("Failed to load dockview layout", e);
          }
      }

      if (!loaded) {
          buildLayout(apiInstance);
      }
      
      // Save on change
      apiInstance.onDidLayoutChange(() => {
          if (isRebuildingRef.current) return;
          localStorage.setItem('dockview-layout-v5', JSON.stringify(apiInstance.toJSON()));
      });

      // Sync close events to store
      apiInstance.onDidRemovePanel((event: any) => {
           if (isRebuildingRef.current) return;
           setDashboardPanelEnabled(event.id, false);
      });
  };

  // Rebuild Layout on Explicit Order Change
  useEffect(() => {
     if (!api) return;
     // Track the full order independent of 'enabled' to isolate move up/down actions
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

  // Two-way Sync: Store -> Dockview
  useEffect(() => {
    if (!api) return;

    const syncPanel = (id: string, visible: boolean, title: string, minHeight?: number, minWidth?: number) => {
        const panel = api.getPanel(id);
        if (visible && !panel) {
            console.log(`Restoring panel: ${id}`);
            
            // Determine expected index for tiling direction
            const activePanels = [...settings.dashboardPanels]
              .filter(p => p.enabled)
              .sort((a, b) => a.order - b.order);
            const index = activePanels.findIndex(p => p.id === id);
            const dir = (index > 0 && index % 2 === 1) ? 'right' : 'below';

            // Re-open
            api.addPanel({
                id: id,
                component: id,
                title: title,
                renderer: 'always',
                minimumHeight: minHeight,
                minimumWidth: minWidth,
                position: { direction: dir }
            });
        } else if (!visible && panel) {
            console.log(`Closing panel: ${id}`, panel);
            // panel.close() seems to be missing in this version?
            // Try api.removePanel(panel) or panel.api.close()
            try {
                if ('close' in panel && typeof (panel as any).close === 'function') {
                    (panel as any).close();
                } else {
                    // Fallback to API removal
                    api.removePanel(panel);
                }
            } catch (e) {
                console.error(`Failed to close panel ${id}`, e);
            }
        }
    };

    settings.dashboardPanels.forEach((panelDef) => {
       const minHeight = (panelDef.id === 'dro' || panelDef.id === 'manager' || panelDef.id === 'jog' || panelDef.id === 'visualizer') ? 400 : 150;
       const minWidth  = panelDef.id === 'jog' ? 250 : (panelDef.id === 'dro' || panelDef.id === 'manager' || panelDef.id === 'visualizer' ? 300 : undefined);
       syncPanel(panelDef.id, panelDef.enabled, panelDef.label, minHeight, minWidth);
    });

  }, [settings.dashboardPanels, api]);

  return (
    <DockLayoutContext.Provider value={props}>
        <div className="h-full w-full relative dock-layout-container text-white" style={{ display: 'flex', flexDirection: 'column', minHeight: '800px', height: '100%', width: '100%' }}> 
            {/* Added fixed style to debug layout collapse */}
            <DockviewReact
                components={components}
                onReady={onReady}
                className="dockview-theme-dark"
            />
        </div>
    </DockLayoutContext.Provider>
  );
}
