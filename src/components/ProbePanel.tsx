/**
 * @file ProbePanel.tsx
 * @purpose UI panel for managing probing operations and calibration.
 */
import { Crosshair, Settings } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { BasicProbeUI } from './shared/BasicProbeUI';

export function ProbePanel() {
  const { settings } = useSettingsStore();
  const prb = settings.probe;

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden min-w-[320px]">
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
          <button className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors">
            <Settings className="w-3.5 h-3.5" />
          </button>
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
    </div>
  );
}
