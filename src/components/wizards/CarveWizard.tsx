import { useState, useEffect } from 'react';
import { Wizard, WizardStep } from '../ui/Wizard';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useMachineStore } from '../../stores/machineStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { useToolStore } from '../../stores/toolStore';
import { useWizardStore } from '../../stores/wizardStore';
import { transport } from '../../services/transportService';
import { 
  CheckCircle2, AlertTriangle, Play, 
  Box, FileCode, Target, AlignVerticalSpaceAround,
  Info, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  CheckSquare
} from 'lucide-react';

export function CarveWizard() {
  const { isCarveWizardOpen, closeCarveWizard } = useWizardStore();
  const { machine } = useMachineStatusStore();
  const { settings } = useSettingsStore();
  const { hasHomed, hasZeroed, setHasZeroed } = useMachineStore();
  const { activeFileName, activeFilePath, bounds } = useGcodeStore();
  const { tools, activeToolId } = useToolStore();
  
  // Wizard specific states
  const [hasPlacedWorkpiece, setHasPlacedWorkpiece] = useState(false);
  const [zeroMethod, setZeroMethod] = useState<'manual' | 'probe'>('manual');
  const [hasMockProbed, setHasMockProbed] = useState(false);
  const [wantsAutoLevel, setWantsAutoLevel] = useState(false);
  const [hasMockAutoLeveled, setHasMockAutoLeveled] = useState(false);
  const [safetyChecks, setSafetyChecks] = useState({
    eyeProtection: false,
    secureWorkpiece: false,
    clearPath: false,
    vacuumOn: false
  });

  // Local files state for selection
  const [localFiles, setLocalFiles] = useState<{name: string, size: number, modified: number}[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Fetch local files when wizard opens
  useEffect(() => {
    if (isCarveWizardOpen && settings.gcodeStoragePath) {
      setIsLoadingFiles(true);
      setFileError(null);
      transport.invoke<{name: string, size: number, modified: number}[]>('list_local_files', { path: settings.gcodeStoragePath })
        .then(list => setLocalFiles(list.sort((a, b) => b.modified - a.modified)))
        .catch(() => setFileError('Failed to load files from storage.'))
        .finally(() => setIsLoadingFiles(false));
    }
  }, [isCarveWizardOpen, settings.gcodeStoragePath]);

  const handleSelectFile = async (filename: string) => {
    try {
      const fullPath = `${settings.gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      const content = await transport.invoke<string>('read_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      useGcodeStore.getState().setGcode(content, filename, fullPath);
    } catch (e) {
      console.error("Failed to read file", e);
    }
  };

  // Reset local state when wizard opens
  useEffect(() => {
    if (isCarveWizardOpen) {
      setHasPlacedWorkpiece(false);
      setHasMockProbed(false);
      setHasMockAutoLeveled(false);
      setWantsAutoLevel(false);
      setSafetyChecks({ eyeProtection: false, secureWorkpiece: false, clearPath: false, vacuumOn: false });
    }
  }, [isCarveWizardOpen]);

  const isConnected = machine.status !== 'Disconnected' && machine.status !== 'Connecting';
  const isIdle = machine.status.startsWith('Idle');
  const activeTool = tools.find(t => t.id === activeToolId);

  const sendGcode = (cmd: string) => {
    transport.invoke('send_gcode', { cmd }).catch(console.error);
  };

  const handleJog = (x: number, y: number, z: number) => {
    if (!isIdle) return;
    const stepSize = settings.general.carvingUnits === 'mm' ? 10 : 0.5;
    const feed = 1000;
    
    // respect reversal settings
    let dirX = x; let dirY = y; let dirZ = z;
    if (settings.general.reverseX) dirX *= -1;
    if (settings.general.reverseY) dirY *= -1;
    if (settings.general.reverseZ) dirZ *= -1;

    let cmd = `$J=G91 G21 F${feed}`;
    if (x !== 0) cmd += ` X${(dirX * stepSize).toFixed(3)}`;
    if (y !== 0) cmd += ` Y${(dirY * stepSize).toFixed(3)}`;
    if (z !== 0) cmd += ` Z${(dirZ * stepSize).toFixed(3)}`;
    sendGcode(cmd);
  };

  const AxisCard = ({ label, mpos, wco }: { label: string, mpos: number, wco: number }) => {
    const wpos = mpos - wco;
    return (
      <div className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] text-center flex-1">
        <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">{label} WCO</span>
        <p className="font-mono text-sm text-[var(--text-primary)] font-bold">{wpos.toFixed(2)}</p>
      </div>
    );
  };

  const jogBtnClass = "w-full h-full hover:bg-[var(--accent-primary)]/20 active:bg-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)] transition-all duration-100 flex items-center justify-center p-3 rounded-xl";

  const steps: WizardStep[] = [
    {
      id: 'pre-flight',
      title: 'Power & Homing',
      canProceed: hasHomed,
      component: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasHomed ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Home className="w-6 h-6" />
             </div>
             <div className="flex-1">
                <h4 className="font-bold text-[var(--text-primary)]">Homing Status</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {hasHomed ? 'Machine is homed and ready.' : 'Machine must be homed before carving.'}
                </p>
             </div>
             {hasHomed && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          </div>

          {!hasHomed && (
            <div className="flex flex-col items-center gap-4 py-4">
              <button 
                onClick={() => sendGcode('$H')}
                disabled={!isIdle}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-95 btn-3d"
              >
                <Home className="w-5 h-5" />
                Run Homing Cycle ($H)
              </button>
            </div>
          )}

          <div className="p-4 bg-[var(--bg-tertiary)]/30 rounded-xl border border-[var(--border-color)] space-y-2">
            <h5 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Machine Status</h5>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">Connection</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {isConnected ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-[var(--text-secondary)]">State</span>
              <span className="text-xs font-mono font-bold text-[var(--accent-primary)]">{machine.status}</span>
            </div>
          </div>
        </div>
      )
    },
    {
       id: 'placement',
       title: 'Workpiece Placement',
       canProceed: hasPlacedWorkpiece,
       component: (
         <div className="space-y-6 text-center">
           <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mx-auto mb-4">
              <CheckSquare className="w-10 h-10" />
           </div>
           <h3 className="text-xl font-bold text-[var(--text-primary)]">Secure Your Workpiece</h3>
           <p className="text-[var(--text-secondary)]">
             Place your workpiece on the bed securely. Use clamps, tape, or appropriate fixturing to ensure it will not move during the carve.
           </p>
           
           <div className="pt-8">
             <button
               onClick={() => setHasPlacedWorkpiece(true)}
               className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 transition-all font-bold ${
                 hasPlacedWorkpiece 
                 ? 'border-green-500 bg-green-500/10 text-green-500' 
                 : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-blue-500 text-[var(--text-primary)]'
               }`}
             >
               <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${hasPlacedWorkpiece ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border-color)]'}`}>
                 {hasPlacedWorkpiece && <CheckCircle2 className="w-4 h-4" />}
               </div>
               I have secured the workpiece
             </button>
           </div>
         </div>
       )
    },
    {
      id: 'file',
      title: 'File & Dimensions',
      canProceed: !!activeFileName,
      component: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
             <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <FileCode className="w-6 h-6" />
             </div>
             <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[var(--text-primary)]">Active File</h4>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {activeFileName || 'No file selected'}
                </p>
             </div>
             {activeFileName && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
          </div>

          {/* File Selection List */}
          <div className="space-y-3">
            <h4 className="font-bold text-[var(--text-primary)]">Select a File to Carve</h4>
            {isLoadingFiles ? (
              <p className="text-sm text-[var(--text-tertiary)]">Loading files...</p>
            ) : fileError ? (
              <p className="text-sm text-red-500">{fileError}</p>
            ) : localFiles.length === 0 ? (
              <p className="text-sm text-[var(--text-tertiary)]">No files uploaded yet. Please add files via the File Manager.</p>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)] bg-[var(--bg-secondary)] custom-scrollbar">
                {localFiles.map(f => (
                  <button
                    key={f.name}
                    onClick={() => handleSelectFile(f.name)}
                    className={`w-full text-left px-4 py-3 text-sm flex justify-between items-center transition-colors hover:bg-[var(--bg-tertiary)] ${activeFileName === f.name ? 'bg-blue-500/10 text-blue-500 font-bold border-l-4 border-l-blue-500' : 'text-[var(--text-secondary)]'}`}
                  >
                    <span className="truncate pr-4">{f.name}</span>
                    <span className="text-xs opacity-60 shrink-0 font-mono">{Math.round(f.size / 1024)} KB</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {bounds && activeFileName && (
            <div className="space-y-3">
              <h5 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] px-1">G-Code Job Bounds</h5>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">X Width</span>
                  <span className="text-sm font-mono text-[var(--text-primary)]">{(bounds.maxX - bounds.minX).toFixed(2)} mm</span>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Y Depth</span>
                  <span className="text-sm font-mono text-[var(--text-primary)]">{(bounds.maxY - bounds.minY).toFixed(2)} mm</span>
                </div>
                <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                  <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Z Height</span>
                  <span className="text-sm font-mono text-[var(--text-primary)]">{(bounds.maxZ - bounds.minZ).toFixed(2)} mm</span>
                </div>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] italic pt-2">
                Verify these dimensions fit within your actual secured workpiece.
              </p>
            </div>
          )}
        </div>
      )
    },
    {
       id: 'tool-setup',
       title: 'Tooling',
       canProceed: !!activeTool,
       component: (
         <div className="space-y-6">
           <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
             <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500">
                <Box className="w-6 h-6" />
             </div>
             <div className="flex-1">
                <h4 className="font-bold text-[var(--text-primary)]">Active Tool</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {activeTool ? `T${activeTool.number}: ${activeTool.name}` : 'No tool selected'}
                </p>
             </div>
             {activeTool && <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />}
           </div>

           {!activeTool && (
             <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
               <p className="text-sm text-amber-200">
                 Please close this wizard and ensure you have selected the correct tool in the Tool Library.
               </p>
             </div>
           )}

           <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
             <Info className="w-5 h-5 text-blue-500 shrink-0" />
             <p className="text-sm text-blue-200">
               Double check that the physical tool secured in the spindle collet exactly matches your selection above.
             </p>
           </div>
         </div>
       )
    },
    {
       id: 'zero-method',
       title: 'Zero Method',
       component: (
         <div className="space-y-6">
           <p className="text-sm text-[var(--text-secondary)] mb-4">
             How would you like to set the Workspace Zero (origin) for this carve?
           </p>

           <div className="grid grid-cols-2 gap-4">
             <button
               onClick={() => setZeroMethod('manual')}
               className={`
                 p-6 rounded-xl border-2 text-left transition-all flex flex-col gap-3
                 ${zeroMethod === 'manual' 
                   ? 'border-blue-500 bg-blue-500/10' 
                   : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]'}
               `}
             >
               <div className="flex items-center justify-between">
                 <Target className={`w-8 h-8 ${zeroMethod === 'manual' ? 'text-blue-500' : 'text-[var(--text-tertiary)]'}`} />
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${zeroMethod === 'manual' ? 'border-blue-500' : 'border-[var(--border-color)]'}`}>
                   {zeroMethod === 'manual' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                 </div>
               </div>
               <div>
                  <h4 className={`font-bold ${zeroMethod === 'manual' ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>Manual Zero</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Jog the tool to the visual zero point and set it manually.</p>
               </div>
             </button>

             <button
               // TODO: Once Probe is fully implemented, remove mock status
               onClick={() => setZeroMethod('probe')}
               className={`
                 p-6 rounded-xl border-2 text-left transition-all flex flex-col gap-3
                 ${zeroMethod === 'probe' 
                   ? 'border-purple-500 bg-purple-500/10' 
                   : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]'}
               `}
             >
               <div className="flex items-center justify-between">
                 <AlignVerticalSpaceAround className={`w-8 h-8 ${zeroMethod === 'probe' ? 'text-purple-500' : 'text-[var(--text-tertiary)]'}`} />
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${zeroMethod === 'probe' ? 'border-purple-500' : 'border-[var(--border-color)]'}`}>
                   {zeroMethod === 'probe' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
                 </div>
               </div>
               <div>
                  <h4 className={`font-bold flex items-center gap-2 ${zeroMethod === 'probe' ? 'text-purple-500' : 'text-[var(--text-primary)]'}`}>
                    Use Touch Probe <span className="text-[9px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">MOCKED</span>
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Use a conductivity probe to precisely set the Z height.</p>
               </div>
             </button>
           </div>
         </div>
       )
    },
    {
      id: 'jog-to-zero',
      title: 'Position Tool',
      component: (
        <div className="space-y-6">
           <p className="text-sm text-[var(--text-secondary)]">
             {zeroMethod === 'manual' 
                ? 'Carefully jog the tool until the tip is exactly touching the zero origin on the workpiece.'
                : 'Jog the tool so it is directly above the touch probe puck, ready to lower.'}
           </p>

           <div className="flex items-center justify-center gap-8 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
              {/* XY Pad */}
              <div className="grid grid-cols-3 gap-2 w-48 h-48">
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(-1, 1, 0)}><ArrowUpLeft className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(0, 1, 0)}><ArrowUp className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(1, 1, 0)}><ArrowUpRight className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(-1, 0, 0)}><ArrowLeft className="w-6 h-6" /></button>
                  <div className="flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[var(--border-color)] opacity-20" /></div>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(1, 0, 0)}><ArrowRight className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(-1, -1, 0)}><ArrowDownLeft className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(0, -1, 0)}><ArrowDown className="w-6 h-6" /></button>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => handleJog(1, -1, 0)}><ArrowDownRight className="w-6 h-6" /></button>
              </div>

              {/* Z Pad */}
              <div className="flex flex-col gap-2 w-16 h-48 justify-between p-2 rounded-xl">
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)] flex-1`} onClick={() => handleJog(0, 0, 1)}><ArrowUp className="w-6 h-6 cursor-pointer" /></button>
                  <div className="text-xs font-bold text-center text-[var(--accent-primary)] uppercase py-1">Z</div>
                  <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)] flex-1`} onClick={() => handleJog(0, 0, -1)}><ArrowDown className="w-6 h-6 cursor-pointer" /></button>
              </div>
           </div>

           <div className="flex gap-4">
              <AxisCard label="X" mpos={machine.x.mpos} wco={machine.x.wco} />
              <AxisCard label="Y" mpos={machine.y.mpos} wco={machine.y.wco} />
              <AxisCard label="Z" mpos={machine.z.mpos} wco={machine.z.wco} />
           </div>
        </div>
      )
    },
    {
      id: 'perform-zero',
      title: 'Set Zero',
      canProceed: zeroMethod === 'manual' ? hasZeroed : hasMockProbed,
      component: (
        <div className="space-y-6 text-center py-4">
           {zeroMethod === 'manual' ? (
             <>
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                  <Target className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Execute Manual Zero</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-8">
                  Click the button below to set the current position as X0 Y0 Z0.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                      onClick={() => { sendGcode('G10 L20 P1 X0 Y0 Z0'); setHasZeroed(true); }}
                      disabled={!isIdle}
                      className={`py-4 rounded-xl transition-all font-bold text-lg flex items-center justify-center gap-3 border-2 ${
                          hasZeroed 
                          ? "bg-green-500/10 text-green-500 border-green-500" 
                          : "bg-blue-600 hover:bg-blue-500 text-white border-blue-600 active:scale-95"
                      }`}
                  >
                      {hasZeroed ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                      {hasZeroed ? "Zero Coordinate Set" : "Zero All (XYZ)"}
                  </button>
                  <div className="flex gap-4 w-full pt-4">
                      <AxisCard label="X" mpos={machine.x.mpos} wco={machine.x.wco} />
                      <AxisCard label="Y" mpos={machine.y.mpos} wco={machine.y.wco} />
                      <AxisCard label="Z" mpos={machine.z.mpos} wco={machine.z.wco} />
                  </div>
                </div>
             </>
           ) : (
             <>
                <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 mx-auto mb-4">
                  <AlignVerticalSpaceAround className="w-10 h-10" />
               </div>
               <h3 className="text-xl font-bold text-[var(--text-primary)]">Run Probe Sequence</h3>
               <p className="text-sm text-[var(--text-secondary)] mb-8">
                  Ensure the alligator clip is attached to the collet and the puck is positioned beneath the endmill. 
               </p>
               <button 
                    // TODO: Replace with actual probing macro when backend supports it
                    onClick={() => {
                      setHasMockProbed(true);
                      setHasZeroed(true);
                    }}
                    className={`w-full py-4 rounded-xl transition-all font-bold text-lg flex items-center justify-center gap-3 border-2 ${
                        hasMockProbed 
                        ? "bg-green-500/10 text-green-500 border-green-500" 
                        : "bg-purple-600 hover:bg-purple-500 text-white border-purple-600 active:scale-95"
                    }`}
                >
                    {hasMockProbed ? <CheckCircle2 className="w-6 h-6" /> : <AlignVerticalSpaceAround className="w-6 h-6" />}
                    {hasMockProbed ? "Probing Complete" : "Execute Probe Macro (MOCK)"}
                </button>
             </>
           )}
        </div>
      )
    },
    {
      id: 'auto-level',
      title: 'Auto Level',
      canProceed: wantsAutoLevel ? hasMockAutoLeveled : true,
      component: (
        <div className="space-y-6 text-center py-4">
           <h3 className="text-xl font-bold text-[var(--text-primary)]">Auto Level Mesh</h3>
           <p className="text-sm text-[var(--text-secondary)] mb-8">
              Auto leveling probes a grid across the workpiece to compensate for uneven surfaces (e.g., for PCB milling).
           </p>

           {!wantsAutoLevel ? (
             <div className="flex flex-col gap-4">
                <button
                   onClick={() => setWantsAutoLevel(true)}
                   className="p-4 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-blue-500 font-bold transition-all text-[var(--text-primary)] flex-1"
                >
                  Yes, map surface
                </button>
                <div className="flex flex-col gap-2">
                  <div className="p-4 rounded-xl border border-[var(--border-color)] border-dashed bg-[var(--bg-tertiary)] flex flex-col justify-center items-center">
                    <p className="text-sm font-bold text-[var(--text-secondary)]">Skip this step?</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">Click "Next" to skip auto leveling</p>
                  </div>
                </div>
             </div>
           ) : (
             <div className="space-y-4 border border-[var(--border-color)] rounded-2xl p-6 bg-[var(--bg-secondary)]">
                <h4 className="font-bold text-[var(--text-primary)]">Auto-Level Configuration</h4>
                <div className="p-4 bg-amber-500/10 text-amber-500 rounded-xl text-xs border border-amber-500/20 text-left">
                  <strong>Notice:</strong> Mesh generation & application logic is pending implementation. This button triggers a mock completion.
                </div>
                <button 
                    onClick={() => setHasMockAutoLeveled(true)}
                    className={`w-full py-4 rounded-xl transition-all font-bold text-lg flex items-center justify-center gap-3 border-2 ${
                        hasMockAutoLeveled 
                        ? "bg-green-500/10 text-green-500 border-green-500" 
                        : "bg-blue-600 hover:bg-blue-500 text-white border-blue-600 active:scale-95"
                    }`}
                >
                    {hasMockAutoLeveled ? <CheckCircle2 className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                    {hasMockAutoLeveled ? "Mesh Generated" : "Run Auto-Level Sequence (MOCK)"}
                </button>
                <button 
                  onClick={() => { setWantsAutoLevel(false); setHasMockAutoLeveled(false); }}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:underline mt-4 transition-colors"
                >
                  Cancel auto-leveling
                </button>
             </div>
           )}
        </div>
      )
    },
    {
      id: 'safety',
      title: 'Safety Checks',
      canProceed: Object.values(safetyChecks).every(v => v),
      component: (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Final Safety Confirmation</h4>
          
          {[
            { id: 'eyeProtection', label: 'I am wearing eye protection' },
            { id: 'secureWorkpiece', label: 'Workpiece is securely clamped' },
            { id: 'clearPath', label: 'The tool path is clear of obstructions' },
            { id: 'vacuumOn', label: 'Dust collection/Coolant is ready' }
          ].map(check => (
            <div 
              key={check.id}
              onClick={() => setSafetyChecks(prev => ({ ...prev, [check.id]: !(prev as any)[check.id] }))}
              className={`
                flex items-center gap-4 p-4 rounded-2xl border flex-1 cursor-pointer transition-all
                ${(safetyChecks as any)[check.id] 
                  ? 'bg-blue-500/10 border-blue-500/40 text-[var(--text-primary)] shadow-inner' 
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
              `}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${ (safetyChecks as any)[check.id] ? 'bg-blue-600 border-blue-600' : 'border-[var(--border-color)]' }`}>
                { (safetyChecks as any)[check.id] && <CheckCircle2 className="w-4 h-4 text-white" /> }
              </div>
              <span className="font-bold tracking-tight">{check.label}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'confirm',
      title: 'Ready to Carve',
      component: (
        <div className="flex flex-col items-center text-center space-y-6 py-4">
           <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
            <Play className="w-10 h-10 fill-blue-600 translate-x-1" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Commence Carving</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-sm">
              All checks passed. Clicking "Start Carve" will send the G-code to the machine and close this wizard.
              <strong> Stay present throughout the entire operation.</strong>
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] text-left">
            <div className="space-y-1">
               <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)]">Estimated File</span>
               <p className="text-sm font-bold text-[var(--text-primary)] truncate" title={activeFileName || ''}>{activeFileName}</p>
            </div>
            <div className="space-y-1">
               <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)]">Target RPM</span>
               <p className="text-sm font-bold text-[var(--text-primary)]">{settings.spindle.maxRPM} RPM</p>
            </div>
          </div>
        </div>
      ),
      onExit: () => {
        closeCarveWizard();
        if (activeFilePath) {
          transport.invoke('stream_local_gcode', { path: activeFilePath }).catch(console.error);
        }
      }
    }
  ];

  return (
    <Wizard 
      isOpen={isCarveWizardOpen} 
      onClose={closeCarveWizard} 
      steps={steps} 
      title="Carve Wizard" 
      finalLabel="Start Carve"
      heroImage="/carve_hero.png"
    />
  );
}
