import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  Activity, Move, Zap, Home, Play, Pause, XCircle, Target,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  RotateCcw
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStore } from '../stores/machineStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { Tooltip } from './ui/Tooltip';
import { AlarmIndicator } from './AlarmIndicator';

export function ControlsPanel() {
  const { settings } = useSettingsStore();
  const { hasHomed, setHasHomed, setHasZeroed, resetPrerequisites } = useMachineStore();
  const { machine: state, updateMachine } = useMachineStatusStore();

  // Jog State
  const [stepSize, setStepSize] = useState<number>(10);
  const [jogFeedRate, setJogFeedRate] = useState<number>(1000);
  const stepSizes = [0.1, 1, 10, 100];

  useEffect(() => {
      const unlisten = listen<string>('fluidnc://rx', (event) => {
          const line = event.payload;

          if (line.startsWith('[VER:')) {
            const parts = line.replace('[VER:', '').replace(']', '').split(':');
            updateMachine({ firmware: parts[0] || 'GRBL', buildInfo: line });
          }
          if (line.includes('FluidNC')) {
            updateMachine({ board: 'FluidNC Controller' });
          }

          if (!line.startsWith('<') || !line.endsWith('>')) return;

          const content = line.slice(1, -1);
          const parts = content.split('|');
          
          const next: any = { status: parts[0] };

          if (parts[0] === 'Home') setHasHomed(true);
          if (parts[0] === 'Alarm') resetPrerequisites();
          
          parts.slice(1).forEach((part) => {
              const [key, val] = part.split(':');
              if (!val) return;

              if (key === 'MPos') {
                  const [x, y, z] = val.split(',').map(Number);
                  next.x = { ...state.x, mpos: x || 0 };
                  next.y = { ...state.y, mpos: y || 0 };
                  next.z = { ...state.z, mpos: z || 0 };
              } else if (key === 'WCO') {
                  const [x, y, z] = val.split(',').map(Number);
                  next.x = { ...(next.x || state.x), wco: x || 0 };
                  next.y = { ...(next.y || state.y), wco: y || 0 };
                  next.z = { ...(next.z || state.z), wco: z || 0 };
              } else if (key === 'FS') {
                  const [f, s] = val.split(',').map(Number);
                  next.feed = f || 0;
                  next.spindle = s || 0;
              }
          });
          
          updateMachine(next);
      });

      const interval = setInterval(() => {
         invoke('send_realtime', { byte: 0x3F }).catch(() => {});
      }, settings.connection.statusPollInterval || 2000);

      return () => {
          unlisten.then(f => f());
          clearInterval(interval);
      };
  }, [settings.connection.statusPollInterval, state, updateMachine, setHasHomed, resetPrerequisites]);

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

  const handleJog = (x: number, y: number, z: number) => {
    let cmd = `$J=G91 G21 F${jogFeedRate}`;
    if (x !== 0) cmd += ` X${(x * stepSize).toFixed(3)}`;
    if (y !== 0) cmd += ` Y${(y * stepSize).toFixed(3)}`;
    if (z !== 0) cmd += ` Z${(z * stepSize).toFixed(3)}`;
    sendGcode(cmd);
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
                        onClick={() => { sendGcode(`G10 L20 P1 ${label}0`); setHasZeroed(true); }}
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

  const jogBtnClass = "p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] active:bg-[var(--accent-primary)] active:text-white transition-all duration-150 flex items-center justify-center shadow-sm";

  return (
    <div className="h-full flex flex-col gap-5 p-4 max-w-4xl mx-auto w-full min-w-[350px] overflow-y-auto custom-scrollbar">
        {/* Connection & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <AlarmIndicator />
                <Tooltip content="Current Machine State" position="bottom">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-base tracking-wide shadow-sm flex items-center gap-2 shrink-0 ${getStatusColor(state.status)}`}>
                        <Activity className="w-4 h-4" />
                        {state.status}
                    </div>
                </Tooltip>
                <Tooltip content={hasHomed ? "Machine is Homed" : "Home All Axis ($H)"} position="bottom">
                    <button 
                        onClick={() => sendGcode('$H')}
                        className={`p-2 border rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold ${
                            hasHomed 
                            ? "bg-green-500/10 text-green-400 border-green-500/30" 
                            : "bg-[var(--bg-secondary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]"
                        }`}
                    >
                        <Home className="w-4 h-4" />
                        {hasHomed ? "Homed" : "Home"}
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

        {/* Axis Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
            <AxisCard label="X" mpos={state.x.mpos} wco={state.x.wco} />
            <AxisCard label="Y" mpos={state.y.mpos} wco={state.y.wco} />
            <AxisCard label="Z" mpos={state.z.mpos} wco={state.z.wco} />
        </div>

        {/* Control Groups */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0">
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
                    onClick={() => { sendGcode('G10 L20 P1 X0 Y0 Z0'); setHasZeroed(true); }}
                    className="flex-1 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border border-[var(--border-color)] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Zero All
                </button>
                <button 
                    onClick={() => { sendGcode('G10 L20 P1 X0 Y0'); setHasZeroed(true); }}
                    className="flex-1 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border border-[var(--border-color)] rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2"
                >
                    <Target className="w-4 h-4" />
                    Zero XY
                </button>
            </div>
        </div>

        <div className="border-t border-[var(--border-color)] w-full opacity-50 my-1" />

        {/* Jog Controls */}
        <div className="flex flex-col gap-6 select-none bg-[var(--bg-secondary)]/30 p-4 rounded-2xl border border-[var(--border-color)]">
            <div className="flex flex-wrap gap-6 items-start justify-between">
                {/* Left: Step & Feed */}
                <div className="flex flex-col gap-4 flex-1 min-w-[200px]">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Step Size (mm)</label>
                        <div className="flex gap-1.5">
                            {stepSizes.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setStepSize(size)}
                                    className={`flex-1 py-1 rounded text-xs font-mono border transition-all ${
                                        stepSize === size 
                                        ? "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-sm" 
                                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]"
                                    }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-0.5">
                            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Jog Feed</label>
                            <span className="text-[10px] font-mono text-[var(--accent-primary)]">{jogFeedRate} <span className="text-[var(--text-tertiary)]">mm/min</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="range" min="100" max="5000" step="100" 
                                value={jogFeedRate}
                                onChange={(e) => setJogFeedRate(parseInt(e.target.value))}
                                className="accent-[var(--accent-primary)] flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                            />
                            <button 
                                onClick={() => setJogFeedRate(1000)}
                                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: The Pads */}
                <div className="flex flex-col md:flex-row gap-8 items-center justify-center flex-shrink-0">
                    {/* XY Pad */}
                    <div className="grid grid-cols-3 gap-2 w-40 h-40">
                        <button className={jogBtnClass} onClick={() => handleJog(-1, 1, 0)}><ArrowUpLeft className="w-4 h-4" /></button>
                        <button className={jogBtnClass} onClick={() => handleJog(0, 1, 0)}><ArrowUp className="w-4 h-4" /></button>
                        <button className={jogBtnClass} onClick={() => handleJog(1, 1, 0)}><ArrowUpRight className="w-4 h-4" /></button>
                        
                        <button className={jogBtnClass} onClick={() => handleJog(-1, 0, 0)}><ArrowLeft className="w-4 h-4" /></button>
                        <div className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--border-color)] opacity-20" />
                        </div>
                        <button className={jogBtnClass} onClick={() => handleJog(1, 0, 0)}><ArrowRight className="w-4 h-4" /></button>
                        
                        <button className={jogBtnClass} onClick={() => handleJog(-1, -1, 0)}><ArrowDownLeft className="w-4 h-4" /></button>
                        <button className={jogBtnClass} onClick={() => handleJog(0, -1, 0)}><ArrowDown className="w-4 h-4" /></button>
                        <button className={jogBtnClass} onClick={() => handleJog(1, -1, 0)}><ArrowDownRight className="w-4 h-4" /></button>
                    </div>

                    {/* Z Pad */}
                    <div className="flex flex-col gap-2 w-12 h-40 justify-between">
                        <Tooltip content="Z+" position="left">
                            <button className={`${jogBtnClass} flex-1`} onClick={() => handleJog(0, 0, 1)}><ArrowUp className="w-5 h-5" /></button>
                        </Tooltip>
                        <div className="text-[10px] font-bold text-center text-[var(--accent-primary)] uppercase">Z</div>
                        <Tooltip content="Z-" position="left">
                            <button className={`${jogBtnClass} flex-1`} onClick={() => handleJog(0, 0, -1)}><ArrowDown className="w-5 h-5" /></button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </div>

        {/* Info / Footer */}
        <div className="text-center text-[10px] text-[var(--text-tertiary)] font-mono italic shrink-0 py-2">
             Work Pos = Machine Pos - Work Offset | Active Modal: G21 G91
        </div>
    </div>
  );
}
