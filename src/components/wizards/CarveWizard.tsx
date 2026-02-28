/**
 * @file CarveWizard.tsx
 * @purpose A step-by-step wizard to guide the user through machine homing, workpiece placement, tool selection, and zeroing before starting a carve.
 */
import { useState, useEffect } from 'react';
import { Wizard, WizardStep } from '../ui/Wizard';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useMachineStore } from '../../stores/machineStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { useWizardStore } from '../../stores/wizardStore';
import { useMeshStore } from '../../stores/meshStore';
import { transport } from '../../services/transportService';
import { BasicProbeUI } from '../shared/BasicProbeUI';
import { BasicAutolevelUI } from '../shared/BasicAutolevelUI';
import { 
  CheckCircle2, Play, 
  Box, FileCode, Target, AlignVerticalSpaceAround,
  Info, Home, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  CheckSquare, Wrench, XCircle, XOctagon, AlertCircle
} from 'lucide-react';
import { useToolStore, ToolType } from '../../stores/toolStore';

export function CarveWizard() {
  const { isCarveWizardOpen, closeCarveWizard } = useWizardStore();
  const { machine } = useMachineStatusStore();
  const { settings } = useSettingsStore();
  const { hasHomed, hasZeroed, setHasZeroed } = useMachineStore();
  const { activeFileName, activeFilePath, bounds } = useGcodeStore();
  const { tools, activeToolId, setActiveTool } = useToolStore();
  const { mapData, isProbing: isMeshProbing } = useMeshStore();
  
  // Wizard specific states
  const [hasPlacedWorkpiece, setHasPlacedWorkpiece] = useState(false);
  const [zeroMethod, setZeroMethod] = useState<'manual' | 'probe'>('manual');
  const [hasProbed, setHasProbed] = useState(false);
  const [wantsAutoLevel, setWantsAutoLevel] = useState(false);
  const [safetyChecks, setSafetyChecks] = useState({
    eyeProtection: false,
    secureWorkpiece: false,
    clearPath: false,
    vacuumOn: false
  });

  // Tool Quick Add state
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolDiameter, setNewToolDiameter] = useState(3.175);
  const [newToolNumber, setNewToolNumber] = useState(1);
  const [newToolType, setNewToolType] = useState<ToolType>('endmill');

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
      setHasProbed(false);
      setWantsAutoLevel(false);
      setSafetyChecks({ eyeProtection: false, secureWorkpiece: false, clearPath: false, vacuumOn: false });
      setIsAddingTool(false);
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
    
    sendGcode(`$J=G91 G21 X${dirX * stepSize} Y${dirY * stepSize} Z${dirZ * stepSize} F${feed}`);
  };

  const handleQuickAddTool = () => {
    const { addTool } = useToolStore.getState();
    addTool({
      name: newToolName || `Tool ${newToolNumber}`,
      diameter: newToolDiameter,
      number: newToolNumber,
      type: newToolType,
      fluteCount: 2,
      material: 'Carbide'
    });
    
    // We need to wait for the next render or find the tool by ID, but addTool doesn't return ID.
    // Actually addTool in store uses a randomUUID too, but let's just wait and pick the latest one or let the list update.
    setIsAddingTool(false);
    setNewToolName('');
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
          {/* Footer Branding/Info */}
          <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-tighter">Settings Synced</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${settings.stock.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
               <span className="text-[10px] text-[var(--text-secondary)] font-mono">{settings.stock.enabled ? 'VISIBLE' : 'HIDDEN'}</span>
            </div>
          </div>
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
            <div className="space-y-4 pt-2">
              <div className="space-y-3 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/30 shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <h5 className="text-[10px] uppercase font-bold text-blue-400 px-1 flex items-center gap-2">
                   <Target size={12} />
                   Actual Workpiece Dimensions (Editable)
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase mb-1 ml-1">Width (X)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.stock.width || ''}
                        onChange={(e) => useSettingsStore.getState().setStockSettings({ width: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase mb-1 ml-1">Depth (Y)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.stock.height || ''}
                        onChange={(e) => useSettingsStore.getState().setStockSettings({ height: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase mb-1 ml-1">Thick (Z)</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.stock.thickness || ''}
                        onChange={(e) => useSettingsStore.getState().setStockSettings({ thickness: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                        onFocus={(e) => e.target.select()}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors"
                      />
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
                    </div>
                  </div>
                </div>
                
                {(bounds.maxX - bounds.minX > settings.stock.width || bounds.maxY - bounds.minY > settings.stock.height) && (
                  <div className="flex gap-2 items-center text-[10px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                    <Info size={12} />
                    <span>Warning: G-code bounds exceed workpiece!</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <h5 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] px-1 flex items-center gap-2">
                   <Box size={12} />
                   G-Code Job Bounds (Fixed from File)
                </h5>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">X Width</span>
                    <span className="text-sm font-mono text-[var(--text-primary)] font-bold">{(bounds.maxX - bounds.minX).toFixed(2)} mm</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Y Depth</span>
                    <span className="text-sm font-mono text-[var(--text-primary)] font-bold">{(bounds.maxY - bounds.minY).toFixed(2)} mm</span>
                  </div>
                  <div className="p-3 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                    <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)] block mb-1">Z Height</span>
                    <span className="text-sm font-mono text-[var(--text-primary)] font-bold">{(bounds.maxZ - bounds.minZ).toFixed(2)} mm</span>
                  </div>
                </div>
              </div>
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

            {/* Tool Selection List */}
            <div className="space-y-3">
              <h4 className="font-bold text-[var(--text-primary)] text-sm ml-1 uppercase tracking-wider opacity-60">Selection Library</h4>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                {tools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`
                      flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left
                      ${activeToolId === tool.id 
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' 
                        : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]'}
                    `}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeToolId === tool.id ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'}`}>
                      <Box size={14} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className={`text-sm font-bold ${activeToolId === tool.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                          {tool.name}
                        </span>
                        <span className="text-[10px] font-mono opacity-50 uppercase">T{tool.number}</span>
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">
                        {tool.type} • {tool.diameter}mm
                      </div>
                    </div>
                    {activeToolId === tool.id && <CheckCircle2 size={16} className="text-[var(--accent-primary)]" />}
                  </button>
                ))}
              </div>

              {!isAddingTool ? (
                <button
                  onClick={() => setIsAddingTool(true)}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-dashed border-[var(--border-color)] rounded-xl text-xs font-bold transition-all group"
                >
                  <Wrench size={14} className="group-hover:rotate-12 transition-transform" />
                  QUICK ADD NEW BIT
                </button>
              ) : (
                <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--accent-primary)]/30 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-widest">New Bit Details</h5>
                    <button onClick={() => setIsAddingTool(false)} className="text-[var(--text-tertiary)] hover:text-white">
                      <XCircle size={14} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 space-y-1">
                       <span className="text-[9px] text-[var(--text-tertiary)] ml-1 uppercase">Name</span>
                       <input 
                         type="text" 
                         value={newToolName}
                         placeholder="e.g. 1/8 Downcut"
                         onChange={(e) => setNewToolName(e.target.value)}
                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent-primary)]"
                       />
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] text-[var(--text-tertiary)] ml-1 uppercase">Diameter (mm)</span>
                       <input 
                         type="number" 
                         value={newToolDiameter || ''}
                         onChange={(e) => setNewToolDiameter(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                         onFocus={(e) => e.target.select()}
                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[var(--accent-primary)]"
                       />
                    </div>
                    <div className="space-y-1">
                       <span className="text-[9px] text-[var(--text-tertiary)] ml-1 uppercase">Tool Number</span>
                       <input 
                         type="number" 
                         value={newToolNumber || ''}
                         onChange={(e) => setNewToolNumber(e.target.value === '' ? 0 : parseInt(e.target.value))}
                         onFocus={(e) => e.target.select()}
                         className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-white font-mono outline-none focus:border-[var(--accent-primary)]"
                       />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-[9px] text-[var(--text-tertiary)] ml-1 uppercase">Type</span>
                      <select 
                        value={newToolType}
                        onChange={(e) => setNewToolType(e.target.value as ToolType)}
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--accent-primary)]"
                      >
                        <option value="endmill">Endmill</option>
                        <option value="v-bit">V-Bit</option>
                        <option value="ballnose">Ballnose</option>
                        <option value="surfacing">Surfacing</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleQuickAddTool}
                    className="w-full py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:brightness-110 shadow-lg"
                  >
                    SAVE & ADD TO LIBRARY
                  </button>
                </div>
              )}
            </div>

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
                    Use Touch Probe
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
      canProceed: zeroMethod === 'manual' ? hasZeroed : hasProbed,
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
                <h3 className="text-xl font-bold text-[var(--text-primary)]">Run Probe Sequence</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                   Ensure the alligator clip is attached to the collet and the puck is positioned correctly. 
                </p>
                <div className="bg-[var(--bg-tertiary)]/30 p-4 rounded-xl border border-[var(--border-color)]">
                  <BasicProbeUI onComplete={() => {
                    setHasProbed(true);
                    setHasZeroed(true);
                  }} />
                </div>
                <div className="mt-6 flex flex-col items-center">
                  <div className={`px-8 py-2 rounded-full transition-all text-xs font-bold border flex items-center gap-2 ${
                      hasProbed 
                      ? "bg-green-500/10 text-green-500 border-green-500" 
                      : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-color)]"
                  }`}>
                      {hasProbed ? (
                        <>
                          <CheckCircle2 size={14} />
                          PROBE SUCCESSFUL
                        </>
                      ) : (
                        "Awaiting Probe Result..."
                      )}
                  </div>
                </div>
             </>
           )}
        </div>
      )
    },
    {
       id: 'auto-level',
       title: 'Surface Calibration',
       canProceed: !wantsAutoLevel || (mapData !== null && !isMeshProbing),
       component: (
        <div className="space-y-6 text-center py-4">
           <h3 className="text-xl font-bold text-[var(--text-primary)]">Auto Level Mesh</h3>
           <p className="text-sm text-[var(--text-secondary)] mb-6">
              Auto leveling probes a grid across the workpiece to compensate for uneven surfaces (e.g., for PCB milling).
           </p>

           {!wantsAutoLevel ? (
             <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                <button
                   onClick={() => setWantsAutoLevel(true)}
                   className="p-8 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-blue-500 hover:bg-blue-500/5 group font-bold transition-all text-[var(--text-primary)] flex flex-col items-center gap-3"
                >
                  <AlignVerticalSpaceAround className="w-10 h-10 text-blue-500 group-hover:scale-110 transition-transform" />
                  <div className="text-center">
                    <span className="block text-base">Yes, map surface</span>
                    <span className="block text-[10px] text-[var(--text-tertiary)] font-normal mt-1">Recommended for PCBs</span>
                  </div>
                </button>
                
                <button
                   onClick={() => setWantsAutoLevel(false)}
                   className="p-8 rounded-2xl border-2 border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-blue-500 hover:bg-blue-500/5 group font-bold transition-all text-[var(--text-secondary)] flex flex-col items-center gap-3"
                >
                  <XCircle className="w-10 h-10 text-[var(--text-tertiary)] group-hover:text-amber-500 transition-colors" />
                  <div className="text-center">
                    <span className="block text-base">No, skip this</span>
                    <span className="block text-[10px] text-[var(--text-tertiary)] font-normal mt-1">Click "Next" after selecting this</span>
                  </div>
                </button>
             </div>
           ) : (
             <div className="space-y-6">
                <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl p-6 shadow-xl relative">
                  <div className="flex items-center gap-3 mb-6 p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Box className="w-5 h-5 text-blue-500" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-blue-500 uppercase">Workpiece Dimensions</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">Verify dimensions match your stock for accurate mapping.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col text-left">
                      <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Width (X)</label>
                      <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg p-2 border border-[var(--border-color)]">
                        <input 
                          type="number"
                          value={settings.stock.width || ''}
                          onChange={(e) => useSettingsStore.getState().setStockSettings({ width: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                          onFocus={(e) => e.target.select()}
                          className="bg-transparent text-sm font-mono w-full focus:outline-none"
                        />
                        <span className="text-[10px] text-[var(--text-tertiary)]">mm</span>
                      </div>
                    </div>
                    <div className="flex flex-col text-left">
                      <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1">Height (Y)</label>
                      <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] rounded-lg p-2 border border-[var(--border-color)]">
                        <input 
                          type="number"
                          value={settings.stock.height || ''}
                          onChange={(e) => useSettingsStore.getState().setStockSettings({ height: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                          onFocus={(e) => e.target.select()}
                          className="bg-transparent text-sm font-mono w-full focus:outline-none"
                        />
                        <span className="text-[10px] text-[var(--text-tertiary)]">mm</span>
                      </div>
                    </div>
                  </div>

                  <BasicAutolevelUI />
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setWantsAutoLevel(false)}
                    className="flex items-center justify-center gap-2 mx-auto px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold hover:bg-red-500/20 transition-all uppercase tracking-widest"
                  >
                    <XCircle size={14} />
                    Cancel and skip calibration
                  </button>
                </div>
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
      canProceed: machine.status === 'Idle' || machine.status === 'Alarm', // Basic readiness check
      component: (
        <div className="flex flex-col items-center text-center space-y-6 py-4">
           {machine.status === 'Disconnected' ? (
             <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl flex flex-col items-center gap-4">
               <XOctagon className="w-12 h-12 text-red-500" />
               <div>
                 <h3 className="text-lg font-bold text-red-500">Machine Disconnected</h3>
                 <p className="text-xs text-[var(--text-tertiary)] mt-1">Please connect to your machine before starting the carve.</p>
               </div>
             </div>
           ) : (
             <>
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
            </>
           )}

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
          
          {machine.status === 'Alarm' && (
             <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 w-full text-left">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase">Note: Machine is in ALARM state. Resetting before start...</span>
             </div>
          )}
        </div>
      ),
      onExit: async () => {
        if (!activeFilePath) return;

        try {
          // If in alarm, try to clear it first automatically
          if (machine.status === 'Alarm') {
            await transport.invoke('send_gcode', { cmd: '$X' });
          }

          const result = await transport.invoke<string>('stream_local_gcode', { path: activeFilePath });
          console.log("[CarveWizard] Stream result:", result);
          
          // Provide a tiny visual feedback before closing
          // Since we don't have a toast system, we'll use a local state or just close
          // but we'll log it for debugging and use alert if it fails.
        } catch (err) {
          console.error("[CarveWizard] Failed to start carve:", err);
          alert(`Failed to start carve: ${err}`);
        } finally {
          closeCarveWizard();
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
