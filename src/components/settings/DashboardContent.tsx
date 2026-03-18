import { useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { ConfirmPopover } from '../ui/Popovers';

export function DashboardContent() {
  const { settings, setDashboardPanelEnabled, setDashboardPanelDimensions, resetDashboardLayout, moveDashboardPanelUp, moveDashboardPanelDown } =
    useSettingsStore();
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const resetLayoutButtonRef = useRef<HTMLButtonElement>(null);

  const sorted = [...settings.dashboardPanels].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 pb-1">
        <p className="text-xs text-[var(--text-tertiary)]">
          Enable panels and set initial and minimum panel dimensions for your Dashboard.
        </p>
        <button
          ref={resetLayoutButtonRef}
          type="button"
          onClick={() => setIsResetConfirmOpen(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          title="Clear saved dashboard arrangement and rebuild from current defaults"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Layout
        </button>
      </div>

      {sorted.map((panel, idx) => (
        <div
          key={panel.id}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-150 ${
            panel.enabled
              ? 'border-[var(--accent-primary)]/40 bg-[var(--bg-tertiary)]'
              : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
          }`}
        >
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => moveDashboardPanelUp(panel.id)}
              disabled={idx === 0}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label={`Move ${panel.label} up`}
            >
              <ChevronUp className="w-3 h-3 text-[var(--text-tertiary)]" />
            </button>
            <button
              onClick={() => moveDashboardPanelDown(panel.id)}
              disabled={idx === sorted.length - 1}
              className="p-0.5 rounded hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
              aria-label={`Move ${panel.label} down`}
            >
              <ChevronDown className="w-3 h-3 text-[var(--text-tertiary)]" />
            </button>
          </div>

          <span className="text-xs font-mono w-5 text-center text-[var(--text-tertiary)]">
            {idx + 1}
          </span>

          <span
            className={`flex-1 text-sm font-medium ${
              panel.enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            {panel.label}
          </span>

          <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity mr-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">W</span>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                className="w-14 px-1 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="Auto"
                value={panel.defaultWidth ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setDashboardPanelDimensions(panel.id, { defaultWidth: val });
                }}
                aria-label={`${panel.label} initial width`}
                title="Initial width (Auto = Dockview default)"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">H</span>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                className="w-14 px-1 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="Auto"
                value={panel.defaultHeight ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setDashboardPanelDimensions(panel.id, { defaultHeight: val });
                }}
                aria-label={`${panel.label} initial height`}
                title="Initial height (Auto = Dockview default)"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">MinW</span>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                className="w-14 px-1 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="Auto"
                value={panel.minWidth ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setDashboardPanelDimensions(panel.id, { minWidth: val });
                }}
                aria-label={`${panel.label} minimum width`}
                title="Minimum width"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">MinH</span>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                className="w-14 px-1 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="Auto"
                value={panel.minHeight ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setDashboardPanelDimensions(panel.id, { minHeight: val });
                }}
                aria-label={`${panel.label} minimum height`}
                title="Minimum height"
              />
            </div>
          </div>

          <button
            onClick={() => setDashboardPanelEnabled(panel.id, !panel.enabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer border ${
              panel.enabled
                ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-[var(--accent-primary)]/50'
            }`}
            aria-pressed={panel.enabled}
            aria-label={`${panel.enabled ? 'Disable' : 'Enable'} ${panel.label}`}
          >
            {panel.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {panel.enabled ? 'On' : 'Off'}
          </button>
        </div>
      ))}

      <ConfirmPopover
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetDashboardLayout}
        title="Reset Dashboard Layout?"
        message="This will clear the saved dashboard arrangement and rebuild the layout using your current panel order and default sizes."
        kind="warning"
        okLabel="Reset Layout"
        cancelLabel="Keep Current"
        triggerRef={resetLayoutButtonRef}
        position="bottom"
      />
    </div>
  );
}
