import { useSettingsStore } from '../../stores/settingsStore';

export function ProbeContent() {
  const { settings, setProbeSettings } = useSettingsStore();
  const prb = settings.probe;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  return (
    <div className="space-y-8">
      
      {/* 0. Probe Type */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>Probe Type</h4>
        <div className="space-y-3">
            <div>
              <label className={labelCls}>Selected Probe Profile</label>
              <select
                value={prb.probeType}
                onChange={(e) => setProbeSettings({ probeType: e.target.value })}
                className={inputCls}
              >
                <optgroup label="Workpiece Probes (Spindle-Mounted)">
                  <option value="Touch-Trigger Probe">Touch-Trigger Probe / Kinematic</option>
                  <option value="Scanning Probe">Analog Scanning Probe</option>
                  <option value="3D Sensor">3D Sensor (Mechanical/Analog)</option>
                </optgroup>
                <optgroup label="Tool Setters (Table-Mounted)">
                  <option value="Contact Tool Setter">Contact Tool Setter / Auto Tool Zero</option>
                  <option value="Non-Contact Tool Setter">Laser Tool Setter / NC Probe</option>
                </optgroup>
                <optgroup label="Touch Plates (Zeroing Plates)">
                  <option value="Z-Zero Plate">Z-Zero Plate / Tool Setting Block</option>
                  <option value="3-Axis Finder">3-Axis / Corner Finding Touch Plate</option>
                </optgroup>
              </select>
              <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic">
                Select the physical type of probe you are using to configure predefined interaction behaviors based on standard operating logic.
              </p>
            </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 1. Movement & Feedrate */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>1. Movement & Feedrate</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fast Feed (mm/min)</label>
            <input
              type="number"
              value={prb.fastFeedrate}
              onChange={(e) => setProbeSettings({ fastFeedrate: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Slow Feed (mm/min)</label>
            <input
              type="number"
              value={prb.slowFeedrate}
              onChange={(e) => setProbeSettings({ slowFeedrate: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Retract (mm)</label>
            <input
              type="number"
              value={prb.retractDistance}
              onChange={(e) => setProbeSettings({ retractDistance: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Max Travel (mm)</label>
            <input
              type="number"
              value={prb.maxTravel}
              onChange={(e) => setProbeSettings({ maxTravel: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>

        <div className="pt-2">
          <label className={labelCls}>3-Axis Corner Probe (Touch Plate) Calibration</label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">X Wall Thickness (mm)</label>
              <input
                type="number"
                value={prb.xWallThickness ?? ''}
                onChange={(e) => setProbeSettings({ xWallThickness: Number(e.target.value) })}
                className={inputCls}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Y Wall Thickness (mm)</label>
              <input
                type="number"
                value={prb.yWallThickness ?? ''}
                onChange={(e) => setProbeSettings({ yWallThickness: Number(e.target.value) })}
                className={inputCls}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">Hole Diameter (mm)</label>
              <input
                type="number"
                value={prb.holeDiameter ?? ''}
                onChange={(e) => setProbeSettings({ holeDiameter: Number(e.target.value) })}
                className={inputCls}
                step={0.1}
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-tertiary)] uppercase block mb-1">XY Drop Below Z (mm)</label>
              <input
                type="number"
                value={prb.xyDropDistance ?? ''}
                onChange={(e) => setProbeSettings({ xyDropDistance: Number(e.target.value) })}
                className={inputCls}
                step={0.1}
              />
              <p className="mt-1 text-[9px] text-[var(--text-tertiary)] leading-tight italic">
                Auto-limited by plate Z-Offset for safety.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 2. Physical & Transmission */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. Physical & Transmission</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Signal State</label>
            <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
              {(['NO', 'NC'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setProbeSettings({ signalState: s })}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    prb.signalState === s
                      ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls}>Switch-Off</label>
            <select
              value={prb.switchOffMethod}
              onChange={(e) => setProbeSettings({ switchOffMethod: e.target.value as any })}
              className={inputCls}
            >
              <option value="Timer">Timer</option>
              <option value="Optical">Optical</option>
              <option value="Move">Physical Move</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Trigger Filter (ms)</label>
            <input
              type="number"
              value={prb.triggerFilter}
              onChange={(e) => setProbeSettings({ triggerFilter: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Signal Power (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={prb.transmissionPower}
              onChange={(e) => setProbeSettings({ transmissionPower: parseInt(e.target.value) })}
              className="w-full accent-[var(--accent-primary)] mt-1.5"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. Calibration Data */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. Calibration Data</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Ball Diameter (mm)</label>
            <input
              type="number"
              value={prb.stylusDiameter}
              onChange={(e) => setProbeSettings({ stylusDiameter: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Z-Offset (mm)</label>
            <input
              type="number"
              value={prb.zOffset}
              onChange={(e) => setProbeSettings({ zOffset: parseFloat(e.target.value) || 0 })}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className={labelCls}>Deflection Offsets (mm)</label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-6 text-[var(--text-tertiary)] font-mono">X+</span>
              <input
                type="number"
                value={prb.deflectionOffsets.xPos}
                onChange={(e) => setProbeSettings({ deflectionOffsets: { ...prb.deflectionOffsets, xPos: parseFloat(e.target.value) || 0 } })}
                className={inputCls + " text-center px-1"}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-6 text-[var(--text-tertiary)] font-mono">X-</span>
              <input
                type="number"
                value={prb.deflectionOffsets.xNeg}
                onChange={(e) => setProbeSettings({ deflectionOffsets: { ...prb.deflectionOffsets, xNeg: parseFloat(e.target.value) || 0 } })}
                className={inputCls + " text-center px-1"}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-6 text-[var(--text-tertiary)] font-mono">Y+</span>
              <input
                type="number"
                value={prb.deflectionOffsets.yPos}
                onChange={(e) => setProbeSettings({ deflectionOffsets: { ...prb.deflectionOffsets, yPos: parseFloat(e.target.value) || 0 } })}
                className={inputCls + " text-center px-1"}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] w-6 text-[var(--text-tertiary)] font-mono">Y-</span>
              <input
                type="number"
                value={prb.deflectionOffsets.yNeg}
                onChange={(e) => setProbeSettings({ deflectionOffsets: { ...prb.deflectionOffsets, yNeg: parseFloat(e.target.value) || 0 } })}
                className={inputCls + " text-center px-1"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 4. Safety & Interaction */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>4. Safety & Interaction</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Protected Positioning</label>
              <p className="text-[10px] text-[var(--text-tertiary)]">Stop if probe triggers during rapid moves.</p>
            </div>
            <button
              onClick={() => setProbeSettings({ protectedPositioning: !prb.protectedPositioning })}
              className={`relative h-5 w-9 rounded-full transition-colors ${prb.protectedPositioning ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${prb.protectedPositioning ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-[var(--text-primary)]">Emergency Hard Stop</label>
              <p className="text-[10px] text-[var(--text-tertiary)]">Immediate E-Stop vs decelerated stop.</p>
            </div>
            <button
              onClick={() => setProbeSettings({ hardStop: !prb.hardStop })}
              className={`relative h-5 w-9 rounded-full transition-colors ${prb.hardStop ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${prb.hardStop ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 5. Cycle Logic */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>5. Cycle Logic</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-primary)]">Auto-Update Work Offset</span>
            <button
              onClick={() => setProbeSettings({ wcoUpdate: !prb.wcoUpdate })}
              className={`relative h-5 w-9 rounded-full transition-colors ${prb.wcoUpdate ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${prb.wcoUpdate ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Part Tolerance (mm)</label>
              <input
                type="number"
                value={prb.toleranceCheck}
                onChange={(e) => setProbeSettings({ toleranceCheck: parseFloat(e.target.value) || 0 })}
                className={inputCls}
                step={0.01}
              />
            </div>
            <div>
              <label className={labelCls}>Tool Breakage (mm)</label>
              <input
                type="number"
                value={prb.toolBreakageTolerance}
                onChange={(e) => setProbeSettings({ toolBreakageTolerance: parseFloat(e.target.value) || 0 })}
                className={inputCls}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 6. Touch Plate Visualization */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>6. Touch Plate Visualization</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-[var(--text-primary)]">Show in Bed Visualizer</label>
            <button
              onClick={() => setProbeSettings({ showTouchPlateVisual: !prb.showTouchPlateVisual })}
              className={`relative h-5 w-9 rounded-full transition-colors ${prb.showTouchPlateVisual ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${prb.showTouchPlateVisual ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          {prb.showTouchPlateVisual && (
            <div className="grid grid-cols-2 gap-4 mt-3 p-3 rounded-lg bg-[var(--bg-tertiary)]/30 border border-[var(--border-color)]">
              <div>
                <label className={labelCls}>Touch Plate Length (mm)</label>
                <input
                  type="number"
                  value={prb.touchPlateLength ?? 30}
                  onChange={(e) => setProbeSettings({ touchPlateLength: parseFloat(e.target.value) || 30 })}
                  className={inputCls}
                  step={0.5}
                  min={1}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">X dimension</p>
              </div>
              <div>
                <label className={labelCls}>Touch Plate Width (mm)</label>
                <input
                  type="number"
                  value={prb.touchPlateWidth ?? 30}
                  onChange={(e) => setProbeSettings({ touchPlateWidth: parseFloat(e.target.value) || 30 })}
                  className={inputCls}
                  step={0.5}
                  min={1}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">Y dimension</p>
              </div>
              <div>
                <label className={labelCls}>Side Wrap Depth (mm)</label>
                <input
                  type="number"
                  value={prb.touchPlateWrapDepth ?? 5}
                  onChange={(e) => setProbeSettings({ touchPlateWrapDepth: parseFloat(e.target.value) || 5 })}
                  className={inputCls}
                  step={0.5}
                  min={0.5}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">How far the side legs wrap under the stock faces</p>
              </div>
              <div>
                <label className={labelCls}>Side Wrap Height (mm)</label>
                <input
                  type="number"
                  value={prb.touchPlateWrapHeight ?? 5}
                  onChange={(e) => setProbeSettings({ touchPlateWrapHeight: parseFloat(e.target.value) || 5 })}
                  className={inputCls}
                  step={0.5}
                  min={0.5}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)]">Vertical leg height down the stock side</p>
              </div>
            </div>
          )}
          <p className="text-[10px] text-[var(--text-tertiary)] italic">
            The touch plate height is automatically set to the Z-Offset (Plate Thickness) value. Adjust dimensions to match your aluminum touch plate.
          </p>
        </div>
      </div>
    </div>
  );
}