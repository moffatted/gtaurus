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
          <header className="h-14 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex items-center px-4 justify-between">
            <h2 className="font-semibold text-[var(--text-primary)]">Dashboard</h2>
            <SettingsPanel />
          </header>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto bg-[var(--bg-primary)]">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center text-[var(--text-secondary)]">
                <p className="text-xl mb-2">Welcome to Gtaurus</p>
                <p className="text-sm">Select a serial port from the sidebar to begin.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;
