import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { 
  Activity, Move, Zap, Home, Play, Pause, XCircle, Target,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  RotateCcw, Eye, Trash2, FileCode, AlertTriangle, Power
} from 'lucide-react';
import { ask } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStore } from '../stores/machineStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useToolStore } from '../stores/toolStore';
import { Tooltip } from './ui/Tooltip';
import { AlarmIndicator } from './AlarmIndicator';

export function ControlsPanel() {
  const { settings, setGeneralSettings } = useSettingsStore();
  const { hasHomed, hasZeroed, setHasHomed, setHasZeroed, resetPrerequisites } = useMachineStore();
  const { machine: state, updateMachine, updateAxis } = useMachineStatusStore();
  const [jogLimitWarning, setJogLimitWarning] = useState<string | null>(null);
  const { 
    gcode, activeFileName, activeFilePath, fileToolNumber, bounds,
    simulate, cancelSimulation, isSimulating, simulationSpeed, setSimulationSpeed,
    clearSimulation, clearActualPath 
  } = useGcodeStore();
  const { tools, activeToolId } = useToolStore();

  // No longer resetting gcode/prerequisites on Disconnected status to allow 
  // persistence through transient connection drops. Interaction remains restricted
  // via isIdle/isRun/isHold derived from status.

  const isIdle = state.status.startsWith('Idle');
  const isHold = state.status.startsWith('Hold');
  const isRun = state.status.startsWith('Run');

  const activeTool = tools.find(t => t.id === activeToolId);
  const toolMismatch = fileToolNumber !== null && (!activeTool || activeTool.number !== fileToolNumber);

  const handleStart = async () => {
    if (isHold) {
       invoke('send_realtime', { byte: 0x7E }).catch(console.error); // ~ (Resume)
    } else if (isIdle && activeFilePath) {
        // 1. Home Check
        if (!hasHomed) {
            alert("Machine must be Homed ($H) before starting a job for safety.");
            return;
        }

        // 2. Bounds Check (Safety Limits)
        if (bounds) {
            const { bedSizeX, bedSizeY, bedSizeZ } = settings.general;
            const margin = 0.5;
            
            const isAxisOut = (min: number, max: number, limit: number, mpos: number) => {
                if (mpos < -0.1) {
                    // Negative space [-limit, 0]
                    return min < -limit + margin || max > 0;
                } else {
                    // Positive space [0, limit]
                    return min < 0 || max > limit - margin;
                }
            };

            const outX = isAxisOut(bounds.minX + state.x.wco, bounds.maxX + state.x.wco, bedSizeX, state.x.mpos);
            const outY = isAxisOut(bounds.minY + state.y.wco, bounds.maxY + state.y.wco, bedSizeY, state.y.mpos);
            const outZ = isAxisOut(bounds.minZ + state.z.wco, bounds.maxZ + state.z.wco, bedSizeZ, state.z.mpos);

            if (outX || outY || outZ) {
                const confirmed = await ask(
                    "The current job's toolpath appears to exceed your machine's bed limits based on the current Work Zero. Running it may cause a crash.\n\nAre you sure you want to proceed?",
                    { title: "Safety Warning: Out of Bounds", kind: "warning", okLabel: "Proceed Anyway", cancelLabel: "Abort" }
                );
                if (!confirmed) return;
            }
        }

        // 3. Tool Safety Check
        if (fileToolNumber !== null) {
            const activeTool = tools.find(t => t.id === activeToolId);
            if (!activeTool || activeTool.number !== fileToolNumber) {
                const confirmed = await ask(
                    `The G-code file requests Tool T${fileToolNumber}, but the active tool in Gtaurus is ${activeTool ? `T${activeTool.number} (${activeTool.name})` : 'None'}.\n\nAre you sure you want to proceed with the WRONG tool?`,
                    { 
                        title: 'Tool Mismatch Warning',
                        kind: 'warning',
                        okLabel: 'Proceed Anyway',
                        cancelLabel: 'Cancel Job'
                    }
                );
                if (!confirmed) return;
            }
        }

        try {
            await invoke('stream_local_gcode', { path: activeFilePath });
        } catch (err) {
            console.error("Failed to start stream:", err);
            alert("Streaming failed to start.");
        }
    }
  };

  // Jog State
  const isMetric = settings.general.carvingUnits === 'mm';
  const unitLabel = isMetric ? 'mm' : 'in';
  const [stepSize, setStepSize] = useState<number>(isMetric ? 10 : 0.5);
  const [jogFeedRate, setJogFeedRate] = useState<number>(1000);
  const [spindleRPM, setSpindleRPM] = useState<number>(10000);
  const stepSizes = isMetric ? [0.1, 1, 10, 100] : [0.001, 0.01, 0.1, 1];

  useEffect(() => {
      let isMounted = true;
      const unlisten = listen<string>('fluidnc://rx', (event) => {
          if (!isMounted) return;
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
          
          const nextUpdate: any = { status: parts[0] };

          // Logic to protect the manual spindle toggle from being overwritten by 
          // laggy status reports from the controller.
          const checkPending = () => {
              if ((window as any)._spindlePendingUntil && Date.now() < (window as any)._spindlePendingUntil) {
                  return true;
              }
              return false;
          };

          if (parts[0].startsWith('Home')) setHasHomed(true);
          if (parts[0].startsWith('Alarm')) resetPrerequisites();
          
          parts.slice(1).forEach((part) => {
              const [key, val] = part.split(':');
              if (!val) return;

              if (key === 'MPos') {
                  const [x, y, z] = val.split(',').map(Number);
                  updateAxis('x', { mpos: x || 0 });
                  updateAxis('y', { mpos: y || 0 });
                  updateAxis('z', { mpos: z || 0 });
              } else if (key === 'WCO') {
                  const [x, y, z] = val.split(',').map(Number);
                  updateAxis('x', { wco: x || 0 });
                  updateAxis('y', { wco: y || 0 });
                  updateAxis('z', { wco: z || 0 });
              } else if (key === 'FS') {
                  const [f, s] = val.split(',').map(Number);
                  nextUpdate.feed = f || 0;
                  if (!checkPending()) nextUpdate.spindle = s || 0;
              } else if (key === 'S') {
                  if (!checkPending()) nextUpdate.spindle = Number(val) || 0;
              } else if (key === 'A') {
                  if (!checkPending()) {
                      nextUpdate.isSpindleActive = (val.includes('S') || val.includes('C'));
                  }
              }
          });
          
          updateMachine(nextUpdate);
      });

      return () => {
          isMounted = false;
          unlisten.then(f => f());
      };
  }, [updateMachine, updateAxis, setHasHomed, resetPrerequisites]);

  // Status Polling Effect
  useEffect(() => {
      const interval = setInterval(() => {
         invoke('send_realtime', { byte: 0x3F }).catch(() => {});
      }, settings.connection.statusPollInterval || 2000);

      return () => clearInterval(interval);
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

  const handleJog = (x: number, y: number, z: number) => {
    if (!isIdle) return;

    // --- Safety Limits Check ---
    if (hasHomed) {
        const { bedSizeX, bedSizeY, bedSizeZ } = settings.general;
        const margin = 0.5; // mm margin to avoid triggering hard limits/endstops
        
        const check = (current: number, delta: number, limit: number) => {
            if (delta === 0) return true;
            const target = current + delta;
            
            // Heuristic detection of coordinate system
            // Negative space (0 is back/right/top, common in Grbl/FluidNC): range [-limit, 0]
            if (current < -0.1) {
                if (target < -limit + margin || target > 0) return false;
            } 
            // Positive space (0 is front/left/bottom): range [0, limit]
            else if (current > 0.1) {
                if (target < 0 || target > limit - margin) return false;
            }
            // If at 0, we allow moving into either negative or positive space as long as range is valid
            else {
                if (Math.abs(target) > limit - margin) return false;
            }
            return true;
        };

        const dx = x * stepSize * (isMetric ? 1 : 25.4);
        const dy = y * stepSize * (isMetric ? 1 : 25.4);
        const dz = z * stepSize * (isMetric ? 1 : 25.4);

        if (!check(state.x.mpos, dx, bedSizeX) || 
            !check(state.y.mpos, dy, bedSizeY) || 
            !check(state.z.mpos, dz, bedSizeZ)) {
            setJogLimitWarning("Bed Limit");
            setTimeout(() => setJogLimitWarning(null), 2000);
            return;
        }
    }

    let cmd = `$J=G91 G21 F${jogFeedRate}`;
    if (x !== 0) cmd += ` X${(x * stepSize).toFixed(3)}`;
    if (y !== 0) cmd += ` Y${(y * stepSize).toFixed(3)}`;
    if (z !== 0) cmd += ` Z${(z * stepSize).toFixed(3)}`;
    sendGcode(cmd);
  };

  const isSpindleOn = state.spindle > 0 || state.isSpindleActive;

  const handleSpindleToggle = async () => {
    const currentState = state.spindle > 0 || state.isSpindleActive;
    const isAlarm = state.status.toLowerCase().includes('alarm');
    
    // Lock UI state for 5 seconds to outlast deceleration/sync issues
    (window as any)._spindlePendingUntil = Date.now() + 5000;

    if (currentState) {
        // --- ACTION: STOP ---
        console.log("[GTaurus] Spindle STOP initiated...");
        
        try {
            if (isAlarm) {
                // If in Alarm, buffered M5 will likely fail. Send $X first.
                await sendGcode('$X');
                await new Promise(r => setTimeout(r, 100));
            }
            
            // 1. Send M3 S0 (Preferred for some PWM spindles)
            await sendGcode('M3 S0');
            
            // 2. Send M5 (Universal G-code stop)
            await sendGcode('M5');
            
            // 3. Send REALTIME override (0x85)
            sendRealtime(0x85);
            
            // 4. Force immediate status refresh (?)
            sendRealtime(0x3F);
            
            // Update UI immediately
            updateMachine({ spindle: 0, isSpindleActive: false });
            console.log("[GTaurus] Spindle STOP: M3 S0 -> M5 -> 0x85 -> ?");
        } catch (e) {
            console.error("[GTaurus] Spindle stop failed:", e);
        }
    } else {
        // --- ACTION: START ---
        if (!hasHomed) {
            alert("Machine must be Homed before starting the spindle for safety.");
            (window as any)._spindlePendingUntil = 0;
            return;
        }

        const confirmed = await ask(
            `Start spindle motor at ${spindleRPM} RPM?`,
            { title: 'Spindle Start', kind: 'warning', okLabel: 'Start Motor', cancelLabel: 'Cancel' }
        );

        if (confirmed) {
            console.log(`[GTaurus] Spindle START initiated: ${spindleRPM} RPM`);
            
            // If Spindle was stopped via Realtime 0x9E, sending M3 again 
            // might be ignored if the override is still active.
            // FluidNC/Grbl requires another 0x9E to release the override, 
            // OR we just send M3 and see. Usually M3/M4 releases it.
            
            sendGcode(`M3 S${spindleRPM}`);
            updateMachine({ spindle: spindleRPM, isSpindleActive: true });
        } else {
            (window as any)._spindlePendingUntil = 0;
        }
    }
  };

  const handleRPMChange = (newRPM: number) => {
    setSpindleRPM(newRPM);
    if (isSpindleOn) {
        sendGcode(`S${newRPM}`);
    }
  };

  const AxisCard = ({ label, mpos, wco }: { label: string, mpos: number, wco: number }) => {
      const wpos = mpos - wco;
      const displayWpos = isMetric ? wpos : wpos / 25.4;
      const displayMpos = isMetric ? mpos : mpos / 25.4;

      return (
        <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-2.5 flex flex-col gap-0.5 shadow-sm min-w-0">
            <div className="flex justify-between items-baseline mb-0">
                <span className="text-lg font-bold font-mono text-[var(--accent-primary)] shrink-0">{label}</span>
                <span className="text-[9px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">{unitLabel} Axis</span>
            </div>
            
            <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-1 mb-1 min-w-0 gap-2">
                 <span className="text-xl font-mono text-[var(--text-primary)] tracking-tight truncate flex-1">
                    {displayWpos.toFixed(isMetric ? 3 : 4)}
                 </span>
                 <Tooltip content={isIdle ? `Zero ${label} Axis` : "Cannot zero while machine is busy"} position="left">
                    <button 
                        onClick={() => { sendGcode(`G10 L20 P1 ${label}0`); setHasZeroed(true); }}
                        disabled={!isIdle}
                        className={`p-1 border rounded-lg transition-all shadow-sm shrink-0 ${
                            isIdle 
                            ? "bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white" 
                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                        }`}
                    >
                        <Target className="w-3.5 h-3.5" />
                    </button>
                 </Tooltip>
            </div>

             <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-mono">
                 <span>{displayMpos.toFixed(isMetric ? 3 : 4)}</span>
                 <Tooltip content={`Machine Position (${unitLabel})`} position="left">
                    <span className="text-[var(--text-tertiary)] cursor-help border-b border-dotted border-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">MPos</span>
                 </Tooltip>
            </div>
        </div>
      );
  };

  const jogBtnClass = "p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] active:bg-[var(--accent-primary)] active:text-white transition-all duration-150 flex items-center justify-center shadow-sm";

  return (
    <div className="h-full flex flex-col gap-3.5 p-3 max-w-4xl mx-auto w-full min-w-[420px] overflow-y-auto custom-scrollbar">
        {/* Connection & Status Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <AlarmIndicator />
                {jogLimitWarning && (
                    <div className="px-2 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold text-[10px] uppercase animate-in fade-in zoom-in duration-200">
                        {jogLimitWarning}
                    </div>
                )}
                <Tooltip content="Current Machine State" position="bottom">
                    <div className={`px-3 py-1.5 rounded-lg border font-mono font-bold text-base tracking-wide shadow-sm flex items-center gap-2 shrink-0 ${getStatusColor(state.status)}`}>
                        <Activity className="w-4 h-4" />
                        {state.status}
                    </div>
                </Tooltip>
                <div className="flex flex-col">
                    {activeFileName && (
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-t border-x border-t border-[var(--accent-primary)]/20 truncate max-w-[140px]">
                            <FileCode className="w-3 h-3" />
                            {activeFileName}
                        </div>
                    )}
                    <Tooltip content={hasHomed ? "Machine is Homed" : "Home All Axis ($H)"} position="bottom">
                        <button 
                            onClick={() => sendGcode('$H')}
                            className={`p-2 border rounded-lg transition-all shadow-sm flex items-center gap-2 text-xs font-bold ${
                                activeFileName ? "rounded-t-none border-t-0" : ""
                            } ${
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 shrink-0">
            <AxisCard label="X" mpos={state.x.mpos} wco={state.x.wco} />
            <AxisCard label="Y" mpos={state.y.mpos} wco={state.y.wco} />
            <AxisCard label="Z" mpos={state.z.mpos} wco={state.z.wco} />
        </div>

        {/* Control Groups */}
        <div className="flex flex-wrap gap-2.5 shrink-0">
            {/* Job Controls */}
            <div className="flex-1 min-w-[380px] flex flex-wrap items-center gap-2 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm">
                <Tooltip 
                    content={
                        !activeFileName ? "Load a file first" :
                        !hasHomed ? "Machine must be Homed ($H)" :
                        !hasZeroed ? "Set Work Zero first (Zero All/XY)" :
                        !isIdle && !isHold ? `Machine is ${state.status}` :
                        isHold ? "Resume Job (~)" : "Start Job"
                    } 
                    position="top"
                >
                    <button 
                        onClick={handleStart} 
                        disabled={!activeFileName || (!isIdle && !isHold) || !hasHomed || !hasZeroed}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-bold text-xs ${
                            activeFileName && (isIdle || isHold) && hasHomed && hasZeroed
                            ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border-green-500/30" 
                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                        }`}
                    >
                        <Play className="w-4 h-4" />
                        {isHold ? "Resume" : "Start"}
                    </button>
                </Tooltip>
                
                <Tooltip content={!isRun ? "Machine is not running" : "Pause Job (!)"} position="top">
                    <button 
                        onClick={() => sendRealtime(0x21)} 
                        disabled={!isRun}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-bold text-xs ${
                            isRun
                            ? "bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border-yellow-500/30" 
                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                        }`}
                    >
                        <Pause className="w-4 h-4" />
                        Pause
                    </button>
                </Tooltip>

                <Tooltip content={!isRun && !isHold ? "Nothing to stop" : "Terminate Job / Reset (CTRL-X)"} position="top">
                    <button 
                        onClick={() => sendRealtime(0x18)} 
                        disabled={!isRun && !isHold}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors font-bold text-xs ${
                            isRun || isHold
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30" 
                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                        }`}
                    >
                        <XCircle className="w-4 h-4" />
                        Stop
                    </button>
                </Tooltip>
                <div className="w-px h-6 bg-[var(--border-color)] mx-1" />
                
                <Tooltip 
                    content={
                        !activeFileName ? "Load a file first" :
                        !gcode ? "File content is empty" :
                        !isIdle && !isSimulating ? "Cannot simulate while machine is busy" :
                        isSimulating ? "Stop simulation" :
                        "Pre-calculate 3D toolpath"
                    } 
                    position="top"
                >
                    <button 
                        onClick={() => isSimulating ? cancelSimulation() : simulate()} 
                        disabled={!gcode || !activeFileName || (!isIdle && !isSimulating)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded-lg transition-colors font-bold text-xs ${
                            isSimulating
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-400/30 animate-pulse"
                            : gcode && activeFileName && isIdle
                            ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border-cyan-500/30" 
                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                        }`}
                    >
                        {isSimulating ? (
                            <>
                                <XCircle className="w-4 h-4" />
                                Stop Sim
                            </>
                        ) : (
                            <>
                                <Eye className="w-4 h-4" />
                                Sim
                            </>
                        )}
                    </button>
                </Tooltip>
                
                <Tooltip content="Clear visualized paths" position="top">
                    <button 
                        onClick={() => { clearSimulation(); clearActualPath(); }} 
                        className="p-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-red-400 border border-[var(--border-color)] rounded-lg transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </Tooltip>
            </div>

            {/* Zero Controls */}
            <div className="flex-[0.4] min-w-[160px] flex items-center gap-2 bg-[var(--bg-secondary)] p-2 rounded-xl border border-[var(--border-color)] shadow-sm">
                <button 
                    onClick={() => { sendGcode('G10 L20 P1 X0 Y0 Z0'); setHasZeroed(true); }}
                    disabled={!isIdle}
                    className={`flex-1 py-2 border rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 ${
                        isIdle 
                        ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border-[var(--border-color)]" 
                        : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                    }`}
                >
                    <Target className="w-4 h-4" />
                    Zero All
                </button>
                <button 
                    onClick={() => { sendGcode('G10 L20 P1 X0 Y0'); setHasZeroed(true); }}
                    disabled={!isIdle}
                    className={`flex-1 py-2 border rounded-lg transition-all font-bold text-xs flex items-center justify-center gap-2 ${
                        isIdle 
                        ? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] border-[var(--border-color)]" 
                        : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border-[var(--border-color)] cursor-not-allowed opacity-50"
                    }`}
                >
                    <Target className="w-4 h-4" />
                    Zero XY
                </button>
            </div>
        </div>

        <div className="border-t border-[var(--border-color)] w-full opacity-50 my-1" />

        {/* Jog Controls */}
        <div className="flex flex-col gap-4 select-none bg-[var(--bg-secondary)]/30 p-3 rounded-2xl border border-[var(--border-color)]">
            <div className="flex flex-wrap gap-4 items-start justify-between">
                {/* Left: Step & Feed */}
                <div className="flex flex-col gap-4 flex-1 min-w-[200px]">
                    {/* Unit & Step Selection */}
                    <div className="space-y-3">
                         <div className="flex justify-between items-center px-0.5">
                            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Movement & Feedrate</label>
                            <div className="flex bg-[var(--bg-tertiary)] p-0.5 rounded border border-[var(--border-color)]">
                                {(['mm', 'inches'] as const).map(u => (
                                    <button
                                        key={u}
                                        onClick={() => setGeneralSettings({ carvingUnits: u })}
                                        className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-all cursor-pointer ${
                                            settings.general.carvingUnits === u 
                                            ? 'bg-[var(--accent-primary)] text-white' 
                                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                        }`}
                                    >
                                        {u === 'inches' ? 'in' : u}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Step Size ({unitLabel})</label>
                             <div className="flex gap-1.5">
                                 {stepSizes.map(size => (
                                     <button
                                         key={size}
                                         onClick={() => setStepSize(size)}
                                         className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
                                             stepSize === size 
                                             ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold' 
                                             : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                                         }`}
                                     >
                                         {size}
                                     </button>
                                 ))}
                             </div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-0.5">
                            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Jog Feed</label>
                            <span className="text-[10px] font-mono text-[var(--accent-primary)]">{jogFeedRate} <span className="text-[var(--text-tertiary)]">{unitLabel}/min</span></span>
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
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(-1, 1, 0)}><ArrowUpLeft className="w-4 h-4" /></button>
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(0, 1, 0)}><ArrowUp className="w-4 h-4" /></button>
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(1, 1, 0)}><ArrowUpRight className="w-4 h-4" /></button>
                        
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(-1, 0, 0)}><ArrowLeft className="w-4 h-4" /></button>
                        <div className="flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-[var(--border-color)] opacity-20" />
                        </div>
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(1, 0, 0)}><ArrowRight className="w-4 h-4" /></button>
                        
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(-1, -1, 0)}><ArrowDownLeft className="w-4 h-4" /></button>
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(0, -1, 0)}><ArrowDown className="w-4 h-4" /></button>
                        <button disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(1, -1, 0)}><ArrowDownRight className="w-4 h-4" /></button>
                    </div>

                    {/* Z Pad */}
                    <div className="flex flex-col gap-2 w-12 h-40 justify-between">
                        <Tooltip content="Z+" position="left">
                            <button disabled={!isIdle} className={`${jogBtnClass} flex-1 ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(0, 0, 1)}><ArrowUp className="w-5 h-5" /></button>
                        </Tooltip>
                        <div className="text-[10px] font-bold text-center text-[var(--accent-primary)] uppercase">Z</div>
                        <Tooltip content="Z-" position="left">
                            <button disabled={!isIdle} className={`${jogBtnClass} flex-1 ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`} onClick={() => handleJog(0, 0, -1)}><ArrowDown className="w-5 h-5" /></button>
                        </Tooltip>
                    </div>

                    {/* Spindle Control Pad */}
                    <div className="flex flex-col gap-2 w-28 h-40 justify-between items-center bg-[var(--bg-tertiary)]/50 p-2.5 rounded-2xl border border-[var(--border-color)] shadow-inner">
                        <div className="flex justify-between items-center w-full px-1">
                            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Spindle</span>
                            <button 
                                onClick={() => handleRPMChange(settings.spindle.maxRPM)}
                                className="text-[9px] font-bold text-[var(--accent-primary)] hover:underline uppercase"
                            >
                                Max
                            </button>
                        </div>

                        <Tooltip 
                            content={
                                isSpindleOn ? "Stop Spindle (M5)" : 
                                !hasHomed ? "Home machine before starting spindle" :
                                "Start Spindle (M3)"
                            } 
                            position="left"
                        >
                            <button 
                                onClick={handleSpindleToggle}
                                disabled={!isSpindleOn && !hasHomed}
                                className={`p-4 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${
                                    isSpindleOn 
                                        ? "bg-red-500 text-white animate-pulse shadow-red-500/30 scale-110" 
                                        : !hasHomed
                                        ? "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)] opacity-50 cursor-not-allowed"
                                        : "bg-[var(--bg-secondary)] text-amber-500 border border-[var(--border-color)] hover:border-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                }`}
                            >
                                <Power className="w-6 h-6" />
                            </button>
                        </Tooltip>

                        <div className="w-full space-y-1.5 px-0.5">
                            <div className="flex justify-between items-center text-[10px] font-mono">
                                <span className={`${isSpindleOn ? 'text-amber-400' : 'text-[var(--text-secondary)]'} font-bold`}>{spindleRPM}</span>
                                <span className="text-[var(--text-tertiary)] text-[8px]">RPM</span>
                            </div>
                            <input 
                                type="range" 
                                min={settings.spindle.minRPM} 
                                max={settings.spindle.maxRPM} 
                                step="500"
                                value={spindleRPM}
                                onChange={(e) => handleRPMChange(parseInt(e.target.value))}
                                className="w-full accent-amber-500 h-1.5 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sim Speed & Status Bar */}
            <div className="mt-1 pt-3 border-t border-[var(--border-color)]/30 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Sim Speed Control */}
                    <div className="flex-1 min-w-[200px] group">
                        <div className="flex justify-between items-center mb-1.5 px-0.5">
                            <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider group-hover:text-[var(--accent-primary)] transition-colors">Simulation Speed</label>
                            <span className="text-xs font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded">{simulationSpeed} <span className="text-[var(--text-tertiary)]">pts/sec</span></span>
                        </div>
                        <input 
                            type="range" min="10" max="500" step="10" 
                            value={simulationSpeed}
                            onChange={(e) => setSimulationSpeed(parseInt(e.target.value))}
                            className="accent-cyan-400 flex-1 w-full h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                        />
                    </div>

                    {/* Active File Status Bar */}
                    <div className="flex-1 min-w-[250px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`p-1.5 rounded-lg ${activeFileName ? 'bg-cyan-500/10 text-cyan-400' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'}`}>
                                <FileCode className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Active G-Code File</span>
                                <span className="text-sm font-mono text-[var(--text-primary)] truncate">
                                    {activeFileName || "No file selected"}
                                </span>
                            </div>
                        </div>
                        {activeFileName && (
                            <div className="flex items-center gap-2 shrink-0">
                                {toolMismatch && (
                                    <Tooltip content={`Tool Mismatch: File requests T${fileToolNumber}, machine has ${activeTool ? 'T'+activeTool.number : 'None'}`}>
                                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/30 animate-pulse">
                                            <AlertTriangle className="w-3.5 h-3.5" />
                                            Tool T{fileToolNumber}?
                                        </div>
                                    </Tooltip>
                                )}
                                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Ready
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Info / Footer */}
        <div className="text-center text-[10px] text-[var(--text-tertiary)] font-mono italic shrink-0 py-4 border-t border-[var(--border-color)]/30 mt-2">
             Work Pos = Machine Pos - Work Offset | Active Modal: {isMetric ? 'G21 (Metric)' : 'G20 (Imperial)'} G91 (Incremental)
        </div>
    </div>
  );
}
