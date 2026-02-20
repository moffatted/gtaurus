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
import { HelpMenu } from "./components/Help/HelpMenu";
import { HelpModal } from "./components/Help/HelpModal";
import { EStopButton } from "./components/EStopButton";
import { DockLayout } from "./components/DockLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";

const queryClient = new QueryClient();

function App() {
  const initTheme    = useThemeStore((state) => state.initTheme);
  const initSettings = useSettingsStore((state) => state.initSettings);

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
            {/* View Toggles Removed - Managed in Settings */}
            <div></div>

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
