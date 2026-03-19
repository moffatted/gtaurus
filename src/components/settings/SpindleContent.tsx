import { useSettingsStore } from '../../stores/settingsStore';

export function SpindleContent() {
  const { settings, setSpindleSettings } = useSettingsStore();
  const spd = settings.spindle;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  return (
    <div className="space-y-8">
      
      {/* 1. Dynamic Performance */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>1. Dynamic Performance</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Accel Time (s)</label>
            <input
              type="number"
              value={spd.accelTime}
              onChange={(e) => setSpindleSettings({ accelTime: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              step={0.1}
            />
          </div>
          <div>
            <label className={labelCls}>Decel Time (s)</label>
            <input
              type="number"
              value={spd.decelTime}
              onChange={(e) => setSpindleSettings({ decelTime: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              step={0.1}
            />
          </div>
          <div>
            <label className={labelCls}>Min RPM</label>
            <input
              type="number"
              value={spd.minRPM}
              onChange={(e) => setSpindleSettings({ minRPM: parseInt(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Max RPM</label>
            <input
              type="number"
              value={spd.maxRPM}
              onChange={(e) => setSpindleSettings({ maxRPM: parseInt(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 2. Speed Control & Signal Logic */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. Speed Control & Signal Logic</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>PWM Freq (kHz)</label>
            <input
              type="number"
              value={spd.pwmFrequency}
              onChange={(e) => setSpindleSettings({ pwmFrequency: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              step={0.1}
            />
          </div>
          <div>
            <label className={labelCls}>Pulley Ratio</label>
            <input
              type="number"
              value={spd.pulleyRatio}
              onChange={(e) => setSpindleSettings({ pulleyRatio: parseFloat(e.target.value) || 1 })}
              className={inputCls}
              step={0.01}
            />
          </div>
          <div>
            <label className={labelCls}>Max Voltage (V)</label>
            <input
              type="number"
              value={spd.scalingMaxVoltage}
              onChange={(e) => setSpindleSettings({ scalingMaxVoltage: parseFloat(e.target.value) || 10 })}
              className={inputCls}
              step={0.1}
            />
          </div>
          <div>
            <label className={labelCls}>Max Scaled RPM</label>
            <input
              type="number"
              value={spd.scalingMaxRPM}
              onChange={(e) => setSpindleSettings({ scalingMaxRPM: parseInt(e.target.value) || 24000 })}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. CSS & Limits */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. CSS & Limits</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Invert Direction (M3/M4)</span>
            <button
              onClick={() => setSpindleSettings({ invertDirection: !spd.invertDirection })}
              className={`relative h-5 w-9 rounded-full transition-colors ${spd.invertDirection ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${spd.invertDirection ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div>
            <label className={labelCls}>CSS Clamp Limit (RPM)</label>
            <input
              type="number"
              value={spd.cssLimitRPM}
              onChange={(e) => setSpindleSettings({ cssLimitRPM: parseInt(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 4. Thermal & Power */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>4. Thermal & Power</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Current Limit (A)</label>
            <input
              type="number"
              value={spd.currentLimit}
              onChange={(e) => setSpindleSettings({ currentLimit: parseFloat(e.target.value) || 0 })}
              className={inputCls}
              step={0.1}
            />
          </div>
          <div>
            <label className={labelCls}>Min Power (%)</label>
            <input
              type="number"
              value={spd.minPowerThreshold}
              onChange={(e) => setSpindleSettings({ minPowerThreshold: parseInt(e.target.value) || 0 })}
              className={inputCls}
              min={0}
              max={100}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Braking Method</label>
          <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
            {(['Coast', 'DC', 'Regen'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setSpindleSettings({ brakingMethod: m })}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  spd.brakingMethod === m
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 5. Interaction & Feedback */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>5. Interaction & Feedback</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Enable Warm-up Routine</span>
            <button
              onClick={() => setSpindleSettings({ warmupEnabled: !spd.warmupEnabled })}
              className={`relative h-5 w-9 rounded-full transition-colors ${spd.warmupEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${spd.warmupEnabled ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Orient Degree</label>
              <input
                type="number"
                value={spd.orientDegree}
                onChange={(e) => setSpindleSettings({ orientDegree: parseFloat(e.target.value) || 0 })}
                className={inputCls}
                step={0.1}
                min={0}
                max={359.9}
              />
            </div>
            <div>
              <label className={labelCls}>SSO Step (%)</label>
              <input
                type="number"
                value={spd.ssoStep}
                onChange={(e) => setSpindleSettings({ ssoStep: parseInt(e.target.value) || 10 })}
                className={inputCls}
                min={1}
                max={100}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}