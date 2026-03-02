import { useUIStore } from '../stores/uiStore';
import { useToolStore } from '../stores/toolStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useConsoleStore } from '../stores/consoleStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { FloatingWindow } from './ui/FloatingWindow';
import { transport } from '../services/transportService';
import { Drill, Play, AlertCircle } from 'lucide-react';

export function ToolChangerModal() {
  const { toolChangerOpen, closeToolChanger } = useUIStore();
  const { tools, activeToolId } = useToolStore();
  const { fileToolNumber } = useGcodeStore();

  const activeTool = tools.find(t => t.id === activeToolId);
  const targetTool = tools.find(t => t.number === fileToolNumber);

  return (
    <FloatingWindow
      title="Tool Changer"
      icon={<Drill className="w-4 h-4" />}
      isOpen={toolChangerOpen}
      onClose={closeToolChanger}
      defaultPosition={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 }}
      defaultSize={{ width: 400, height: 300 }}
      minWidth={350}
      minHeight={250}
    >
      <div className="p-4 flex flex-col h-full bg-[var(--bg-secondary)] text-[var(--text-primary)] min-h-0">
        
        {/* Status Banner */}
        <div className="flex items-center justify-between gap-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 shrink-0">
           <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-500 leading-none mb-1">Tool Change Required</h4>
              <p className="text-[10px] text-[var(--text-secondary)]">Please swap bit and run Z-Probe.</p>
            </div>
           </div>
           
           {/* Mini Spindle Status */}
           <div className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1.5 shrink-0 ${
             useMachineStatusStore.getState().machine.isSpindleActive
               ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
               : 'bg-green-500/10 text-green-400 border-green-500/20'
           }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${useMachineStatusStore.getState().machine.isSpindleActive ? 'bg-red-500' : 'bg-green-500'}`} />
             {useMachineStatusStore.getState().machine.isSpindleActive ? 'SPINDLE ON' : 'SPINDLE STOPPED'}
           </div>
        </div>

        {/* Action Pair */}
        <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
          <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl p-3 shadow-sm">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-bold mb-1 opacity-60">Current</div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">T{activeTool?.number || '?'}</span>
              <span className="text-sm font-semibold truncate flex-1" title={activeTool?.name}>
                {activeTool ? activeTool.name : 'Unknown'}
              </span>
            </div>
          </div>
          
          <div className="bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/40 rounded-xl p-3 relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-12 h-12 bg-[var(--accent-primary)]/5 rounded-bl-[100%] pointer-events-none" />
            <div className="text-[10px] text-[var(--accent-primary)] uppercase tracking-wider font-bold mb-1">Requested</div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-bold text-[var(--text-secondary)]">T{fileToolNumber || '?'}</span>
              <span className="text-sm font-semibold truncate flex-1" title={targetTool?.name}>
                {targetTool ? targetTool.name : 'Manual'}
              </span>
            </div>
          </div>
        </div>

        {/* Tool Library View */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-inner mb-4">
          <div className="px-3 py-1.5 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)] flex items-center justify-between text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">
            <span>Library Reference</span>
            <span>{tools.length} bits</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 bg-[var(--bg-primary)] z-10">
                <tr className="text-[10px] text-[var(--text-tertiary)] uppercase">
                  <th className="px-2 py-1.5 font-bold border-b border-[var(--border-color)]">T#</th>
                  <th className="px-2 py-1.5 font-bold border-b border(--border-color)">Name</th>
                  <th className="px-2 py-1.5 font-bold border-b border(--border-color) text-right">Dia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {tools.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => useToolStore.getState().setActiveTool(t.id)}
                    className={`group cursor-pointer transition-colors ${
                      activeToolId === t.id 
                        ? 'bg-[var(--accent-primary)]/10' 
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <td className="px-2 py-2 font-mono text-[var(--text-secondary)]">T{t.number}</td>
                    <td className="px-2 py-2 font-medium truncate max-w-[140px]">{t.name}</td>
                    <td className="px-2 py-2 text-right text-[var(--text-tertiary)]">{t.diameter}mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex-shrink-0">
          <button
            onClick={async () => {
              try {
                useConsoleStore.getState().appendLine(`> [~] Resume for Tool Change`, 'cmd');
                await transport.invoke('send_realtime', { byte: 126 }); // ~
                closeToolChanger();
              } catch (err) {
                console.error("Failed to resume:", err);
              }
            }}
            className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[var(--accent-primary)]/20 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Confirm & Probe Resume</span>
          </button>
        </div>
      </div>
    </FloatingWindow>
  );
}
