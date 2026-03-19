import { useSettingsStore } from '../../stores/settingsStore';

export function VisualizerContent() {
  const { settings, setShowAutolevelMesh, setDashboardPanelEnabled } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Show Autolevel Mesh</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Display the generated autolevel heightmap overlay.
          </p>
        </div>
        <button
          onClick={() => setShowAutolevelMesh(!settings.showAutolevelMesh)}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.showAutolevelMesh ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={settings.showAutolevelMesh}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.showAutolevelMesh ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Workpiece Visualization</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Configure material stock and visualization settings.
          </p>
        </div>
        <button
          onClick={() => setDashboardPanelEnabled('workpiece', true)}
          className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] rounded-lg border border-[var(--border-color)] transition-colors"
        >
          Open Panel
        </button>
      </div>
    </div>
  );
}
