import { useState, useEffect } from 'react';
import { Wizard, WizardStep } from '../ui/Wizard';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useMachineStore } from '../../stores/machineStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';
import { 
  CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, 
  ArrowUp, ArrowDown, Info, Home, Settings2, Wrench, 
  Cpu, MousePointer2, Thermometer, Play, AlertTriangle,
  RotateCcw, RotateCw, RefreshCw, Unlock
} from 'lucide-react';

export function MachineSetupWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { machine } = useMachineStatusStore();
  const { hasHomed, setHasHomed, resetPrerequisites } = useMachineStore();
  const { settings, setGeneralSettings, setProbeSettings, setSpindleSettings, updateSettings } = useSettingsStore();
  const [axisChecks, setAxisChecks] = useState({ x: false, y: false, z: false });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetPrerequisites();
      setHasHomed(false);
      setAxisChecks({ x: false, y: false, z: false });
    }
  }, [isOpen, resetPrerequisites, setHasHomed]);

  // Status listener for Homing detection within the wizard
  useEffect(() => {
    if (!isOpen) return;

    let wasHoming = false;
    const unlisten = transport.listen<string>('fluidnc://rx', (event: any) => {
        const line = event.payload;
        if (!line.startsWith('<') || !line.endsWith('>')) return;

        const content = line.slice(1, -1);
        const parts = content.split('|');
        const status = parts[0];

        if (status.startsWith('Home')) {
            wasHoming = true;
        } else if (wasHoming && (status.startsWith('Idle') || status.startsWith('Run') || status.startsWith('Hold'))) {
            wasHoming = false;
            setHasHomed(true);
        }
    });

    return () => {
        unlisten.then(f => f());
    };
  }, [isOpen, setHasHomed]);

  const isConnected = machine.status !== 'Disconnected' && machine.status !== 'Connecting';
  const isIdle = machine.status.startsWith('Idle');

  const sendGcode = (cmd: string) => {
    transport.invoke('send_gcode', { cmd }).catch(console.error);
  };

  const handleJog = (axis: 'X' | 'Y' | 'Z', direction: number) => {
    // respect reversal settings
    let dir = direction;
    if (axis === 'X' && settings.general.reverseX) dir *= -1;
    if (axis === 'Y' && settings.general.reverseY) dir *= -1;
    if (axis === 'Z' && settings.general.reverseZ) dir *= -1;

    // Small jog 5mm at 500mm/min
    sendGcode(`$J=G91 G21 F500 ${axis}${dir * 5}`);
    
    // Movement invalidates homing status for the purpose of the wizard verification
    if (hasHomed) setHasHomed(false);
  };

  const handleStop = () => {
    // Critical halt (Ctrl+X)
    transport.invoke('send_raw', { data: [0x18] }).catch(console.error);
    // Also send standard stop just in case
    sendGcode('!');
  };

  const handleHome = () => {
    sendGcode('$H');
  };

  const handleUnlock = () => {
    sendGcode('$X');
  };

  const isAlarm = machine.status.toLowerCase().includes('alarm');

  const steps: WizardStep[] = [
    {
      id: 'welcome',
      title: 'Welcome',
      component: (
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mb-2">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-[var(--text-primary)]">Setup Wizard</h3>
          <p className="text-[var(--text-secondary)] max-w-md">
            Welcome to the Gtaurus Setup Wizard. This will guide you through connecting, 
            verifying your machine axes, and homing for the first time.
          </p>
          <p className="text-sm text-[var(--text-tertiary)] italic">
            Please ensure your machine is powered on and emergency stop is disengaged.
          </p>
        </div>
      )
    },
    {
      id: 'connection',
      title: 'Connection',
      canProceed: isConnected,
      component: (
        <div className="space-y-6">
          <div className="space-y-3">
             <label className="text-xs font-bold text-[var(--text-tertiary)] uppercase px-1">Connection Type</label>
             <div className="grid grid-cols-3 gap-3">
               {(['telnet', 'serial', 'websocket'] as const).map((mode) => (
                 <button
                  key={mode}
                  onClick={() => updateSettings({ connection: { ...settings.connection, preferredMode: mode } })}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer
                    ${settings.connection.preferredMode === mode 
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]' 
                      : 'border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]'}
                  `}
                 >
                   <div className="w-8 h-8 rounded-full bg-current/10 flex items-center justify-center">
                     {mode === 'telnet' && <Cpu className="w-4 h-4" />}
                     {mode === 'serial' && <Settings2 className="w-4 h-4" />}
                     {mode === 'websocket' && <MousePointer2 className="w-4 h-4" />}
                   </div>
                   <span className="text-xs font-bold capitalize">{mode === 'serial' ? 'USB' : mode}</span>
                 </button>
               ))}
             </div>
          </div>

          <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
            <div className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[var(--text-primary)] truncate">
                {isConnected ? 'Machine Connected' : 'Waiting for Connection...'}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] truncate">
                Status: <span className="font-mono text-[var(--accent-primary)] font-bold">{machine.status}</span>
              </p>
            </div>
            {isConnected && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
          </div>

          {(settings.connection.preferredMode === 'telnet' || settings.connection.preferredMode === 'websocket') && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <div className="col-span-2 space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase px-1">Host / IP Address</label>
                <input 
                  type="text"
                  value={settings.connection.preferredMode === 'telnet' ? settings.connection.wsHost : settings.connection.bridgeHost}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (settings.connection.preferredMode === 'telnet') {
                      updateSettings({ connection: { ...settings.connection, wsHost: val } });
                    } else {
                      updateSettings({ connection: { ...settings.connection, bridgeHost: val } });
                    }
                  }}
                  placeholder="e.g. 192.168.1.10"
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase px-1">Port</label>
                <input 
                  type="number"
                  value={settings.connection.preferredMode === 'telnet' ? settings.connection.wsPort : settings.connection.bridgePort}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (settings.connection.preferredMode === 'telnet') {
                      updateSettings({ connection: { ...settings.connection, wsPort: val } });
                    } else {
                      updateSettings({ connection: { ...settings.connection, bridgePort: val } });
                    }
                  }}
                  className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <p className="col-span-3 text-[10px] text-[var(--text-tertiary)] italic px-1">
                {settings.connection.preferredMode === 'telnet' 
                  ? 'Connect directly to the FluidNC board IP over Port 23.' 
                  : 'Connect to the Gtaurus Bridge server (default 9001).'}
              </p>
            </div>
          )}

          <button
            onClick={async () => {
              setIsTestingConnection(true);
              try {
                const { preferredMode, wsHost, wsPort, bridgeHost, bridgePort, serialPort, baudRate } = settings.connection;
                
                // Sync transport mode before testing
                if (preferredMode === 'websocket') {
                    transport.setMode('websocket');
                } else {
                    transport.setMode('native');
                }

                if (preferredMode === 'telnet') {
                  await transport.invoke('connect_telnet', { host: wsHost, port: wsPort });
                } else if (preferredMode === 'serial') {
                  await transport.invoke('connect_serial', { portName: serialPort, baudRate });
                } else {
                  console.log(`[Wizard] Testing WebSocket bridge at ${bridgeHost}:${bridgePort}...`);
                  const success = await transport.reconnect(bridgeHost, bridgePort);
                  if (success) {
                    console.log("[Wizard] WebSocket bridge connected successfully.");
                    // Kickstart status poll if bridge is up
                    transport.invoke('send_realtime', { byte: 0x3F }).catch(() => {});
                    transport.invoke('send_gcode', { cmd: '$I' }).catch(() => {});
                    // Also resume auto-connect on the server if it was suspended
                    transport.invoke('resume_auto_connect').catch(() => {});
                  } else {
                    console.warn("[Wizard] WebSocket bridge connection failed or timed out.");
                  }
                }
              } catch (err) {
                console.error("[Wizard] Connection test failed:", err);
              } finally {
                // We keep it as "testing" for a moment to show activity
                setTimeout(() => setIsTestingConnection(false), 1000);
              }
            }}
            disabled={isTestingConnection || (settings.connection.preferredMode === 'serial' && !settings.connection.serialPort)}
            className={`
              w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 cursor-pointer btn-3d
              ${isTestingConnection ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]' : 'bg-[var(--accent-primary)] text-white hover:opacity-90 shadow-[var(--accent-primary)]/20'}
            `}
          >
            {isTestingConnection ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent border-[var(--text-tertiary)] rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>
          
          {settings.connection.preferredMode === 'serial' && (
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-200">
                USB connection is currently unavailable. If you intend to use USB, please ensure your machine is plugged in and the drivers are installed.
              </p>
            </div>
          )}

          {!isConnected && settings.connection.preferredMode !== 'serial' && (
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-200">
                Please check your network settings and ensure the Gtaurus server is running. 
              </p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'physical',
      title: 'Machine Physical',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Bed Size X (mm)</label>
                 <input 
                  type="number"
                  value={settings.general.bedSizeX}
                  onChange={(e) => setGeneralSettings({ bedSizeX: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Bed Size Y (mm)</label>
                 <input 
                  type="number"
                  value={settings.general.bedSizeY}
                  onChange={(e) => setGeneralSettings({ bedSizeY: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Bed Size Z (mm)</label>
                 <input 
                  type="number"
                  value={settings.general.bedSizeZ}
                  onChange={(e) => setGeneralSettings({ bedSizeZ: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                 />
               </div>
            </div>
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Safe Height (Z mm)</label>
                 <input 
                  type="number"
                  value={settings.general.safeHeight}
                  onChange={(e) => setGeneralSettings({ safeHeight: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                 />
                 <p className="mt-1 text-[10px] text-[var(--text-tertiary)] italic">The height the tool retracts to between movements.</p>
               </div>
               <div className="p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-center gap-2">
                 <Wrench className="w-6 h-6 text-[var(--text-tertiary)]" />
                 <p className="text-[10px] text-[var(--text-secondary)]">These dimensions define your machine's workspace boundaries.</p>
               </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tooling',
      title: 'Tooling & Probe',
      component: (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-3 px-1">Probe Type</label>
            <div className="grid grid-cols-2 gap-3">
              {['Touch-Trigger Probe', 'Electronic Tool Setter', 'Manual Probe'].map((type) => (
                <button
                  key={type}
                  onClick={() => setProbeSettings({ probeType: type })}
                  className={`
                    p-3 rounded-xl border-2 text-left transition-all cursor-pointer
                    ${settings.probe.probeType === type 
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 text-[var(--accent-primary)]' 
                      : 'border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]'}
                  `}
                >
                  <span className="text-sm font-bold">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-6">
            <label className="block text-xs font-bold text-[var(--text-tertiary)] uppercase mb-3 px-1">Spindle RPM Limits</label>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                   <Thermometer className="w-3 h-3" /> Minimum
                 </div>
                 <div className="relative">
                    <input 
                      type="number"
                      value={settings.spindle.minRPM}
                      onChange={(e) => setSpindleSettings({ minRPM: Number(e.target.value) })}
                      className="w-full px-4 py-2 pr-12 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] font-bold">RPM</span>
                 </div>
               </div>
               <div className="space-y-2">
                 <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                   <Thermometer className="w-3 h-3 text-red-500" /> Maximum
                 </div>
                 <div className="relative">
                    <input 
                      type="number"
                      value={settings.spindle.maxRPM}
                      onChange={(e) => setSpindleSettings({ maxRPM: Number(e.target.value) })}
                      className="w-full px-4 py-2 pr-12 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] font-bold">RPM</span>
                 </div>
               </div>
            </div>
            <p className="mt-2 text-[10px] text-[var(--text-tertiary)] italic leading-tight">These limits prevent the spindle from running at unsafe speeds and define the PWM scaling.</p>
          </div>
        </div>
      )
    },
    {
      id: 'jog-x',
      title: 'X-Axis Direction',
      canProceed: axisChecks.x,
      component: (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500">
            <Info className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              <span className="font-bold underline">Requirement:</span> You must **Home** the machine before testing jog directions to ensure the machine knows its limits and coordinate system.
            </p>
          </div>

          {isAlarm && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 animate-pulse">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                        <p className="font-bold">MACHINE ALARMED</p>
                        <p className="text-xs opacity-80">Check for limit switches or E-Stop triggers.</p>
                    </div>
                </div>
                <button 
                    onClick={handleUnlock}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 font-bold text-sm shadow-lg shadow-red-500/20"
                >
                    <Unlock className="w-4 h-4" /> UNLOCK
                </button>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-200">
              Check if the X axis moves in the correct direction. 
              Positive (+) should move the tool to the <strong>RIGHT</strong>.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => handleJog('X', -1)}
                disabled={!isIdle}
                className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group btn-3d active:scale-95"
               >
                 <ArrowLeft className="w-8 h-8 group-hover:-translate-x-1 transition-transform" />
                 X -
               </button>
               
               <div className="flex flex-col gap-3">
                   <button 
                    onClick={handleHome}
                    disabled={!isIdle}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-center gap-2 font-bold text-xs btn-3d active:scale-95
                      ${hasHomed 
                        ? 'bg-green-600 shadow-lg shadow-green-500/20 text-white border-green-500/50' 
                        : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'}
                    `}
                  >
                    <Home className="w-4 h-4" /> {hasHomed ? 'HOMED' : 'HOME'}
                  </button>
                  <button 
                    onClick={handleStop}
                    className="p-3 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2 font-bold text-xs btn-3d active:scale-95"
                  >
                    <AlertTriangle className="w-4 h-4" /> STOP
                  </button>
               </div>

               <button 
                onClick={() => handleJog('X', 1)}
                disabled={!isIdle}
                className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group btn-3d active:scale-95"
               >
                 <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                 X +
               </button>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                    onClick={() => setGeneralSettings({ reverseX: !settings.general.reverseX })}
                    className={`
                        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${settings.general.reverseX 
                           ? 'border-amber-500/50 bg-amber-500/5 text-amber-500' 
                           : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${settings.general.reverseX ? 'rotate-180' : ''}`} />
                        <span className="text-sm font-bold">Reverse X Axis Direction</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.general.reverseX ? 'bg-amber-500' : 'bg-[var(--bg-tertiary)]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.general.reverseX ? 'translate-x-4' : ''}`} />
                    </div>
                </button>

                <div 
                    onClick={() => setAxisChecks(prev => ({ ...prev, x: !prev.x }))}
                    className={`
                    w-full flex items-center gap-3 px-6 py-4 rounded-2xl border cursor-pointer transition-all
                    ${axisChecks.x 
                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]'}
                    `}
                >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${axisChecks.x ? 'bg-green-500 border-green-500' : 'border-[var(--border-color)]'}`}>
                        {axisChecks.x && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold">The X axis moves correctly</span>
                </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'jog-y',
      title: 'Y-Axis Direction',
      canProceed: axisChecks.y,
      component: (
        <div className="space-y-6">
          {isAlarm && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 animate-pulse">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <p className="font-bold">ALARM ACTIVE</p>
                </div>
                <button 
                    onClick={handleUnlock}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 font-bold text-sm"
                >
                    <Unlock className="w-4 h-4" /> UNLOCK
                </button>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-200">
              Check if the Y axis moves in the correct direction. 
              Positive (+) should move the bed <strong>TOWARDS YOU</strong> (or tool <strong>BACK</strong>).
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-12">
               <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => handleJog('Y', 1)}
                    disabled={!isIdle}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group"
                  >
                    <ArrowUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                    Y +
                  </button>
                  <button 
                    onClick={() => handleJog('Y', -1)}
                    disabled={!isIdle}
                    className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group"
                  >
                    <ArrowDown className="w-8 h-8 group-hover:translate-y-1 transition-transform" />
                    Y -
                  </button>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleHome}
                    disabled={!isIdle}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 font-bold text-xs btn-3d active:scale-95
                      ${hasHomed 
                        ? 'bg-green-600 shadow-lg shadow-green-500/20 text-white border-green-500/50' 
                        : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'}
                    `}
                  >
                    <Home className="w-5 h-5" /> {hasHomed ? 'HOMED' : 'HOME'}
                  </button>
                  <button 
                    onClick={handleStop}
                    className="p-4 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 transition-colors flex flex-col items-center justify-center gap-1 font-bold text-xs btn-3d active:scale-95"
                  >
                    <AlertTriangle className="w-5 h-5" /> STOP
                  </button>
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                    onClick={() => setGeneralSettings({ reverseY: !settings.general.reverseY })}
                    className={`
                        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${settings.general.reverseY 
                           ? 'border-amber-500/50 bg-amber-500/5 text-amber-500' 
                           : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${settings.general.reverseY ? 'rotate-180' : ''}`} />
                        <span className="text-sm font-bold">Reverse Y Axis Direction</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.general.reverseY ? 'bg-amber-500' : 'bg-[var(--bg-tertiary)]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.general.reverseY ? 'translate-x-4' : ''}`} />
                    </div>
                </button>

                <div 
                    onClick={() => setAxisChecks(prev => ({ ...prev, y: !prev.y }))}
                    className={`
                    w-full flex items-center gap-3 px-6 py-4 rounded-2xl border cursor-pointer transition-all
                    ${axisChecks.y 
                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]'}
                    `}
                >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${axisChecks.y ? 'bg-green-500 border-green-500' : 'border-[var(--border-color)]'}`}>
                        {axisChecks.y && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold">The Y axis moves correctly</span>
                </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'jog-z',
      title: 'Z-Axis Direction',
      canProceed: axisChecks.z,
      component: (
        <div className="space-y-6">
          {isAlarm && (
            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/50 text-red-500 animate-pulse">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6" />
                    <p className="font-bold">ALARM ACTIVE</p>
                </div>
                <button 
                    onClick={handleUnlock}
                    className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2 font-bold text-sm"
                >
                    <Unlock className="w-4 h-4" /> UNLOCK
                </button>
            </div>
          )}

          <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-200">
              Check if the Z axis moves in the correct direction. 
              Positive (+) should move the tool <strong>UP</strong>.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex items-center gap-12">
               <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => handleJog('Z', 1)}
                    disabled={!isIdle}
                    className="flex items-center gap-3 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group"
                  >
                    <ArrowUp className="w-8 h-8 group-hover:-translate-y-1 transition-transform" />
                    Z + (UP)
                  </button>
                  <button 
                    onClick={() => handleJog('Z', -1)}
                    disabled={!isIdle}
                    className="flex items-center gap-3 p-6 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:border-blue-500 transition-all font-bold group"
                  >
                    <ArrowDown className="w-8 h-8 group-hover:translate-y-1 transition-transform" />
                    Z - (DOWN)
                  </button>
               </div>

               <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleHome}
                    disabled={!isIdle}
                    className={`p-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 font-bold text-xs btn-3d active:scale-95
                      ${hasHomed 
                        ? 'bg-green-600 shadow-lg shadow-green-500/20 text-white border-green-500/50' 
                        : 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30'}
                    `}
                  >
                    <Home className="w-5 h-5" /> {hasHomed ? 'HOMED' : 'HOME'}
                  </button>
                  <button 
                    onClick={handleStop}
                    className="p-4 rounded-xl bg-red-600/20 text-red-500 border border-red-500/30 hover:bg-red-600/30 transition-colors flex flex-col items-center justify-center gap-1 font-bold text-xs btn-3d active:scale-95"
                  >
                    <AlertTriangle className="w-5 h-5" /> STOP
                  </button>
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-sm">
                <button
                    onClick={() => setGeneralSettings({ reverseZ: !settings.general.reverseZ })}
                    className={`
                        w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all cursor-pointer
                        ${settings.general.reverseZ 
                           ? 'border-amber-500/50 bg-amber-500/5 text-amber-500' 
                           : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${settings.general.reverseZ ? 'rotate-180' : ''}`} />
                        <span className="text-sm font-bold">Reverse Z Axis Direction</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.general.reverseZ ? 'bg-amber-500' : 'bg-[var(--bg-tertiary)]'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${settings.general.reverseZ ? 'translate-x-4' : ''}`} />
                    </div>
                </button>

                <div 
                    onClick={() => setAxisChecks(prev => ({ ...prev, z: !prev.z }))}
                    className={`
                    w-full flex items-center gap-3 px-6 py-4 rounded-2xl border cursor-pointer transition-all
                    ${axisChecks.z 
                        ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                        : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)] text-[var(--text-secondary)]'}
                    `}
                >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${axisChecks.z ? 'bg-green-500 border-green-500' : 'border-[var(--border-color)]'}`}>
                        {axisChecks.z && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </div>
                    <span className="font-bold">The Z axis moves correctly</span>
                </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'homing',
      title: 'Homing',
      canProceed: hasHomed,
      component: (
        <div className="space-y-6 py-4">
          <div className="text-center space-y-2">
            <h4 className="text-lg font-bold text-[var(--text-primary)]">
              {hasHomed ? 'Homing Complete!' : 'Ready to Home'}
            </h4>
            <p className="text-sm text-[var(--text-secondary)]">
              {hasHomed 
                ? 'Your machine coordinate system is now established and verified.' 
                : 'Now we will home the machine to establish the coordinate system. This will move all axes to their limit switches.'}
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <button 
              onClick={() => {
                sendGcode('$H');
              }}
              disabled={!isIdle || machine.status === 'Home'}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-lg shadow-xl transition-all btn-3d active:scale-95
                ${hasHomed 
                    ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-500/20' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}
                ${(!isIdle || machine.status === 'Home') ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {hasHomed ? <CheckCircle2 className="w-6 h-6" /> : <Home className="w-6 h-6" />}
              {hasHomed ? 'HOMING SUCCESSFUL' : 'RUN HOMING CYCLE ($H)'}
            </button>
            
            {machine.status === 'Home' && (
                <div className="flex items-center gap-2 text-blue-400 animate-pulse font-bold text-sm">
                    <RotateCw className="w-4 h-4 animate-spin" />
                    HOMING IN PROGRESS...
                </div>
            )}

            {!hasHomed && machine.status !== 'Home' && (
                <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold text-center max-w-xs">
                  Ensure there are no obstructions on the machine bed before homing.
                </p>
            )}
          </div>
        </div>
      )
    },
    {
      id: 'finish',
      title: 'Complete',
      component: (
        <div className="flex flex-col items-center text-center space-y-6 py-8">
           <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-2">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Setup Complete!</h3>
            <p className="text-[var(--text-secondary)]">
              Your machine is connected, verified, and homed. 
              You are now ready to start carving.
            </p>
          </div>
          <div className="p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)] w-full text-left">
            <h4 className="text-xs font-bold text-[var(--text-tertiary)] uppercase mb-2">Next Steps</h4>
            <ul className="text-sm space-y-2 text-[var(--text-secondary)]">
              <li className="flex gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full mt-2" /> Load a G-code file in the File Manager</li>
              <li className="flex gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full mt-2" /> Set your Workspace Zero</li>
              <li className="flex gap-2"><div className="w-1 h-1 bg-blue-500 rounded-full mt-2" /> Use the Carve Wizard to start a job</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  return (
    <Wizard 
      isOpen={isOpen} 
      onClose={onClose} 
      steps={steps} 
      title="Machine Setup Wizard" 
    />
  );
}
