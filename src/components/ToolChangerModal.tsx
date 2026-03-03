import { useUIStore } from '../stores/uiStore';
import { useToolStore } from '../stores/toolStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useConsoleStore } from '../stores/consoleStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { useSettingsStore } from '../stores/settingsStore';
import { FloatingWindow } from './ui/FloatingWindow';
import { transport } from '../services/transportService';
import { Drill, Play, AlertCircle, CheckCircle2, MapPin } from 'lucide-react';

export function ToolChangerModal() {
  const { toolChangerOpen, closeToolChanger } = useUIStore();
  const { tools, activeToolId } = useToolStore();
  const { fileToolNumber } = useGcodeStore();
  const { machine } = useMachineStatusStore();
  const { settings } = useSettingsStore();
  const atc = settings.atc;

  const activeTool = tools.find(t => t.id === activeToolId);
  const targetTool = tools.find(t => t.number === fileToolNumber);

  return (
    <FloatingWindow
      title="Tool Changer"
      icon={<Drill className="w-4 h-4" />}
      isOpen={toolChangerOpen}
      onClose={closeToolChanger}
      defaultPosition={{ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 300 }}
      defaultSize={{ width: 400, height: 600 }}
      minWidth={350}
      minHeight={450}
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
             machine.isSpindleActive
               ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse'
               : 'bg-green-500/10 text-green-400 border-green-500/20'
           }`}>
             <div className={`w-1.5 h-1.5 rounded-full ${machine.isSpindleActive ? 'bg-red-500' : 'bg-green-500'}`} />
             {machine.isSpindleActive ? 'SPINDLE ON' : 'SPINDLE STOPPED'}
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

        {/* Workflow Steps */}
        <div className="space-y-2 mb-4 shrink-0">
          <div className={`p-2 rounded-lg border flex items-center gap-3 transition-colors ${!machine.isSpindleActive ? 'bg-green-500/5 border-green-500/20 opacity-60' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${!machine.isSpindleActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white animate-pulse'}`}>
              1
            </div>
            <span className="text-xs font-medium">Wait for spindle to stop fully</span>
            {!machine.isSpindleActive && <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />}
          </div>

          <div className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--accent-primary)] text-white flex items-center justify-center text-[10px] font-bold">
              2
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">Swap to {targetTool?.name || `Tool #${fileToolNumber}`}</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-primary)]/50 px-1.5 py-0.5 rounded border border-[var(--border-color)]/30 w-fit">
                <MapPin className="w-2.5 h-2.5" />
                <span>Station: X{atc.toolChangeMpos.x}, Y{atc.toolChangeMpos.y}, Z{atc.toolChangeMpos.z}</span>
              </div>
            </div>
          </div>

          <div className={`p-2 rounded-lg border flex items-center gap-3 transition-colors ${activeToolId ? 'bg-blue-500/5 border-blue-500/20' : 'border-dashed border-[var(--border-color)]'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${activeToolId ? 'bg-blue-600 text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
              3
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium">Select matching bit from library</span>
              <span className="text-[9px] text-[var(--text-tertiary)]">Ensures Correct Tool Offset (TLO)</span>
            </div>
          </div>

          <div className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/30 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-[var(--text-tertiary)] text-white flex items-center justify-center text-[10px] font-bold opacity-50">
              4
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium opacity-70">Automatic Probing Phase</span>
              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-primary)]/50 px-1.5 py-0.5 rounded border border-[var(--border-color)]/30 w-fit">
                <MapPin className="w-2.5 h-2.5" />
                <span>ETS: X{atc.probeMpos.x}, Y{atc.probeMpos.y} @ Z{atc.probeRapidZ}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tool Library View */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] overflow-hidden shadow-inner mb-4">
          <div className="px-3 py-1.5 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)] flex items-center justify-between text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">
            <span>Library Reference</span>
            <span>{tools.length} bits</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0.5">
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 bg-[var(--bg-primary)] z-10">
                <tr className="text-[10px] text-[var(--text-tertiary)] uppercase">
                  <th className="px-2 py-2 font-bold border-b border-[var(--border-color)] bg-[var(--bg-primary)]">T#</th>
                  <th className="px-2 py-2 font-bold border-b border-[var(--border-color)] bg-[var(--bg-primary)]">Name</th>
                  <th className="px-2 py-2 font-bold border-b border-[var(--border-color)] bg-[var(--bg-primary)] text-right">Dia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30">
                {tools.map((t) => (
                  <tr 
                    key={t.id} 
                    onClick={() => useToolStore.getState().setActiveTool(t.id)}
                    className={`group cursor-pointer transition-colors ${
                      activeToolId === t.id 
                        ? 'bg-[var(--accent-primary)]/15' 
                        : 'hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <td className="px-2 py-2.5 font-mono text-[var(--text-secondary)]">T{t.number}</td>
                    <td className="px-2 py-2.5 font-medium">
                       <div className="flex flex-col">
                          <span className="truncate max-w-[160px]">{t.name}</span>
                          <span className="text-[9px] text-[var(--text-tertiary)]">{t.type}</span>
                       </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono text-[var(--text-tertiary)]">{t.diameter}mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0">
          <button
            onClick={async () => {
              if (machine.isSpindleActive) {
                alert("Safety Check: Spindle is still active! Please wait for it to stop before resuming.");
                return;
              }
              try {
                useConsoleStore.getState().appendLine(`> [~] Resume for Tool Change (T${fileToolNumber})`, 'cmd');
                await transport.invoke('send_realtime', { byte: 126 }); // ~
                closeToolChanger();
              } catch (err) {
                console.error("Failed to resume:", err);
              }
            }}
            className={`w-full px-4 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98] ${
              machine.isSpindleActive 
                ? 'bg-red-500/50 cursor-not-allowed text-white/50' 
                : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white shadow-[var(--accent-primary)]/20'
            }`}
          >
            <Play className={`w-4 h-4 ${!machine.isSpindleActive ? 'fill-current' : ''}`} />
            <span>Confirm & Resume Probe</span>
          </button>
          
          <p className="text-[9px] text-center text-[var(--text-tertiary)] mt-3 italic">
            Note: This will trigger the fluidNC <code>atc_manual</code> sequence (Probe & TLO calculation).
          </p>
        </div>
      </div>
    </FloatingWindow>
  );
}
