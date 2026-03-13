/**
 * @file App.tsx
 * @purpose Main application component that initializes the theme, settings, and layout providers.
 */
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauriApp } from "./utils/platform";
import { Sidebar } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { GcodeConsole } from "./components/GcodeConsole";
import { ControlsPanel } from "./components/ControlsPanel";
import { useUIStore } from "./stores/uiStore";
import { useThemeStore } from "./stores/themeStore";
import { useSettingsStore } from "./stores/settingsStore";
import { HelpMenu } from "./components/Help/HelpMenu";
import { HelpModal } from "./components/Help/HelpModal";
import { EStopButton } from "./components/EStopButton";
import { DockLayout } from "./components/DockLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import FileManager from "./components/FileManager";
import { MachineStatsModal } from './components/MachineStatsModal';
import { ProbePanel } from "./components/ProbePanel";
import { useStatsTracker } from "./hooks/useStatsTracker";
import { AlarmIndicator } from "./components/AlarmIndicator";
import { WorkpiecePanel } from "./components/WorkpiecePanel";
import { useToolStore } from "./stores/toolStore";
import { transport } from "./services/transportService";
import { Play, BarChart2, Bot, SlidersHorizontal, Drill, Wrench, Camera, Layers } from "lucide-react";
import { CarveWizard } from "./components/wizards/CarveWizard";
import { SurfacingWizard } from "./components/wizards/SurfacingWizard";
import { useWizardStore } from "./stores/wizardStore";
import { Tooltip } from "./components/ui/Tooltip";
import { useMachineStatusStore } from "./stores/machineStatusStore";
import { AIAssistantModal } from "./components/AIAssistantModal";
import { FluidNCManagerModal } from "./components/FluidNCManagerModal";
import { useGcodeStore } from "./stores/gcodeStore";
import { ToolChangerModal } from "./components/ToolChangerModal";
import { ToolLibraryModal } from "./components/ToolLibraryModal";
import { CameraViewerModal } from "./components/CameraViewerModal";
import { GCodeVisualizerPopup } from "./components/GCodeVisualizer/GCodeVisualizerPopup";

const queryClient = new QueryClient();

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);
  const initSettings = useSettingsStore((state) => state.initSettings);
  const initTools = useToolStore((state) => state.initTools);
  const initialized = useSettingsStore((state) => state.initialized);
  // Prevents native OS drag/drop from intercepting webview events (Dockview fix)
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', handleDragOver);
    return () => window.removeEventListener('dragover', handleDragOver);
  }, []);

  const { machine } = useMachineStatusStore();

  const openCarveWizard = useWizardStore((state) => state.openCarveWizard);
  const openSurfacingWizard = useWizardStore((state) => state.openSurfacingWizard);

  // UI Visibility Toggles
  const cameraEnabled = useSettingsStore((state) => state.settings.camera.enabled);
  const aiEnabled = useSettingsStore((state) => state.settings.ai.enabled);
  const statsEnabled = useSettingsStore((state) => state.settings.stats.enabled);
  const toolLibraryEnabled = useSettingsStore((state) => state.settings.toolLibrary.enabled);
  const atcEnabled = useSettingsStore((state) => state.settings.atc.enabled);
  const fluidncManagerEnabled = useSettingsStore((state) => state.settings.fluidncManager.enabled && !state.settings.general.legacyGrblMode);

  // UI Scale Binding and Shortcuts
  const uiScale = useSettingsStore((state) => state.settings.general.uiScale);
  const setGeneralSettings = useSettingsStore((state) => state.setGeneralSettings);

  useEffect(() => {
    // Apply the scale to the root html element
    document.documentElement.style.fontSize = `${16 * uiScale}px`;
    
    // Add keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if Ctrl or Cmd is pressed
      if (!e.ctrlKey && !e.metaKey) return;
      
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setGeneralSettings({ uiScale: Math.min(2.0, uiScale + 0.1) });
      } else if (e.key === '-') {
        e.preventDefault();
        setGeneralSettings({ uiScale: Math.max(0.5, uiScale - 0.1) });
      } else if (e.key === '0') {
        e.preventDefault();
        setGeneralSettings({ uiScale: 1.0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uiScale, setGeneralSettings]);

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

  // Automatic Tool Changer Trigger
  useEffect(() => {
    let unlisten: any | null = null;
    const { openToolChanger } = useUIStore.getState();

    transport.listen<string>('fluidnc://rx', (event: any) => {
      const line = event.payload;
      if (!line) return;

      // Detect Tool Change Message specifically
      if (line.includes('MSG:Tool change')) {
        const tMatch = line.match(/T(\d+)/i);
        if (tMatch) {
          useGcodeStore.getState().setFileToolNumber(parseInt(tMatch[1]));
        }
      }

      const isToolChangeTrigger = line.includes('MSG:Tool change') || line.includes('Hold:1');
      if (isToolChangeTrigger) {
        // Only open if not already open to prevent flickering/redundance
        if (!useUIStore.getState().toolChangerOpen) {
          openToolChanger();
        }
      }
    }).then(fn => { unlisten = fn; });

    return () => { if (unlisten) unlisten(); };
  }, []);

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
              className="flex-1 h-full flex items-center gap-4 pl-2"
            >
              <Tooltip content="Launch the Carve Wizard (Step-by-step Setup)" position="bottom">
                <div className="relative group flex items-center cursor-pointer shadow-lg shadow-blue-500/10 rounded-xl" onClick={openCarveWizard}>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200" />
                  <div className="relative flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden group-active:scale-95 transition-transform">
                     <div className="w-12 h-10 shrink-0 border-r border-[var(--border-color)] bg-blue-900 overflow-hidden relative">
                       <div className="absolute inset-0 bg-blue-500/30 mix-blend-overlay z-10" />
                       <img
                         src="/carve_hero.png"
                         alt=""
                         className="absolute inset-0 w-full h-full object-cover object-center scale-[1.7] group-hover:scale-[1.5] opacity-80 transition-transform duration-700 blur-[0.5px]"
                       />
                     </div>
                     <button
                       className="flex items-center gap-2 px-4 h-10 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors btn-3d"
                       tabIndex={-1}
                     >
                       <Play className="w-4 h-4 fill-current" />
                       Carve
                     </button>
                  </div>
                </div>
              </Tooltip>

              <Tooltip content="Surface Workpiece (Fly-cut / Spoilboard)" position="bottom">
                <div className="relative group flex items-center cursor-pointer shadow-lg shadow-amber-500/10 rounded-xl" onClick={openSurfacingWizard}>
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-200" />
                  <div className="relative flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] overflow-hidden group-active:scale-95 transition-transform">
                    <div className="w-12 h-10 shrink-0 border-r border-[var(--border-color)] bg-amber-900 overflow-hidden relative flex items-center justify-center">
                      <div className="absolute inset-0 bg-amber-500/20 mix-blend-overlay z-10" />
                      <Layers className="w-6 h-6 text-amber-300 relative z-20" />
                    </div>
                    <button
                      className="flex items-center gap-2 px-4 h-10 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors btn-3d"
                      tabIndex={-1}
                    >
                      <Layers className="w-4 h-4" />
                      Surface
                    </button>
                  </div>
                </div>
              </Tooltip>
            </div>

            <CarveWizard />
            <SurfacingWizard />


            <div className="flex items-center gap-3">
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                machine.status === 'Run' ? 'bg-green-500/10 border-green-500/30 text-green-500 animate-pulse' :
                machine.status === 'Alarm' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                machine.status === 'Idle' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-tertiary)]'
              }`}>
                {machine.status || 'Offline'}
              </div>
              <AlarmIndicator />
              <EStopButton />
              <div className="w-px h-6 bg-[var(--border-color)]" />
              {cameraEnabled && (
                <Tooltip content="Camera Viewer" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openCameraViewer()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="Camera Viewer"
                  >
                    <Camera className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-green-400 transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">Camera</span>
                  </button>
                </Tooltip>
              )}
              {aiEnabled && (
                <Tooltip content="AI Assistant" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openAIAssistant()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="AI Assistant"
                  >
                    <Bot className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">AI Assistant</span>
                  </button>
                </Tooltip>
              )}
              {statsEnabled && (
                <Tooltip content="Machine Statistics" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openMachineStats()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="Machine Statistics"
                  >
                    <BarChart2 className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-orange-400 transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">Stats</span>
                  </button>
                </Tooltip>
              )}
              {toolLibraryEnabled && (
                <Tooltip content="Bit Library" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openToolLibrary()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="Bit Library"
                  >
                    <Wrench className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-purple-400 transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">Library</span>
                  </button>
                </Tooltip>
              )}
              {atcEnabled && (
                <Tooltip content="Tool Changer" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openToolChanger()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="Tool Changer"
                  >
                    <Drill className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-blue-400 transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">Tools</span>
                  </button>
                </Tooltip>
              )}
              {fluidncManagerEnabled && (
                <Tooltip content="FluidNC Manager" position="bottom">
                  <button
                    onClick={() => useUIStore.getState().openFluidNCManager()}
                    className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer flex items-center gap-2 group"
                    aria-label="FluidNC Manager"
                  >
                    <SlidersHorizontal className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors" />
                    <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] hidden xl:inline">Manager</span>
                  </button>
                </Tooltip>
              )}
              <HelpMenu />
              <SettingsPanel />
            </div>
          </header>

          {/* Content Area - Resizable Dashboard (Docking) */}
          <div className="flex-1 min-h-0 relative bg-[var(--bg-primary)] overflow-hidden">
            <ErrorBoundary>
              <DockLayout
                consolePanel={<GcodeConsole />}
                controlsPanel={<ControlsPanel />}
                fileManagerPanel={<FileManager />}
                probePanel={<ProbePanel />}
                workpiecePanel={<WorkpiecePanel />}
              />
            </ErrorBoundary>
          </div>
        </main>

        {/* Global Modals */}
        <HelpModal />
        <AIAssistantModal />
        <FluidNCManagerModal />
        <MachineStatsModal />
        <ToolChangerModal />
        <ToolLibraryModal />
        <CameraViewerModal />
        <GCodeVisualizerPopup />
      </div>
    </QueryClientProvider>
  );
}
export default App;
