import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { SettingsPanel } from "./components/SettingsPanel";
import { useThemeStore } from "./stores/themeStore";

const queryClient = new QueryClient();

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans overflow-hidden">
        <Sidebar className="flex-shrink-0" />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header Area */}
          <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center px-6 justify-between shadow-sm">
            <h2 className="font-semibold text-lg text-[var(--text-primary)]">Dashboard</h2>
            <SettingsPanel />
          </header>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-auto bg-[var(--bg-primary)]">
            <div className="max-w-5xl mx-auto">
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-12 text-center shadow-sm hover:shadow-md transition-shadow duration-200">
                <div className="max-w-md mx-auto space-y-3">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome to Gtaurus</h1>
                  <p className="text-base text-[var(--text-secondary)]">
                    Professional CNC controller for MKS DLC32 v2.1 boards running FluidNC
                  </p>
                  <p className="text-sm text-[var(--text-tertiary)] pt-2">
                    Select a serial port from the sidebar to begin
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
