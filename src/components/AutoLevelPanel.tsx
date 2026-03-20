/**
 * @file AutoLevelPanel.tsx
 * @purpose Specialized UI panel for managing surface calibration and auto-leveling probes.
 */
import { Crosshair } from 'lucide-react';
import { BasicAutolevelUI } from './shared/BasicAutolevelUI';
import { HelpIconButton } from './Help/HelpIconButton';

export function AutoLevelPanel() {
  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden min-w-0">
      <div className="flex items-center justify-between gap-2 p-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <Crosshair size={18} className="text-[var(--accent-primary)]" />
          <h2 className="font-semibold text-[var(--text-primary)] tracking-wide uppercase">Surface Calibration</h2>
        </div>
        <HelpIconButton
          topicId="dashboard-panels"
          tooltip="Auto-Level Help"
          className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
          iconClassName="w-4 h-4"
        />
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <BasicAutolevelUI />
      </div>
    </div>
  );
}
