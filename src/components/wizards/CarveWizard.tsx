import { useState } from 'react';
import { Wizard, WizardStep } from '../ui/Wizard';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useMachineStore } from '../../stores/machineStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { useToolStore } from '../../stores/toolStore';
import { transport } from '../../services/transportService';
import { 
  CheckCircle2, AlertTriangle, Play, MousePointer2, 
  Box, FileCode, Target, 
  Info, Home 
} from 'lucide-react';

export function CarveWizard({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { machine } = useMachineStatusStore();
  const { settings } = useSettingsStore();
  const { hasHomed, hasZeroed } = useMachineStore();
  const { activeFileName, activeFilePath, bounds } = useGcodeStore();
  const { tools, activeToolId } = useToolStore();
  
  const [safetyChecks, setSafetyChecks] = useState({
    eyeProtection: false,
    secureWorkpiece: false,
    clearPath: false,
    vacuumOn: false
  });

  const isConnected = machine.status !== 'Disconnected' && machine.status !== 'Connecting';
  const isIdle = machine.status.startsWith('Idle');
  const activeTool = tools.find(t => t.id === activeToolId);

  const sendGcode = (cmd: string) => {
    transport.invoke('send_gcode', { cmd }).catch(console.error);
  };

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
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all active:scale-95"
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
      id: 'workpiece',
      title: 'Workpiece & File',
      canProceed: !!activeFileName,
      component: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
             <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500">
                <FileCode className="w-6 h-6" />
             </div>
             <div className="flex-1">
                <h4 className="font-bold text-[var(--text-primary)]">Active File</h4>
                <p className="text-sm text-[var(--text-secondary)] truncate max-w-[300px]">
                  {activeFileName || 'No file selected'}
                </p>
             </div>
             {activeFileName && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          </div>

          {!activeFileName && (
            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-200">
                Please close this wizard, load a G-code file in the File Manager, and click Carve again.
              </p>
            </div>
          )}

          {bounds && (
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
          )}
        </div>
      )
    },
    {
       id: 'tool-setup',
       title: 'Tool & Material',
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
             {activeTool && <CheckCircle2 className="w-6 h-6 text-green-500" />}
           </div>

           {!activeTool && (
             <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20 flex gap-3">
               <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
               <p className="text-sm text-amber-200">
                 Please ensure you have selected the correct tool in the Tool Library.
               </p>
             </div>
           )}

           <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
             <Info className="w-5 h-5 text-blue-500 shrink-0" />
             <p className="text-sm text-blue-200">
               Double check that the physical tool in the spindle matches your selection.
             </p>
           </div>
         </div>
       )
    },
    {
      id: 'zeroing',
      title: 'Workflow Zero',
      canProceed: hasZeroed,
      component: (
        <div className="space-y-6">
          <div className="flex items-center gap-4 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasZeroed ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Target className="w-6 h-6" />
             </div>
             <div className="flex-1">
                <h4 className="font-bold text-[var(--text-primary)]">Work Zero</h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {hasZeroed ? 'Work zero has been established.' : 'You must set the work zero point.'}
                </p>
             </div>
             {hasZeroed && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          </div>

          {!hasZeroed && (
             <div className="space-y-4">
                <p className="text-sm text-[var(--text-secondary)] text-center">
                  Jog the tool to the corner of your workpiece and click "Zero All" in the Controls Panel.
                </p>
                <div className="flex justify-center">
                   <div className="p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] flex items-center gap-3">
                      <MousePointer2 className="w-5 h-5 text-blue-500" />
                      <span className="text-xs font-bold text-[var(--text-primary)]">Use the Jog Controls to position the tool.</span>
                   </div>
                </div>
             </div>
          )}
          
          <div className="grid grid-cols-3 gap-2 py-2">
             {['X', 'Y', 'Z'].map(axis => (
               <div key={axis} className="p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] text-center">
                 <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">{axis} WCO</span>
                 <p className="font-mono text-sm text-[var(--accent-primary)] font-bold">
                   {(machine as any)[axis.toLowerCase()].wco.toFixed(2)}
                 </p>
               </div>
             ))}
          </div>
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
                flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all
                ${(safetyChecks as any)[check.id] 
                  ? 'bg-blue-500/10 border-blue-500/40 text-[var(--text-primary)] shadow-inner' 
                  : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
              `}
            >
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${ (safetyChecks as any)[check.id] ? 'bg-blue-600 border-blue-600' : 'border-[var(--border-color)]' }`}>
                { (safetyChecks as any)[check.id] && <CheckCircle2 className="w-4 h-4 text-white" /> }
              </div>
              <span className="font-bold text-sm tracking-tight">{check.label}</span>
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
            <Play className="w-10 h-10 fill-blue-600" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-[var(--text-primary)]">Commence Carving</h3>
            <p className="text-sm text-[var(--text-tertiary)] max-w-sm">
              All checks passed. Clicking "Start Carve" will send the G-code to the machine.
              <strong> Stay present throughout the entire operation.</strong>
            </p>
          </div>

          <div className="w-full grid grid-cols-2 gap-3 p-4 bg-[var(--bg-tertiary)] rounded-2xl border border-[var(--border-color)] text-left">
            <div className="space-y-1">
               <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)]">Estimated Time</span>
               <p className="text-sm font-bold text-[var(--text-primary)]">~12m 45s</p>
            </div>
            <div className="space-y-1">
               <span className="text-[9px] uppercase font-bold text-[var(--text-tertiary)]">Spindle Speed</span>
               <p className="text-sm font-bold text-[var(--text-primary)]">{settings.spindle.maxRPM} RPM</p>
            </div>
          </div>
        </div>
      ),
      onExit: () => {
        if (activeFilePath) {
          transport.invoke('stream_local_gcode', { path: activeFilePath }).catch(console.error);
        }
      }
    }
  ];

  return (
    <Wizard 
      isOpen={isOpen} 
      onClose={onClose} 
      steps={steps} 
      title="Carve Wizard" 
    />
  );
}
