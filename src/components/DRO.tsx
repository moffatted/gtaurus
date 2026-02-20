import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { Activity, Move, Zap, Home, Play, Pause, XCircle, Target } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
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
  const { settings } = useSettingsStore();

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
      }, settings.connection.statusPollInterval || 2000);

      return () => {
          unlisten.then(f => f());
          clearInterval(interval);
      };
  }, [settings.connection.statusPollInterval]);

  const getStatusColor = (s: string) => {
      if (s.startsWith('Idle')) return 'bg-green-500/20 text-green-400 border-green-500/30';
      if (s.startsWith('Run')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      if (s.startsWith('Hold')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      if (s.startsWith('Alarm')) return 'bg-red-500/20 text-red-400 border-red-500/30';
      return 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)]';
  };

  const sendRealtime = (byte: number) => {
    invoke('send_realtime', { byte }).catch(console.error);
  };

  const sendGcode = (cmd: string) => {
    invoke('send_gcode', { cmd }).catch(console.error);
  };

  const AxisCard = ({ label, mpos, wco }: { label: string, mpos: number, wco: number }) => {
      const wpos = mpos - wco;
      return (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-3 flex flex-col gap-1 shadow-sm min-w-0">
            <div className="flex justify-between items-baseline mb-0.5">
                <span className="text-xl font-bold font-mono text-[var(--accent-primary)] shrink-0">{label}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">Axis</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-1.5 mb-1.5 min-w-0 gap-2">
                 <span className="text-2xl font-mono text-[var(--text-primary)] tracking-tight truncate flex-1">
                    {wpos.toFixed(3)}
                 </span>
                 <Tooltip content={`Zero ${label} Axis`} position="left">
                    <button 
                        onClick={() => sendGcode(`G10 L20 P1 ${label}0`)}
                        className="p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white rounded-lg transition-all shadow-sm shrink-0"
                    >
                        <Target className="w-4 h-4" />
                    </button>
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
    <div className="h-full flex flex-col gap-5 p-4 max-w-4xl mx-auto w-full min-w-[350px]">
        {/* Connection & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
             <div className="flex items-center gap-3">
                <Tooltip content="Current Machine State" position="bottom">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-base tracking-wide shadow-sm flex items-center gap-2 shrink-0 ${getStatusColor(state.status)}`}>
                        <Activity className="w-4 h-4" />
                        {state.status}
                    </div>
                </Tooltip>
                <Tooltip content="Home All Axis ($H)" position="bottom">
                    <button 
                        onClick={() => sendGcode('$H')}
                        className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
                    >
                        <Home className="w-4 h-4" />
                        Home
                    </button>
                </Tooltip>
             </div>
 
             <div className="flex gap-4 text-[11px] font-mono text-[var(--text-secondary)] bg-[var(--bg-secondary)] px-3 py-1.5 rounded-lg border border-[var(--border-color)] ml-auto shrink-0 shadow-sm">
                 <Tooltip content="Feed Rate (mm/min)" position="bottom">
                     <div className="flex items-center gap-1.5 cursor-help">
                         <Move className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                         <span>F: <span className="text-[var(--text-primary)]">{state.feed}</span></span>
                     </div>
                 </Tooltip>
                 <div className="w-px bg-[var(--border-color)]" />
                 <Tooltip content="Spindle Speed (RPM)" position="bottom">
                     <div className="flex items-center gap-1.5 cursor-help">
                         <Zap className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                         <span>S: <span className="text-[var(--text-primary)]">{state.spindle}</span></span>
                     </div>
                 </Tooltip>
             </div>
        </div>

        {/* Control Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Job Controls */}
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm">
                <button 
                    onClick={() => sendRealtime(0x7E)} 
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors font-bold text-xs"
                    title="Cycle Start (~)"
                >
                    <Play className="w-4 h-4" />
                    Start
                </button>
                <button 
                    onClick={() => sendRealtime(0x21)} 
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-lg transition-colors font-bold text-xs"
                    title="Feed Hold (!)"
                >
                    <Pause className="w-4 h-4" />
                    Pause
                </button>
                <button 
                    onClick={() => sendRealtime(0x18)} 
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors font-bold text-xs"
                    title="Reset (CTRL-X)"
                >
                    <XCircle className="w-4 h-4" />
                    Stop
                </button>
            </div>

            {/* Zero Controls */}
            <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm">
                <button 
                    onClick={() => sendGcode('G10 L20 P1 X0 Y0 Z0')}
                    className="flex-1 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border border-[var(--border-color)] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Zero All
                </button>
                <button 
                    onClick={() => sendGcode('G10 L20 P1 X0 Y0')}
                    className="flex-1 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border border-[var(--border-color)] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Zero XY
                </button>
            </div>
        </div>

        {/* Axis Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AxisCard label="X" mpos={state.x.mpos} wco={state.x.wco} />
            <AxisCard label="Y" mpos={state.y.mpos} wco={state.y.wco} />
            <AxisCard label="Z" mpos={state.z.mpos} wco={state.z.wco} />
        </div>
        
        {/* Info / Footer */}
        <div className="text-center text-[10px] text-[var(--text-tertiary)] font-mono italic">
             Work Pos = Machine Pos - Work Offset
        </div>
    </div>
  );
}
