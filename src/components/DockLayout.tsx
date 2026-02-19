import { ReactNode, useState, useMemo, createContext, useContext, useEffect } from 'react';
import { DockviewReact, DockviewReadyEvent, IDockviewPanelProps } from 'dockview';
import 'dockview/dist/styles/dockview.css';
import { useLayoutStore } from '../stores/layoutStore';
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

export function DockLayout(props: DockLayoutProps) {
  const { panels, setPanelVisibility } = useLayoutStore();
  const [api, setApi] = useState<any>(null);

  // Stable map of components
  const components = useMemo(() => ({
      console: ConsolePanel,
      dro: DROPanel,
      manager: ManagerPanel,
      jog: JogPanel,
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
          console.log("Initializing Default Layout v5...");
          apiInstance.clear();

          // Strategy: Use Object References for robust positioning.
          
           apiInstance.clear(); // Reset 

           // 1. First Panel: DRO (Start)
           const pDro = apiInstance.addPanel({
               id: 'dro',
               component: 'dro',
               title: 'DRO',
               renderer: 'always',
               minimumHeight: 400,
               minimumWidth: 300
           });

           // 2. Console (Bottom) - Splits DRO vertically
           // Result: [ DRO ]
           //         [ Console ]
           apiInstance.addPanel({
               id: 'console',
               component: 'console',
               title: 'Console',
               renderer: 'always',
               minimumHeight: 150,
               position: { referencePanel: pDro, direction: 'below' }
           });

           // 3. Jog (Right of DRO) - Splits DRO horizontally
           // Result: [ DRO | Jog ]
           //         [  Console  ]
           const pJog = apiInstance.addPanel({
               id: 'jog',
               component: 'jog',
               title: 'Jog Control',
               renderer: 'always',
               minimumHeight: 400,
               minimumWidth: 250,
               position: { referencePanel: pDro, direction: 'right' } 
           });

           // 4. Manager (Right of Jog) - Splits Jog horizontally
           // Result: [ DRO | Jog | Manager ]
           //         [      Console         ]
           apiInstance.addPanel({
               id: 'manager',
               component: 'manager',
               title: 'FluidNC',
               renderer: 'always',
               minimumHeight: 400,
               minimumWidth: 300,
               position: { referencePanel: pJog, direction: 'right' }
           });
      }
      
      // Save on change
      apiInstance.onDidLayoutChange(() => {
          localStorage.setItem('dockview-layout-v5', JSON.stringify(apiInstance.toJSON()));
      });

      // Sync close events to store
      apiInstance.onDidRemovePanel((event: any) => {
           if (event.id === 'console') setPanelVisibility('console', false);
           if (event.id === 'dro') setPanelVisibility('dro', false);
           if (event.id === 'manager') setPanelVisibility('manager', false);
           if (event.id === 'jog') setPanelVisibility('jog', false);
      });
  };

  // Two-way Sync: Store -> Dockview
  useEffect(() => {
    if (!api) return;

    const syncPanel = (id: string, visible: boolean, title: string, minHeight?: number, minWidth?: number) => {
        const panel = api.getPanel(id);
        if (visible && !panel) {
            console.log(`Restoring panel: ${id}`);
            // Re-open
            api.addPanel({
                id: id,
                component: id,
                title: title,
                renderer: 'always',
                minimumHeight: minHeight,
                minimumWidth: minWidth // Apply width constraint
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

    syncPanel('console', panels.console, "Console", 150);
    syncPanel('dro', panels.dro, "DRO", 400, 300);
    syncPanel('manager', panels.manager, "FluidNC", 400, 300);
    syncPanel('jog', panels.jog, "Jog Control", 400, 250);

  }, [panels, api]);

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
