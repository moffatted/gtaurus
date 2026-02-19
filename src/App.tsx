import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { GcodeConsole } from "./components/GcodeConsole";
import { DRO } from "./components/DRO";
import { FluidNCManager } from "./components/FluidNCManager";
import { JogPanel } from "./components/JogPanel";
import { useThemeStore } from "./stores/themeStore";
import { useSettingsStore } from "./stores/settingsStore";
import { useLayoutStore } from "./stores/layoutStore";
import { DockLayout } from "./components/DockLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Terminal, Activity, Settings2, Move } from "lucide-react";

import { HelpMenu } from "./components/Help/HelpMenu";
import { HelpModal } from "./components/Help/HelpModal";
import { EStopButton } from "./components/EStopButton";
import { Tooltip } from "./components/ui/Tooltip";

const queryClient = new QueryClient();

function App() {
  const initTheme    = useThemeStore((state) => state.initTheme);
  const initSettings = useSettingsStore((state) => state.initSettings);
  const { panels, togglePanel } = useLayoutStore();

  useEffect(() => {
    initTheme();
    initSettings();
  }, [initTheme, initSettings]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
        <Sidebar className="flex-shrink-0" />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header */}
          <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center px-6 justify-between shadow-sm flex-shrink-0 z-20">
            {/* View Toggles */}
            <div className="flex items-center gap-2 h-full py-2">
               <Tooltip content="Toggle Console View" position="bottom" className="h-full">
                 <button
                   onClick={() => togglePanel('console')}
                   className={`h-full px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border ${
                     panels.console
                       ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] shadow-sm' 
                       : 'bg-transparent text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
                   }`}
                 >
                   <Terminal className="w-4 h-4" />
                   Console
                 </button>
               </Tooltip>
               
               <Tooltip content="Toggle DRO View" position="bottom" className="h-full">
                 <button
                   onClick={() => togglePanel('dro')}
                   className={`h-full px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border ${
                     panels.dro 
                       ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] shadow-sm' 
                       : 'bg-transparent text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
                   }`}
                 >
                   <Activity className="w-4 h-4" />
                   DRO
                 </button>
               </Tooltip>

               <Tooltip content="Toggle Jog Controls" position="bottom" className="h-full">
                 <button
                   onClick={() => togglePanel('jog')}
                   className={`h-full px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border ${
                     panels.jog 
                       ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] shadow-sm' 
                       : 'bg-transparent text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
                   }`}
                 >
                   <Move className="w-4 h-4" />
                   Jog
                 </button>
               </Tooltip>

               <Tooltip content="Toggle FluidNC Manager" position="bottom" className="h-full">
                 <button
                   onClick={() => togglePanel('manager')}
                   className={`h-full px-4 flex items-center gap-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer border ${
                     panels.manager 
                       ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] border-[var(--border-color)] shadow-sm' 
                       : 'bg-transparent text-[var(--text-tertiary)] border-transparent hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/50'
                   }`}
                 >
                   <Settings2 className="w-4 h-4" />
                   FluidNC
                 </button>
               </Tooltip>
            </div>

            <div className="flex items-center gap-3">
                <EStopButton />
                <div className="w-px h-6 bg-[var(--border-color)]" />
                <HelpMenu />
                <SettingsPanel />
            </div>
          </header>

          {/* Content Area - Resizable Dashboard (Docking) */}
          <div className="flex-1 overflow-y-auto min-h-0 relative bg-[var(--bg-primary)]">
            <ErrorBoundary>
              <DockLayout 
                 consolePanel={<GcodeConsole />}
                 droPanel={<DRO />}
                 jogPanel={<JogPanel />}
                 managerPanel={<FluidNCManager />}
              />
            </ErrorBoundary>
          </div>
        </main>
        
        {/* Global Modals */}
        <HelpModal />
      </div>
    </QueryClientProvider>
  );
}
export default App;
