/**
 * @file ProbePanel.tsx
 * @purpose UI panel for managing probing operations and calibration.
 */
import { useState } from 'react';
import { Crosshair, Settings, HelpCircle, X, Info } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { BasicProbeUI } from './shared/BasicProbeUI';

export function ProbePanel() {
  const { settings } = useSettingsStore();
  const prb = settings.probe;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className="relative h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden min-w-[320px]">
      <div className="p-3 space-y-3 overflow-y-auto">
        
        {/* Header Info Banner - Compacted */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-secondary)] shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--accent-primary)]/10">
              <Crosshair className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Active Profile</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{prb.probeType}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => setShowHelp(true)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
              title="Probe Help & Calibration Guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
            <button className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors hidden">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <BasicProbeUI />

        {/* Footer Meta - Integrated into content flow */}
        <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between opacity-60">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold">Hardware Connected</span>
          </div>
          <span className="text-[9px] text-[var(--text-tertiary)] font-mono">v1.0.4</span>
        </div>
      </div>

      {/* Spacer to push everything up */}
      <div className="flex-1" />

      {/* Help Modal Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="p-3 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold">
              <Info className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm">Probe Calibration Guide</span>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed pb-8">
            <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-xl border border-[var(--border-color)]/50 shadow-sm">
              <h4 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                Z-Axis Touch Plate
              </h4>
              <p>
                <strong className="text-[var(--text-primary)]">Plate Thickness (Z-Offset):</strong> Measure from the bottom of the plate (where it rests on the wood) to the top flat surface where the bit touches.
              </p>
              <p className="mt-2 text-[10px] text-[var(--text-tertiary)] italic">
                Ex: If plate is 5mm thick, enter 5 in "Plate Thick".
              </p>
            </div>

            <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-xl border border-[var(--border-color)]/50 shadow-sm">
              <h4 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                3-Axis Corner Probe (Triquetra)
              </h4>
              <p className="mb-2">Enter these values in <strong className="text-[var(--accent-primary)]">Settings → Probe</strong>. The offsets require distance to the hole center.</p>
              
              <ol className="list-decimal list-outside space-y-2 ml-4 marker:text-[var(--text-tertiary)] marker:font-bold">
                <li className="pl-1">
                  <span className="text-[var(--text-primary)]">Hole Radius</span> = Hole Diameter ÷ 2<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Ex: 14.86 / 2 = 7.43mm</span>
                </li>
                <li className="pl-1">
                  Measure the <span className="text-[var(--text-primary)]">Wall Thickness</span> (from inner plate edge touching wood to nearest edge of hole).<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Ex: 2.63mm</span>
                </li>
                <li className="pl-1">
                  <span className="text-[var(--text-primary)]">X/Y Offset</span> = Wall Thickness + Hole Radius<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Ex: 2.63 + 7.43 = 10.06mm</span>
                </li>
              </ol>
            </div>
            
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-xl border border-yellow-500/20">
              <p className="text-[11px] font-medium leading-tight">
                <strong className="text-yellow-700 dark:text-yellow-300">Tip:</strong> After probing, command <code className="bg-yellow-500/20 px-1 py-0.5 rounded mr-0.5">X0 Y0</code>. The exact center of your bit should align perfectly over the corner of your stock to verify.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
