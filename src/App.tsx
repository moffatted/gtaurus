import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex h-screen w-screen bg-[#1a1a1a] text-white font-sans overflow-hidden">
        <Sidebar className="flex-shrink-0" />

        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Header Area */}
          <header className="h-14 border-b border-[#333] bg-[#1e1e1e] flex items-center px-4 justify-between">
            <h2 className="font-semibold text-gray-200">Dashboard</h2>
            {/* Future: Toolbar actions */}
          </header>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto bg-[#121212]">
            <div className="max-w-4xl mx-auto">
              <div className="bg-[#1e1e1e] rounded-lg border border-[#333] p-8 text-center text-gray-400">
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
