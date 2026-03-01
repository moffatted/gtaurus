/**
 * @file ControlsPanel.tsx
 * @purpose Main machine control interface, providing jogging, homing, and coordinate zeroing features.
 */
import { useEffect, useState } from 'react';
import { 
  Activity, Play, Pause, XCircle, Target, Home, Move, Zap,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  RotateCcw, Eye, Trash2, FileCode, AlertTriangle, Power, Square
} from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStore } from '../stores/machineStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useToolStore } from '../stores/toolStore';
import { Tooltip } from './ui/Tooltip';
import { AlarmIndicator } from './AlarmIndicator';
import { transport } from '../services/transportService';
import { useConsoleStore } from '../stores/consoleStore';
import { ConfirmPopover, AlertPopover } from './ui/Popovers';
import { useRef } from 'react';
import { useWizardStore } from '../stores/wizardStore';

export function ControlsPanel() {
  const { settings, setGeneralSettings, setStockSettings } = useSettingsStore();
  const { hasHomed, hasZeroed, setHasHomed, setHasZeroed, resetPrerequisites } = useMachineStore();
  const { machine: state, updateMachine, updateAxis } = useMachineStatusStore();
  const { appendLine } = useConsoleStore();
  const [jogLimitWarning, setJogLimitWarning] = useState<string | null>(null);
  const { 
    gcode, activeFileName, activeFilePath, fileToolNumber,
    simulate, cancelSimulation, isSimulating, simulationSpeed, setSimulationSpeed,
    clearSimulation, clearActualPath 
  } = useGcodeStore();
  const { tools, activeToolId } = useToolStore();
  const openCarveWizard = useWizardStore(state => state.openCarveWizard);

  // Popover State
  const [popover, setPopover] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    kind: 'info' | 'warning' | 'error' | 'success';
    okLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    kind: 'info'
  });

  const startButtonRef = useRef<HTMLButtonElement>(null);
  const spindleButtonRef = useRef<HTMLButtonElement>(null);

  // Reset prerequisites (hasHomed, hasZeroed) on Disconnected status for safety.
  // Interaction remains restricted via isIdle/isRun/isHold derived from status.

  const isIdle = state.status.startsWith('Idle');
  const isHold = state.status.startsWith('Hold');
  const isRun = state.status.startsWith('Run');
  const isAlarm = state.status.startsWith('Alarm');
  const isDoor = state.status.startsWith('Door');
  const needsReset = isRun || isHold || isAlarm || isDoor;

  const activeTool = tools.find(t => t.id === activeToolId);
  const toolMismatch = fileToolNumber !== null && (!activeTool || activeTool.number !== fileToolNumber);

  // Safety: Reset homed/zeroed status when machine is disconnected
  useEffect(() => {
    if (state.status === 'Disconnected') {
       resetPrerequisites();
    }
  }, [state.status, resetPrerequisites]);

  const handleStart = async () => {
    if (isHold) {
       transport.invoke('send_realtime', { byte: 0x7E }).catch(console.error); // ~ (Resume)
    } else if (isIdle && activeFilePath) {
        openCarveWizard();
    }
  };


  // Jog State
  const isMetric = settings.general.carvingUnits === 'mm';
  const unitLabel = isMetric ? 'mm' : 'in';
  const [stepSize, setStepSize] = useState<number>(isMetric ? 10 : 0.5);
  const [jogFeedRate, setJogFeedRate] = useState<number>(1000);
  const [spindleRPM, setSpindleRPM] = useState<number>(10000);
  const stepSizes = isMetric ? [0.1, 1, 5, 10, 100] : [0.001, 0.01, 0.1, 0.5, 1];

  useEffect(() => {
      let isMounted = true;
      const unlisten = transport.listen<string>('fluidnc://rx', (event: any) => {
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

          if (parts[0].startsWith('Home')) {
              (window as any)._wasHoming = true;
          } else if ((window as any)._wasHoming && (parts[0].startsWith('Idle') || parts[0].startsWith('Run') || parts[0].startsWith('Hold'))) {
              (window as any)._wasHoming = false;
              setHasHomed(true);
          }

          if (parts[0].startsWith('Alarm')) resetPrerequisites();
          
          let hasAccessoryField = false;
          parts.slice(1).forEach((part: string) => {
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
                  hasAccessoryField = true;
              }
          });
          
          if (!hasAccessoryField && !checkPending()) {
              nextUpdate.isSpindleActive = false;
          }
          
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
         transport.invoke('send_realtime', { byte: 0x3F }).catch(() => {});
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
    transport.invoke('send_realtime', { byte }).catch(console.error);
  };

  const sendGcode = (cmd: string, silent = false) => {
    if (!silent) appendLine(`> ${cmd}`, 'cmd');
    transport.invoke('send_gcode', { cmd }).catch(err => {
        if (!silent) appendLine(`error: ${err}`, 'error');
    });
  };

  const jogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalJogMoveRef = useRef<number>(0);
  const MAX_REPEAT_MOVE = 100; // Stop repeating after 100 units (mm or in)

  const stopJogging = () => {
    if (jogTimerRef.current) {
        clearTimeout(jogTimerRef.current);
        jogTimerRef.current = null;
        totalJogMoveRef.current = 0;
        // Send a real-time jog cancel (0x85) to FluidNC to stop immediately
        sendRealtime(0x85);
    }
  };

  const startJogging = (x: number, y: number, z: number) => {
    if (state.status === 'Disconnected' || (jogTimerRef.current && totalJogMoveRef.current > 0)) return;

    totalJogMoveRef.current = 0;
    // Send first move immediately
    handleJog(x, y, z, false);

    // After a delay, start repeating
    jogTimerRef.current = setTimeout(() => {
        const repeat = () => {
            if (totalJogMoveRef.current >= MAX_REPEAT_MOVE) {
                stopJogging();
                setJogLimitWarning("Max Rapid Dist");
                setTimeout(() => setJogLimitWarning(null), 2000);
                return;
            }
            handleJog(x, y, z, true);
            totalJogMoveRef.current += stepSize;
            jogTimerRef.current = setTimeout(repeat, 100);
        };
        repeat();
    }, 400); // Initial delay before repeat
  };

  const handleJog = (x: number, y: number, z: number, silent = false) => {
    const isActuallyIdle = state.status.startsWith('Idle') || state.status.startsWith('Jog');
    if (!isActuallyIdle) return;

    const moveX = x * stepSize;
    const moveY = y * stepSize;
    const moveZ = z * stepSize;

    // --- Safety Limits Check ---
    {
        const { bedSizeX, bedSizeY, bedSizeZ, homingPositionX, homingPositionY, homingPositionZ } = settings.general;
        const margin = 0.5;
        
        const check = (current: number, delta: number, limit: number, homing: 'min' | 'max'): boolean => {
            if (delta === 0) return true;
            const target = current + (delta * (isMetric ? 1 : 25.4));
            if (homing === 'min') {
                return target >= 0 + margin && target <= limit - margin;
            } else {
                return target >= -limit + margin && target <= 0 - margin;
            }
        };

        const xOk = check(state.x.mpos, x * stepSize, bedSizeX, homingPositionX);
        const yOk = check(state.y.mpos, y * stepSize, bedSizeY, homingPositionY);
        const zOk = check(state.z.mpos, z * stepSize, bedSizeZ, homingPositionZ);

        if (!xOk || !yOk || !zOk) {
            const blocked = [!xOk && 'X', !yOk && 'Y', !zOk && 'Z'].filter(Boolean).join('/');
            setJogLimitWarning(`${blocked} Limit`);
            setTimeout(() => setJogLimitWarning(null), 2000);
            return;
        }
    }

    let cmd = `$J=G91 G21 F${jogFeedRate}`;
    if (x !== 0) cmd += ` X${moveX.toFixed(3)}`;
    if (y !== 0) cmd += ` Y${moveY.toFixed(3)}`;
    if (z !== 0) cmd += ` Z${moveZ.toFixed(3)}`;
    sendGcode(cmd, silent);
  };

  const handleZero = (axis: 'X' | 'Y' | 'Z' | 'XY' | 'ALL') => {
      if (!isIdle) return;
      
      const { machine } = useMachineStatusStore.getState();
      const patch: any = {};
      let cmd = '';

      if (axis === 'ALL') {
          cmd = 'G10 L20 P1 X0 Y0 Z0';
          patch.offsetX = machine.x.mpos;
          patch.offsetY = machine.y.mpos;
          patch.offsetZ = machine.z.mpos;
      } else if (axis === 'XY') {
          cmd = 'G10 L20 P1 X0 Y0';
          patch.offsetX = machine.x.mpos;
          patch.offsetY = machine.y.mpos;
      } else if (axis === 'X') {
          cmd = 'G10 L20 P1 X0';
          patch.offsetX = machine.x.mpos;
      } else if (axis === 'Y') {
          cmd = 'G10 L20 P1 Y0';
          patch.offsetY = machine.y.mpos;
      } else if (axis === 'Z') {
          cmd = 'G10 L20 P1 Z0';
          patch.offsetZ = machine.z.mpos;
      }

      if (cmd) {
          sendGcode(cmd);
          setHasZeroed(true);
          setStockSettings(patch);
          appendLine(`[GTaurus] Workpiece Offset updated for ${axis} to current MPos`, 'sys');
      }
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
            setPopover({
                isOpen: true,
                type: 'alert',
                title: "Safety Lock",
                message: "Machine must be Homed before starting the spindle for safety.",
                kind: "warning",
                position: 'left'
            });
            (window as any)._spindlePendingUntil = 0;
            return;
        }

        setPopover({
            isOpen: true,
            type: 'confirm',
            title: 'Spindle Start',
            message: `Start spindle motor at ${spindleRPM} RPM?`,
            kind: 'warning',
            okLabel: 'Start Motor',
            cancelLabel: 'Cancel',
            onConfirm: () => {
                console.log(`[GTaurus] Spindle START initiated: ${spindleRPM} RPM`);
                sendGcode(`M3 S${spindleRPM}`);
                appendLine(`[GTaurus] Spindle Motor START requested: ${spindleRPM} RPM`, 'sys');
                updateMachine({ spindle: spindleRPM, isSpindleActive: true });
            },
            position: 'left'
        });
    }
  };

  const handleRPMChange = (newRPM: number) => {
    setSpindleRPM(newRPM);
    if (isSpindleOn) {
        sendGcode(`S${newRPM}`);
    }
  };

  const AxisDRO = ({ label, mpos, wco }: { label: string, mpos: number, wco: number }) => {
      const wpos = mpos - wco;
      const displayWpos = isMetric ? wpos : wpos / 25.4;
      const displayMpos = isMetric ? mpos : mpos / 25.4;

      return (
        <div className="flex items-center gap-2.5 bg-[var(--bg-tertiary)]/40 p-1 rounded-lg border border-[var(--border-color)]/50 group hover:border-[var(--accent-primary)]/40 transition-colors flex-1 min-w-[100px]">
            <div className="flex flex-col items-center justify-center w-6 h-6 rounded bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-sm shrink-0">
                <span className="text-[10px] font-black font-mono text-[var(--accent-primary)] leading-none">{label}</span>
            </div>
            
            <div className="flex flex-col flex-1 min-w-0">
                <div className="flex justify-between items-baseline gap-1">
                    <span className="text-base font-mono font-bold text-[var(--text-primary)] tracking-tight truncate">
                       {displayWpos.toFixed(isMetric ? 3 : 4)}
                    </span>
                    <button 
                        onClick={() => handleZero(label as any)}
                        disabled={!isIdle}
                        className={`p-0.5 rounded transition-all hover:scale-110 active:scale-95 shrink-0 ${
                            isIdle 
                            ? "text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10" 
                            : "text-[var(--text-tertiary)] cursor-not-allowed opacity-30"
                        }`}
                    >
                        <Target className="w-2.5 h-2.5" />
                    </button>
                </div>
                <div className="flex justify-between items-center text-[8px] font-mono text-[var(--text-tertiary)] border-t border-[var(--border-color)]/30 mt-0.5 pt-0.5">
                    <span className="truncate">MPos: {displayMpos.toFixed(isMetric ? 3 : 4)}</span>
                </div>
            </div>
        </div>
      );
  };

  const jogBtnClass = "jog-button transition-all duration-100 flex items-center justify-center p-3";

  return (
    <div className="h-full flex flex-col gap-3.5 p-3 max-w-4xl mx-auto w-full min-w-[380px] overflow-y-auto custom-scrollbar">
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

                    <div className="space-y-2">
                        <div className="flex justify-between items-center px-0.5">
                            <label className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Feed Rate</label>
                            <span className="text-[10px] font-mono text-cyan-400">{settings.general.feedRate} <span className="text-[var(--text-tertiary)]">{unitLabel}/min</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                            <input 
                                type="range" min="100" max="10000" step="100" 
                                value={settings.general.feedRate}
                                onChange={(e) => setGeneralSettings({ feedRate: parseInt(e.target.value) })}
                                className="accent-cyan-400 flex-1 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                            />
                            <button 
                                onClick={() => setGeneralSettings({ feedRate: 1000 })}
                                className="p-1 text-[var(--text-tertiary)] hover:text-cyan-400"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right: The Pads & DROs */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center flex-shrink-0">
                        {/* XY Pad */}
                        <div className="grid grid-cols-3 gap-2 w-36 h-36">
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(-1, 1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowUpLeft className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(0, 1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowUp className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(1, 1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowUpRight className="w-4 h-4" />
                            </button>
                            
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(-1, 0, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center justify-center">
                                <button 
                                    onClick={() => sendRealtime(0x85)}
                                    className="w-10 h-10 rounded-full border-2 border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500 transition-all font-bold text-[8px]"
                                >
                                    STOP
                                </button>
                            </div>
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(1, 0, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(-1, -1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowDownLeft className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(0, -1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowDown className="w-4 h-4" />
                            </button>
                            <button 
                                disabled={!isIdle} className={`${jogBtnClass} ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onPointerDown={() => startJogging(1, -1, 0)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                            >
                                <ArrowDownRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Z Pad */}
                        <div className="flex flex-col gap-1.5 w-11 h-36 justify-between">
                            <Tooltip content="Z+" position="left">
                                <button 
                                    disabled={!isIdle} className={`${jogBtnClass} flex-1 ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onPointerDown={() => startJogging(0, 0, 1)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                                >
                                    <ArrowUp className="w-5 h-5" />
                                </button>
                            </Tooltip>
                            <div className="text-[10px] font-bold text-center text-[var(--accent-primary)] uppercase">Z</div>
                            <Tooltip content="Z-" position="left">
                                <button 
                                    disabled={!isIdle} className={`${jogBtnClass} flex-1 ${!isIdle ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onPointerDown={() => startJogging(0, 0, -1)} onPointerUp={stopJogging} onPointerLeave={stopJogging}
                                >
                                    <ArrowDown className="w-5 h-5" />
                                </button>
                            </Tooltip>
                        </div>


                        {/* Spindle Control Pad */}
                        <div className="flex flex-col gap-2 w-28 h-36 justify-between items-center bg-[var(--bg-tertiary)]/50 p-2 rounded-2xl border border-[var(--border-color)] shadow-inner">
                            <div className="flex justify-between items-center w-full px-1">
                                <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Spindle</span>
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
                                    ref={spindleButtonRef}
                                    onClick={handleSpindleToggle}
                                    disabled={!isSpindleOn && !hasHomed}
                                    className={`p-3.5 rounded-full transition-all duration-300 shadow-lg flex items-center justify-center ${
                                        isSpindleOn 
                                            ? "bg-red-500 text-white animate-pulse shadow-red-500/30 scale-110" 
                                            : !hasHomed
                                            ? "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)] opacity-50 cursor-not-allowed"
                                            : "bg-[var(--bg-secondary)] text-amber-500 border border-[var(--border-color)] hover:border-amber-500 hover:bg-amber-500/10 cursor-pointer shadow-amber-500/10"
                                    }`}
                                >
                                    <Power className="w-5 h-5" />
                                </button>
                            </Tooltip>

                            <div className="w-full space-y-1.5 px-0.5">
                                <div className="flex justify-between items-center text-[9px] font-mono">
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
                                    className="w-full accent-amber-500 h-1 bg-[var(--bg-secondary)] rounded-lg appearance-none cursor-pointer border border-[var(--border-color)]"
                                />
                            </div>
                        </div>

                        {/* Quick Actions sidebar */}
                        {/* Side-by-side Action Panels */}
                        <div className="flex items-center gap-2">
                            {/* Job Controls Sidebar */}
                            <div className="flex flex-col gap-1 w-12 h-36 justify-between items-center bg-[var(--bg-tertiary)]/50 p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
                                <Tooltip content={isHold ? "Resume Job (~)" : "Start Job"} position="right">
                                    <button 
                                        ref={startButtonRef}
                                        onClick={handleStart} 
                                        disabled={!activeFileName || (!isIdle && !isHold) || !hasHomed || !hasZeroed}
                                        className={`w-full flex-1 flex items-center justify-center rounded-lg transition-all ${
                                            activeFileName && (isIdle || isHold) && hasHomed && hasZeroed
                                            ? "text-green-400 bg-green-500/5 hover:bg-green-500/20 active:scale-95 border border-green-500/20" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <Play className="w-4 h-4" />
                                    </button>
                                </Tooltip>

                                <Tooltip content="Pause Job (!)" position="right">
                                    <button 
                                        onClick={() => sendRealtime(0x21)} 
                                        disabled={!isRun}
                                        className={`w-full flex-1 flex items-center justify-center rounded-lg transition-all ${
                                            isRun
                                            ? "text-yellow-400 bg-yellow-500/5 hover:bg-yellow-500/20 active:scale-95 border border-yellow-500/20" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <Pause className="w-4 h-4" />
                                    </button>
                                </Tooltip>

                                <Tooltip content={isAlarm || isDoor ? "Soft Reset (CTRL-X)" : "Stop Job / Reset (CTRL-X)"} position="right">
                                    <button 
                                        onClick={() => sendRealtime(0x18)} 
                                        disabled={!needsReset}
                                        className={`w-full flex-1 flex items-center justify-center rounded-lg transition-all ${
                                            needsReset
                                            ? "text-red-400 bg-red-500/5 hover:bg-red-500/20 active:scale-95 border border-red-500/20" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </Tooltip>

                                <div className="w-6 h-px bg-[var(--border-color)] opacity-40 mx-auto" />

                                <Tooltip content={isSimulating ? "Stop Simulation" : "3D Simulation"} position="right">
                                    <button 
                                        onClick={() => isSimulating ? cancelSimulation() : simulate()} 
                                        disabled={!gcode || !activeFileName || (!isIdle && !isSimulating)}
                                        className={`w-full flex-1 flex items-center justify-center rounded-lg transition-all ${
                                            isSimulating
                                            ? "text-red-400 bg-red-500/10 animate-pulse"
                                            : gcode && activeFileName && isIdle
                                            ? "text-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/20 border border-cyan-500/20" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                </Tooltip>
                                
                               <Tooltip 
                                   content={
                                       settings.general.postJobAction 
                                       ? `Post-Job: ${settings.macros.find(m => m.id === settings.general.postJobMacroId)?.name || 'Enabled'}` 
                                       : "Enable Post-Job Action"
                                   } 
                                   position="right"
                               >
                                   <button 
                                       onClick={() => setGeneralSettings({ postJobAction: !settings.general.postJobAction })}
                                       className={`w-full flex-1 flex items-center justify-center rounded-lg transition-all ${
                                           settings.general.postJobAction
                                           ? "text-blue-400 bg-blue-500/10 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.2)]" 
                                           : "text-[var(--text-tertiary)] hover:bg-[var(--bg-secondary)] border border-transparent"
                                       }`}
                                   >
                                       <Square className={`w-3.5 h-3.5 ${settings.general.postJobAction ? 'fill-blue-400/20' : ''}`} />
                                   </button>
                               </Tooltip>

                                <Tooltip content="Clear visualization" position="right">
                                    <button 
                                        onClick={() => { clearSimulation(); clearActualPath(); }} 
                                        className="w-full h-8 flex items-center justify-center rounded-lg transition-all text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/5"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </Tooltip>
                            </div>

                            {/* Zeroing Sidebar */}
                            <div className="flex flex-col gap-2 w-12 h-36 justify-center items-center bg-[var(--bg-tertiary)]/50 p-1 rounded-xl border border-[var(--border-color)] shadow-inner">
                                <div className="text-[7px] font-bold text-[var(--text-tertiary)] uppercase tracking-tighter mb-1">Zero</div>
                                
                                <Tooltip content="Zero All Axes" position="right">
                                    <button 
                                        onClick={() => handleZero('ALL')}
                                        disabled={!isIdle}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                                            isIdle 
                                            ? "text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 active:scale-95 border border-[var(--accent-primary)]/10" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <div className="relative">
                                            <Target className="w-5 h-5" />
                                            <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-[var(--bg-secondary)] px-0.5 rounded border border-[var(--border-color)]/50">ALL</span>
                                        </div>
                                    </button>
                                </Tooltip>

                                <Tooltip content="Zero XY Axes" position="right">
                                    <button 
                                        onClick={() => handleZero('XY')}
                                        disabled={!isIdle}
                                        className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all ${
                                            isIdle 
                                            ? "text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 active:scale-95 border border-[var(--accent-primary)]/10" 
                                            : "text-[var(--text-tertiary)] opacity-30 cursor-not-allowed"
                                        }`}
                                    >
                                        <div className="relative">
                                            <Target className="w-5 h-5" />
                                            <span className="absolute -top-1.5 -right-1.5 text-[8px] font-black bg-[var(--bg-secondary)] px-0.5 rounded border border-[var(--border-color)]/50">XY</span>
                                        </div>
                                    </button>
                                </Tooltip>
                            </div>
                        </div>
                    </div>

                    {/* Compact DROs Row */}
                    <div className="flex gap-2 w-full">
                        <AxisDRO label="X" mpos={state.x.mpos} wco={state.x.wco} />
                        <AxisDRO label="Y" mpos={state.y.mpos} wco={state.y.wco} />
                        <AxisDRO label="Z" mpos={state.z.mpos} wco={state.z.wco} />
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

        {/* Popovers */}
        {popover.type === 'confirm' ? (
            <ConfirmPopover
                isOpen={popover.isOpen}
                onClose={() => setPopover(p => ({ ...p, isOpen: false }))}
                onConfirm={popover.onConfirm || (() => {})}
                title={popover.title}
                message={popover.message}
                kind={popover.kind}
                okLabel={popover.okLabel}
                cancelLabel={popover.cancelLabel}
                triggerRef={popover.title === 'Spindle Start' ? spindleButtonRef : startButtonRef}
                position={popover.position}
            />
        ) : (
            <AlertPopover
                isOpen={popover.isOpen}
                onClose={() => setPopover(p => ({ ...p, isOpen: false }))}
                title={popover.title}
                message={popover.message}
                kind={popover.kind}
                okLabel={popover.okLabel}
                triggerRef={popover.title === "Safety Lock" && popover.position === 'left' ? spindleButtonRef : startButtonRef}
                position={popover.position}
            />
        )}

    </div>
  );
}
