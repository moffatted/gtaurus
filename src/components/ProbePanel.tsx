import { Crosshair, Settings } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { BasicProbeUI } from './shared/BasicProbeUI';

export function ProbePanel() {
  const { settings } = useSettingsStore();
  const prb = settings.probe;

  return (
    <div className="h-full flex flex-col p-4 gap-6 select-none overflow-y-auto bg-[var(--bg-primary)]">
      
      {/* Header Info Banner */}
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border-color)] bg-gradient-to-r from-[var(--bg-tertiary)] to-[var(--bg-secondary)] shadow-inner">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
            <Crosshair className="w-5 h-5 text-[var(--accent-primary)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Active Profile</span>
            <span className="text-sm font-bold text-[var(--text-primary)]">{prb.probeType}</span>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors">
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1">
        <BasicProbeUI />
      </div>

      {/* Footer Meta */}
      <div className="flex items-center justify-between px-2 text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Hardware: Connected
        </div>
        <span>v1.0.4-basic</span>
      </div>
    </div>
  );
}
