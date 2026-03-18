import { Cpu, History } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';

export function GeneralContent() {
  const { settings, setGeneralSettings } = useSettingsStore();
  const gen = settings.general;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <div className="space-y-6">
      <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl relative overflow-hidden group">
        <div className="absolute top-[-20px] right-[-20px] text-orange-500/10 rotate-12 pointer-events-none transition-transform group-hover:scale-110">
          <Cpu className="w-32 h-32" />
        </div>
        <div className="flex items-start justify-between relative z-10">
          <div className="flex gap-3">
            <div className="mt-0.5 p-1.5 bg-orange-500/20 text-orange-400 rounded-lg shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <label className="text-sm font-bold text-orange-400">Enable Legacy GRBL 1.1 Mode</label>
              <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[280px] leading-relaxed">
                Check this if you are using a standard GRBL 1.1 board. Hides FluidNC-specific features (Config Editor, specific network settings) for full compatibility.
              </p>
            </div>
          </div>
          <button
            onClick={() => setGeneralSettings({ legacyGrblMode: !gen.legacyGrblMode })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              gen.legacyGrblMode ? 'bg-orange-500' : 'bg-[var(--bg-secondary)] border-[var(--border-color)] border'
            }`}
            role="switch"
            aria-checked={gen.legacyGrblMode}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                gen.legacyGrblMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <label className={labelCls}>Carving Units</label>
        <div className="grid grid-cols-2 gap-3">
          {(['mm', 'inches'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setGeneralSettings({ carvingUnits: u })}
              className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer capitalize ${
                gen.carvingUnits === u
                  ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] text-[var(--accent-primary)] shadow-sm'
                  : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <span className="text-sm font-medium">{u}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div>
        <label className={labelCls}>Firmware Fallback</label>
        <select
          value={gen.firmwareFallback}
          onChange={(e) => setGeneralSettings({ firmwareFallback: e.target.value as any })}
          className={inputCls + ' cursor-pointer'}
        >
          <option value="Grbl">Grbl</option>
          <option value="GrblHAL">GrblHAL</option>
        </select>
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          Select the controller firmware type if auto-detection fails.
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div>
        <label className={labelCls}>Safe Height (Z mm)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={gen.safeHeight}
            onChange={(e) => setGeneralSettings({ safeHeight: parseFloat(e.target.value) || 0 })}
            className={inputCls}
            min={0}
            step={0.5}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The distance the Z-axis retracts before making XY rapid moves.
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <label className={labelCls}>Machine Limits (Bed Size)</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">X Width (mm)</label>
            <input
              type="number"
              value={gen.bedSizeX}
              onChange={(e) => setGeneralSettings({ bedSizeX: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              min={1}
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Y Depth (mm)</label>
            <input
              type="number"
              value={gen.bedSizeY}
              onChange={(e) => setGeneralSettings({ bedSizeY: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              min={1}
            />
          </div>
          <div>
            <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Z Height (mm)</label>
            <input
              type="number"
              value={gen.bedSizeZ}
              onChange={(e) => setGeneralSettings({ bedSizeZ: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              min={1}
            />
          </div>
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          Define the physical travel limits of your machine. This used by the 3D Visualizer and for Soft Limit checks.
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <label className={labelCls}>Axis Endstop Position</label>
        <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed -mt-2">
          Set where each axis endstop is located. This determines the valid travel direction for jog safety limits.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { axis: 'X', key: 'homingPositionX' as const, val: gen.homingPositionX, minLabel: 'Left (0)', maxLabel: 'Right (0)' },
            { axis: 'Y', key: 'homingPositionY' as const, val: gen.homingPositionY, minLabel: 'Front (0)', maxLabel: 'Rear (0)' },
            { axis: 'Z', key: 'homingPositionZ' as const, val: gen.homingPositionZ, minLabel: 'Bottom (0)', maxLabel: 'Top (0)' },
          ]).map(({ axis, key, val, minLabel, maxLabel }) => (
            <div key={axis}>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">{axis} Endstop</label>
              <div className="flex gap-1 p-0.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                <button
                  onClick={() => setGeneralSettings({ [key]: 'min' })}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                    val === 'min'
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {minLabel}
                </button>
                <button
                  onClick={() => setGeneralSettings({ [key]: 'max' })}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                    val === 'max'
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {maxLabel}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
