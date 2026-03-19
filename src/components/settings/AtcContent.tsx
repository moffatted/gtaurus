import React from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export default function AtcContent() {
  const { settings, setAtcSettings } = useSettingsStore();
  const atc = settings.atc;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  return (
    <div className="space-y-8">
      
      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-[var(--text-primary)]">Enable ATC Logic</label>
          <p className="text-[10px] text-[var(--text-tertiary)]">Intercept M6 commands and show Tool Changer modal.</p>
        </div>
        <button
          onClick={() => setAtcSettings({ enabled: !atc.enabled })}
          className={`relative h-6 w-11 rounded-full transition-colors ${atc.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
        >
          <span className={`absolute top-1 left-1 h-4 w-4 bg-white rounded-full transition-transform ${atc.enabled ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 1. Change Position */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>1. Tool Change Position (MPos)</h4>
        <div className="grid grid-cols-3 gap-3">
          {(['x', 'y', 'z'] as const).map(axis => (
            <div key={axis}>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Machine {axis.toUpperCase()}</label>
              <input
                type="number"
                value={atc.toolChangeMpos[axis]}
                onChange={(e) => setAtcSettings({ toolChangeMpos: { ...atc.toolChangeMpos, [axis]: parseFloat(e.target.value) || 0 } })}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The machine coordinate where the spindle will move for a manual tool swap.
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 2. Probe Position */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. Probe Position (MPos)</h4>
        <div className="grid grid-cols-3 gap-3">
          {(['x', 'y', 'z'] as const).map(axis => (
            <div key={axis}>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Machine {axis.toUpperCase()}</label>
              <input
                type="number"
                value={atc.probeMpos[axis]}
                onChange={(e) => setAtcSettings({ probeMpos: { ...atc.probeMpos, [axis]: parseFloat(e.target.value) || 0 } })}
                className={inputCls}
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The machine coordinate of the Electronic Tool Setter (ETS) or probe plate.
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. Probe Parameters */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. Probe Parameters</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Plate Thickness (mm)</label>
            <input
              type="number"
              value={atc.probePlateThickness}
              onChange={(e) => setAtcSettings({ probePlateThickness: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rapid Z (MPos mm)</label>
            <input
              type="number"
              value={atc.probeRapidZ}
              onChange={(e) => setAtcSettings({ probeRapidZ: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Fast Feed (mm/min)</label>
            <input
              type="number"
              value={atc.probeFeedrate}
              onChange={(e) => setAtcSettings({ probeFeedrate: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Slow Feed (mm/min)</label>
            <input
              type="number"
              value={atc.slowProbeFeedrate}
              onChange={(e) => setAtcSettings({ slowProbeFeedrate: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Search Distance (mm)</label>
            <input
              type="number"
              value={atc.probeSearchDistance}
              onChange={(e) => setAtcSettings({ probeSearchDistance: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}