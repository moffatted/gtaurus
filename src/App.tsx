import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriApp } from "./utils/platform";
import { Sidebar } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { GcodeConsole } from "./components/GcodeConsole";
import { ControlsPanel } from "./components/ControlsPanel";
import { FluidNCManager } from "./components/FluidNCManager";
import { useThemeStore } from "./stores/themeStore";
import { useSettingsStore } from "./stores/settingsStore";
import { HelpMenu } from "./components/Help/HelpMenu";
import { HelpModal } from "./components/Help/HelpModal";
import { EStopButton } from "./components/EStopButton";
import { DockLayout } from "./components/DockLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FileManager from "./components/FileManager";
import { StatsPanel } from "./components/StatsPanel";
import { ProbePanel } from "./components/ProbePanel";
import { AIPanel } from "./components/AIPanel";
import { useStatsTracker } from "./hooks/useStatsTracker";
import { AlarmIndicator } from "./components/AlarmIndicator";
import { WorkpiecePanel } from "./components/WorkpiecePanel";
import { useToolStore } from "./stores/toolStore";
import { ToolLibraryPanel } from "./components/ToolLibraryPanel";
import { transport } from "./services/transportService";

const queryClient = new QueryClient();

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initSettings = useSettingsStore((state) => state.initSettings);
  const initTools = useToolStore((state) => state.initTools);
  const initialized = useSettingsStore((state) => state.initialized);

  useEffect(() => {
    initTheme();
    void initTools();
    initSettings().then(() => {
      // Small delay to ensure serial is ready if it's auto-connecting
      setTimeout(() => {
        transport.invoke("send_gcode", { cmd: "$I" }).catch(() => {});
      }, 1000);
    });
  }, [initTheme, initSettings, initTools]);

  useStatsTracker();

  const appWindow = isTauriApp() ? getCurrentWindow() : null;

  const handleResizeStart = (_e: React.MouseEvent, direction: string) => {
    if (appWindow) {
      void (appWindow as any).startResize(direction as any);
    }
  };

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0a0a] text-white">
        <div className="text-lg font-medium opacity-50 animate-pulse">
          Initializing Gtaurus...
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden border border-[var(--border-color)]">
        {/* Tauri Resize Sashes (Invisible but act as large hitboxes for resizing) */}
        {isTauriApp() && (
          <>
            <div className="absolute top-0 left-0 right-0 h-2 z-[100] cursor-ns-resize bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'Top')} />
            <div className="absolute bottom-0 left-0 right-0 h-2 z-[100] cursor-ns-resize bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'Bottom')} />
            <div className="absolute top-0 left-0 bottom-0 w-2 z-[100] cursor-ew-resize bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'Left')} />
            <div className="absolute top-0 right-0 bottom-0 w-2 z-[100] cursor-ew-resize bg-transparent hover:bg-[var(--accent-primary)]/10 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'Right')} />
            
            {/* Corners */}
            <div className="absolute top-0 left-0 w-4 h-4 z-[110] cursor-nwse-resize bg-transparent hover:bg-[var(--accent-primary)]/20 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'TopLeft')} />
            <div className="absolute top-0 right-0 w-4 h-4 z-[110] cursor-nesw-resize bg-transparent hover:bg-[var(--accent-primary)]/20 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'TopRight')} />
            <div className="absolute bottom-0 left-0 w-4 h-4 z-[110] cursor-nesw-resize bg-transparent hover:bg-[var(--accent-primary)]/20 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'BottomLeft')} />
            <div className="absolute bottom-0 right-0 w-4 h-4 z-[110] cursor-nwse-resize bg-transparent hover:bg-[var(--accent-primary)]/20 transition-colors" onMouseDown={(e) => handleResizeStart(e, 'BottomRight')} />
          </>
        )}

        <Sidebar className="flex-shrink-0" />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header - Made taller (h-16) and draggable with data-tauri-drag-region */}
          <header
            data-tauri-drag-region
            className="h-16 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center px-6 justify-between shadow-sm flex-shrink-0 z-20 cursor-default select-none group"
          >
            {/* Draggable indicator or Spacer */}
            <div
              data-tauri-drag-region
              className="flex-1 h-full flex items-center"
            >
              {/* Visual handle indicator only visible on hover? Optional */}
            </div>

            <div className="flex items-center gap-3">
              <AlarmIndicator />
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
                controlsPanel={<ControlsPanel />}
                managerPanel={<FluidNCManager />}
                fileManagerPanel={<FileManager />}
                statsPanel={<StatsPanel />}
                probePanel={<ProbePanel />}
                aiPanel={<AIPanel />}
                workpiecePanel={<WorkpiecePanel />}
                toolsPanel={<ToolLibraryPanel />}
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
