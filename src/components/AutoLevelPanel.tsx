/**
 * @file AutoLevelPanel.tsx
 * @purpose Specialized UI panel for managing surface calibration and auto-leveling probes.
 */
import { Crosshair } from 'lucide-react';
import { BasicAutolevelUI } from './shared/BasicAutolevelUI';

export function AutoLevelPanel() {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden min-w-[360px]">
      <div className="flex items-center gap-2 p-3 border-b border-[var(--border-color)]">
        <Crosshair size={18} className="text-[var(--accent-primary)]" />
        <h2 className="font-semibold text-[var(--text-primary)] tracking-wide uppercase">Surface Calibration</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <BasicAutolevelUI />
      </div>
    </div>
  );
}
