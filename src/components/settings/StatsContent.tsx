import { useSettingsStore } from '../../stores/settingsStore';

export function StatsContent() {
  const { settings, setStatsSettings } = useSettingsStore();
  const sts = settings.stats;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const subHeaderCls = 'text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1';

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Show Statistics Button</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Display the machine statistics button in the top menu.
          </p>
        </div>
        <button
          onClick={() => setStatsSettings({ enabled: !sts.enabled })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            sts.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={sts.enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              sts.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls}>1. Data Collection</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Log Telemetry & Jobs</span>
            <button
              onClick={() => setStatsSettings({ enableLogging: !sts.enableLogging })}
              className={`relative h-5 w-9 rounded-full transition-colors ${sts.enableLogging ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${sts.enableLogging ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div>
            <label className={labelCls}>Minimum Job Duration (s)</label>
            <input
              type="number"
              value={sts.minJobDurationSec}
              onChange={(e) => setStatsSettings({ minJobDurationSec: parseInt(e.target.value) || 0 })}
              className={inputCls}
              min={1}
            />
            <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic">
              Jobs shorter than this will not be saved to statistics.
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. OEE Performance Targets</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Availability Target (%)</label>
            <input
              type="number"
              value={Math.round(sts.targetAvailability * 100)}
              onChange={(e) => setStatsSettings({ targetAvailability: (parseInt(e.target.value) || 0) / 100 })}
              className={inputCls}
              min={1}
              max={100}
            />
          </div>
          <div>
            <label className={labelCls}>Performance Target (%)</label>
            <input
              type="number"
              value={Math.round(sts.targetPerformance * 100)}
              onChange={(e) => setStatsSettings({ targetPerformance: (parseInt(e.target.value) || 0) / 100 })}
              className={inputCls}
              min={1}
              max={100}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Quality Target (Yield %)</label>
            <input
              type="number"
              value={Math.round(sts.targetQuality * 100)}
              onChange={(e) => setStatsSettings({ targetQuality: (parseInt(e.target.value) || 0) / 100 })}
              className={inputCls}
              min={1}
              max={100}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>3. Accumulated Statistics</h4>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all machine statistics? This cannot be undone.')) {
                setStatsSettings({
                  totalJobs: 0,
                  completedJobs: 0,
                  failedJobs: 0,
                  totalMachineOnTimeSec: 0,
                  totalSpindleTimeSec: 0,
                  totalCuttingTimeSec: 0,
                  totalRapidTimeSec: 0,
                  machineUtilizationRate: 0,
                  averageCycleTimeSec: 0,
                });
              }
            }}
            className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors"
          >
            Reset All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Total Jobs</span>
            <div className="text-lg font-mono text-[var(--text-primary)]">{sts.totalJobs}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Success Rate</span>
            <div className="text-lg font-mono text-[var(--text-primary)]">
              {sts.totalJobs > 0 ? Math.round((sts.completedJobs / sts.totalJobs) * 100) : 0}%
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Spindle Hours</span>
            <div className="text-lg font-mono text-[var(--text-primary)]">{formatTime(sts.totalSpindleTimeSec)}</div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Cutting Time</span>
            <div className="text-lg font-mono text-[var(--text-primary)]">{formatTime(sts.totalCuttingTimeSec)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
