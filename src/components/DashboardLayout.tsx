/**
 * @file DashboardLayout.tsx
 * @purpose Root layout component for the machine dashboard, managing the responsive grid of control panels.
 */
import { ReactNode } from 'react';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';
// useDefaultLayout is not exported from the main index? d.ts showed it export declare function useDefaultLayout.
// Let's assume it is exported. If not, I'll remove it for now.
import { useLayoutStore } from '../stores/layoutStore';
import { Terminal, Activity, Settings2 } from 'lucide-react';

interface DashboardLayoutProps {
  console: ReactNode;
  controls: ReactNode;
  manager: ReactNode;
}

export function DashboardLayout({ console, controls, manager }: DashboardLayoutProps) {
  const { panels } = useLayoutStore();

  // Determine active panels to calculate default sizes or render logic
  const activePanels = [
    panels.console && { id: 'console', content: console, icon: <Terminal className="w-4 h-4" />, title: 'Console' },
    panels.controls && { id: 'controls', content: controls, icon: <Activity className="w-4 h-4" />, title: 'Controls' },
    panels.manager && { id: 'manager', content: manager, icon: <Settings2 className="w-4 h-4" />, title: 'FluidNC' },
  ].filter(Boolean) as { id: string; content: ReactNode; icon: ReactNode; title: string }[];

  if (activePanels.length === 0) {
      return <div className="flex items-center justify-center h-full text-[var(--text-tertiary)]">No panels visible</div>;
  }

  return (
    <div className="h-full w-full bg-[var(--bg-primary)]">
      <PanelGroup orientation="horizontal" id="dashboard-layout">
        {activePanels.map((panel, index) => (
          <>
            <Panel key={panel.id} defaultSize={100 / activePanels.length} minSize={20} className="flex flex-col min-w-0">
               {/* Panel Header/Title Bar */}
               {activePanels.length > 1 && (
                   <div className="h-8 flex items-center gap-2 px-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 text-xs font-medium text-[var(--text-secondary)] select-none">
                       {panel.icon}
                       {panel.title}
                   </div>
               )}
               
               <div className="flex-1 overflow-hidden relative">
                   {/* Content */}
                   {panel.content}
               </div>
            </Panel>
            
            {/* Add resize handle between panels */}
            {index < activePanels.length - 1 && (
              <PanelResizeHandle className="w-1 bg-[var(--border-color)] hover:bg-[var(--accent-primary)] transition-colors cursor-col-resize z-10" />
            )}
          </>
        ))}
      </PanelGroup>
    </div>
  );
}
