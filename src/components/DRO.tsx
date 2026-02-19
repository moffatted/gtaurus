import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Activity, Move, Zap } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

interface AxisState {
  mpos: number;
  wco: number;
}

interface MachineState {
  status: string;
  x: AxisState;
  y: AxisState;
  z: AxisState;
  feed: number;
  spindle: number;
}

export function DRO() {
  const [state, setState] = useState<MachineState>({
    status: 'Disconnected',
    x: { mpos: 0, wco: 0 },
    y: { mpos: 0, wco: 0 },
    z: { mpos: 0, wco: 0 },
    feed: 0,
    spindle: 0,
  });

      // Re-write listener to be safe with state
  useEffect(() => {
      const unlisten = listen<string>('fluidnc://rx', (event) => {
          const line = event.payload;
          if (!line.startsWith('<') || !line.endsWith('>')) return;

          const content = line.slice(1, -1);
          const parts = content.split('|');
          
          setState((prev) => {
              const next = { ...prev };
              next.status = parts[0];
              
              parts.slice(1).forEach((part) => {
                  const [key, val] = part.split(':');
                  if (!val) return;

                  if (key === 'MPos') {
                      const [x, y, z] = val.split(',').map(Number);
                      next.x.mpos = x || 0;
                      next.y.mpos = y || 0;
                      next.z.mpos = z || 0;
                  } else if (key === 'WCO') {
                      const [x, y, z] = val.split(',').map(Number);
                      next.x.wco = x || 0;
                      next.y.wco = y || 0;
                      next.z.wco = z || 0;
                  } else if (key === 'FS') {
                      const [f, s] = val.split(',').map(Number);
                      next.feed = f || 0;
                      next.spindle = s || 0;
                  }
              });
              return next;
          });
      });

      const interval = setInterval(() => {
         invoke('send_realtime', { byte: 0x3F }).catch(() => {});
      }, 250);

      return () => {
          unlisten.then(f => f());
          clearInterval(interval);
      };
  }, []);

  const getStatusColor = (s: string) => {
      if (s.startsWith('Idle')) return 'bg-green-500/20 text-green-400 border-green-500/30';
      if (s.startsWith('Run')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      if (s.startsWith('Hold')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      if (s.startsWith('Alarm')) return 'bg-red-500/20 text-red-400 border-red-500/30';
      return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]';
  };

  const AxisCard = ({ label, mpos, wco }: { label: string, mpos: number, wco: number }) => {
      const wpos = mpos - wco;
      return (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-4 flex flex-col gap-1 shadow-sm">
            <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold font-mono text-[var(--accent-primary)]">{label}</span>
                <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Axis</span>
            </div>
            
            <div className="flex justify-between items-end border-b border-[var(--border-color)] pb-2 mb-2">
                 <span className="text-3xl font-mono text-[var(--text-primary)] tracking-tight">
                    {wpos.toFixed(3)}
                 </span>
                 <Tooltip content="Work Position (MPos - WCo)" position="left">
                    <span className="text-xs text-[var(--text-tertiary)] mb-1 cursor-help border-b border-dotted border-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">WPos</span>
                 </Tooltip>
            </div>

             <div className="flex justify-between items-center text-xs text-[var(--text-secondary)] font-mono">
                 <span>{mpos.toFixed(3)}</span>
                 <Tooltip content="Machine Position (Absolute)" position="left">
                    <span className="text-[var(--text-tertiary)] cursor-help border-b border-dotted border-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">MPos</span>
                 </Tooltip>
            </div>
        </div>
      );
  };

  return (
    <div className="h-full flex flex-col gap-6 p-4 max-w-4xl mx-auto w-full">
        {/* Connection & Status Header */}
        <div className="flex items-center justify-between gap-4">
             <Tooltip content="Current Machine State" position="bottom">
                 <div className={`px-4 py-2 rounded-lg border font-mono font-bold text-lg tracking-wide shadow-sm flex items-center gap-2 ${getStatusColor(state.status)}`}>
                     <Activity className="w-5 h-5" />
                     {state.status}
                 </div>
             </Tooltip>

             <div className="flex gap-6 text-sm font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border-color)]">
                 <Tooltip content="Feed Rate (mm/min)" position="bottom">
                     <div className="flex items-center gap-2 cursor-help">
                         <Move className="w-4 h-4 text-[var(--text-tertiary)]" />
                         <span>F: <span className="text-[var(--text-primary)]">{state.feed}</span></span>
                     </div>
                 </Tooltip>
                 <div className="w-px bg-[var(--border-color)]" />
                 <Tooltip content="Spindle Speed (RPM)" position="bottom">
                     <div className="flex items-center gap-2 cursor-help">
                         <Zap className="w-4 h-4 text-[var(--text-tertiary)]" />
                         <span>S: <span className="text-[var(--text-primary)]">{state.spindle}</span></span>
                     </div>
                 </Tooltip>
             </div>
        </div>

        {/* Axis Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AxisCard label="X" mpos={state.x.mpos} wco={state.x.wco} />
            <AxisCard label="Y" mpos={state.y.mpos} wco={state.y.wco} />
            <AxisCard label="Z" mpos={state.z.mpos} wco={state.z.wco} />
        </div>
        
        {/* Info / Footer */}
        <div className="mt-auto text-center text-xs text-[var(--text-tertiary)] font-mono">
             Work Position = Machine Position - Work Coordinate Offset
        </div>
    </div>
  );
}
