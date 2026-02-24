import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  Settings, X, Sun, Moon, Search, Bot,
  Palette, SlidersHorizontal, Cable, Crosshair,
  Cpu, Box, History, BarChart2, Wrench, RotateCw, LayoutDashboard,
  ChevronDown, LayoutGrid, ChevronUp, Eye, EyeOff,
  Wifi, UsbIcon, RefreshCw, Power, Activity,
  Folder, HardDrive, Plus, Trash, Edit, Save, FileCode,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useThemeStore } from '../stores/themeStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { isTauriApp } from '../utils/platform';
import { transport } from '../services/transportService';

// ─── SettingsSection ─────────────────────────────────────────────────────────

interface SettingsSectionProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
}

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 cursor-pointer transition-colors duration-150 gap-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent-primary)] flex-shrink-0">{icon}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? '1000px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 py-4 bg-[var(--bg-secondary)]">
          {children ?? (
            <p className="text-sm text-[var(--text-tertiary)] italic">
              No settings configured yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Theme section ───────────────────────────────────────────────────────────

function ThemeContent() {
  const { theme, setTheme } = useThemeStore();
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['light', 'dark'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer capitalize ${
            theme === t
              ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] text-[var(--accent-primary)] shadow-sm'
              : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
          }`}
          aria-label={`${t} theme`}
          aria-pressed={theme === t}
        >
          {t === 'light' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="text-sm font-medium">{t}</span>
        </button>
      ))}
    </div>
  );
}

// ─── General section ─────────────────────────────────────────────────────────

function GeneralContent() {
  const { settings, setGeneralSettings } = useSettingsStore();
  const gen = settings.general;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <div className="space-y-6">
      {/* Carving Units */}
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

      {/* Firmware Fallback */}
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

      {/* Safe Height */}
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

      {/* Machine Limits (Bed Size) */}
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
    </div>
  );
}

// ─── Probe section ───────────────────────────────────────────────────────────

function ProbeContent() {
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
    </div>
  );
}

// ─── Spindle section ─────────────────────────────────────────────────────────

function SpindleContent() {
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

// ─── Dashboard section ───────────────────────────────────────────────────────

function DashboardContent() {
  const { settings, setDashboardPanelEnabled, setDashboardPanelDimensions, moveDashboardPanelUp, moveDashboardPanelDown } =
    useSettingsStore();

  const sorted = [...settings.dashboardPanels].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-tertiary)] pb-1">
        Enable panels and set their default width/height on your Dashboard.
      </p>

      {sorted.map((panel, idx) => (
        <div
          key={panel.id}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors duration-150 ${
            panel.enabled
              ? 'border-[var(--accent-primary)]/40 bg-[var(--bg-tertiary)]'
              : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
          }`}
        >
          {/* Order controls */}
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

          {/* Order badge */}
          <span className="text-xs font-mono w-5 text-center text-[var(--text-tertiary)]">
            {idx + 1}
          </span>

          {/* Label */}
          <span
            className={`flex-1 text-sm font-medium ${
              panel.enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'
            }`}
          >
            {panel.label}
          </span>

          {/* Width / Height Inputs */}
          <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity mr-1">
            <div className="flex items-center gap-1">
              <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">W</span>
              <input
                type="number"
                min="100"
                max="2000"
                step="10"
                className="w-14 px-1 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="Auto"
                value={panel.defaultWidth || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDashboardPanelDimensions(panel.id, { defaultWidth: val ? parseInt(val, 10) : undefined });
                }}
                disabled={!panel.enabled}
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
                value={panel.defaultHeight || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setDashboardPanelDimensions(panel.id, { defaultHeight: val ? parseInt(val, 10) : undefined });
                }}
                disabled={!panel.enabled}
              />
            </div>
          </div>

          {/* Enable/disable toggle */}
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
    </div>
  );
}

// ─── Connection section ───────────────────────────────────────────────────────

function ConnectionContent() {
  const { settings, updateSettings } = useSettingsStore();
  const conn = settings.connection;

  const [wsHost, setWsHost]     = useState(conn.wsHost);
  const [wsPort, setWsPort]     = useState(String(conn.wsPort));
  const [bridgeHost, setBridgeHost] = useState(conn.bridgeHost || window.location.hostname);
  const [bridgePort, setBridgePort] = useState(String(conn.bridgePort || 9001));
  const [pollInterval, setPollInterval] = useState(String(conn.statusPollInterval));
  const [serialPort, setSP]     = useState(conn.serialPort);
  const [baudRate, setBaud]     = useState(String(conn.baudRate));
  const [ports, setPorts]       = useState<string[]>([]);
  const [loadingPorts, setLP]   = useState(false);
  const [status, setStatus]     = useState('Disconnected');
  const [disconnecting, setDis] = useState(false);

  const refreshStatus = async () => {
    try {
      const s = await transport.invoke<string>('get_connection_status');
      setStatus(s);
    } catch {
      setStatus('Disconnected');
    }
  };

  const handleDisconnect = async () => {
    setDis(true);
    try {
      await transport.invoke('disconnect');
      setStatus('Disconnected');
    } catch {
      // ignore
    } finally {
      setDis(false);
    }
  };

  const fetchPorts = async () => {
    setLP(true);
    try {
      const list = await transport.invoke<string[]>('list_serial_ports');
      setPorts(list);
    } catch {
      setPorts([]);
    } finally {
      setLP(false);
    }
  };

  useEffect(() => {
    void fetchPorts();
    void refreshStatus();
    const id = setInterval(() => void refreshStatus(), 2000);
    return () => clearInterval(id);
  }, []);

  const saveWifi = () => {
    const port = parseInt(wsPort, 10);
    updateSettings({
      connection: { ...conn, wsHost: wsHost.trim(), wsPort: isNaN(port) ? 23 : port },
    });
  };

  const saveBridge = () => {
    const port = parseInt(bridgePort, 10);
    updateSettings({
      connection: { ...conn, bridgeHost: bridgeHost.trim(), bridgePort: isNaN(port) ? 9001 : port },
    });
  };

  const saveSerial = (newPort?: string, newBaud?: string) => {
    const baud = parseInt(newBaud ?? baudRate, 10);
    updateSettings({
      connection: { ...conn, serialPort: newPort ?? serialPort, baudRate: isNaN(baud) ? 115200 : baud },
    });
  };

  const savePoll = () => {
    let val = parseInt(pollInterval, 10);
    if (isNaN(val) || val < 1000) val = 2000;
    updateSettings({
      connection: { ...conn, statusPollInterval: val },
    });
    setPollInterval(String(val));
  };

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <div className="space-y-5">

      {/* Status + Disconnect */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full flex-shrink-0 ${
              status === 'Disconnected' ? 'bg-[var(--text-tertiary)]' : 'bg-green-500'
            }`}
          />
          <span className="text-xs text-[var(--text-secondary)] truncate">{status}</span>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting || status === 'Disconnected'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all duration-150 cursor-pointer
            disabled:opacity-40 disabled:cursor-not-allowed
            border-red-500/50 text-red-400 hover:bg-red-500/10 hover:border-red-400 active:bg-red-500/20"
          aria-label="Disconnect from controller"
        >
          <Power className="w-3 h-3" />
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>

      {/* Standalone Bridge (Agent) Settings */}
      {!isTauriApp() && (
        <div className="space-y-3 p-3 rounded-lg border border-blue-500/20 bg-blue-500/5">
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold uppercase tracking-wide">Standalone Server (Bridge)</span>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed">
                When running in a browser, Gtaurus connects to a <strong>gtaurus_server</strong> instance to access your machine.
            </p>
            <div className="flex gap-2">
                <div className="flex-1">
                    <label className={labelCls}>Bridge Host</label>
                    <input
                        type="text"
                        value={bridgeHost}
                        onChange={(e) => setBridgeHost(e.target.value)}
                        onBlur={saveBridge}
                        className={inputCls}
                    />
                </div>
                <div className="w-20">
                    <label className={labelCls}>Port</label>
                    <input
                        type="number"
                        value={bridgePort}
                        onChange={(e) => setBridgePort(e.target.value)}
                        onBlur={saveBridge}
                        className={inputCls}
                    />
                </div>
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] italic">
                Connects to the gtaurus_server bridge for browser-to-hardware communication.
            </p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-primary)]">
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">WiFi (Telnet)</span>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className={labelCls}>Host</label>
            <input
              type="text"
              value={wsHost}
              onChange={(e) => setWsHost(e.target.value)}
              onBlur={saveWifi}
              placeholder="192.168.68.61"
              className={inputCls}
            />
          </div>
          <div className="w-20">
            <label className={labelCls}>Port</label>
            <input
              type="number"
              value={wsPort}
              onChange={(e) => setWsPort(e.target.value)}
              onBlur={saveWifi}
              min={1}
              max={65535}
              className={inputCls}
            />
          </div>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          Connects to <span className="font-mono">{wsHost.trim() || '…'}:{wsPort || '23'}</span> via TCP
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* Serial */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-primary)]">
          <UsbIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Serial / USB</span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls} style={{ marginBottom: 0 }}>Port</label>
            <button
              onClick={fetchPorts}
              disabled={loadingPorts}
              className="flex items-center gap-1 text-xs text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh port list"
            >
              <RefreshCw className={`w-3 h-3 ${loadingPorts ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {ports.length > 0 ? (
            <select
              value={serialPort}
              onChange={(e) => { setSP(e.target.value); saveSerial(e.target.value); }}
              className={inputCls + ' cursor-pointer'}
            >
              <option value="">— select port —</option>
              {ports.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-[var(--text-tertiary)] italic">
              {loadingPorts ? 'Scanning…' : 'No serial ports found. Connect device and refresh.'}
            </p>
          )}
        </div>

        <div>
          <label className={labelCls}>Baud Rate</label>
          <select
            value={baudRate}
            onChange={(e) => { setBaud(e.target.value); saveSerial(undefined, e.target.value); }}
            className={inputCls + ' cursor-pointer'}
          >
            {[9600, 19200, 38400, 57600, 115200, 230400, 250000].map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* Monitoring */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-primary)]">
          <Activity className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Monitoring</span>
        </div>

        <div>
          <label className={labelCls}>Status Polling Interval (ms)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={pollInterval}
              onChange={(e) => setPollInterval(e.target.value)}
              onBlur={savePoll}
              min={1000}
              max={10000}
              step={100}
              className={inputCls}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            How often the <strong>Controls</strong> requests coordinates and machine state from the controller. 
            <strong> Minimum: 1000ms. Default: 2000ms.</strong> Lowering this too far can cause the web service to disconnect.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── File Manager section ────────────────────────────────────────────────────

function FileManagerContent() {
  const { settings, updateSettings } = useSettingsStore();
  const [path, setPath] = useState(settings.gcodeStoragePath);

  const savePath = async () => {
    const trimmed = path.trim();
    if (!trimmed) return;
    try {
      await transport.invoke('ensure_dir_exists', { path: trimmed });
      updateSettings({ gcodeStoragePath: trimmed });
    } catch (err) {
      console.error("[settings] Failed to update storage path:", err);
    }
  };

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-primary)]">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Local Storage</span>
        </div>

        <div>
          <label className={labelCls}>G-code Storage Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onBlur={savePath}
              placeholder="C:/Users/me/gcode_files"
              className={inputCls}
            />
            <button
              onClick={async () => {
                const selected = await openDialog({ directory: true, multiple: false });
                if (selected && typeof selected === 'string') {
                  const normalized = selected.replace(/\\/g, '/');
                  setPath(normalized);
                  await transport.invoke('ensure_dir_exists', { path: normalized });
                  updateSettings({ gcodeStoragePath: normalized });
                }
              }}
              className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] transition-colors"
              title="Browse folders"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            The directory on this computer where your G-code files are stored. 
            Default is <span className="font-mono">~/gcode_files</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Visualizer section ───────────────────────────────────────────────────────

function VisualizerContent() {
  const { settings, setShowAutolevelMesh, setDashboardPanelEnabled } = useSettingsStore();

  return (
    <div className="space-y-6">
      {/* Autolevel Toggle */}
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

      {/* Workpiece Panel Shortcut */}
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

// ─── Stats section ───────────────────────────────────────────────────────────

function StatsContent() {
  const { settings, setStatsSettings, setDashboardPanelEnabled } = useSettingsStore();
  const sts = settings.stats;
  const isPanelEnabled = settings.dashboardPanels.find(p => p.id === 'stats')?.enabled ?? false;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-8">
      
      {/* 1. Data Collection */}
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

      {/* 2. OEE Targets */}
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

      {/* 4. Display */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. Display & Dashboard</h4>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)] mb-1 block">Show Stats Panel</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">Enable the live statistics monitor on the main dashboard.</span>
          </div>
          <button
            onClick={() => setDashboardPanelEnabled('stats', !isPanelEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${isPanelEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isPanelEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. Global Stats (Read Only with Reset) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>3. Accumulated Statistics</h4>
          <button 
            onClick={() => {
              if (confirm("Are you sure you want to reset all machine statistics? This cannot be undone.")) {
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

// ─── AI Assistant section ──────────────────────────────────────────────────

function AIAssistantContent() {
  const { settings, setDashboardPanelEnabled, setAiSettings } = useSettingsStore();
  const [apiKey, setApiKey] = useState(settings.ai.apiKey);
  const [freeModel, setFreeModel] = useState(settings.ai.freeModel || "gemini-1.5-flash");
  const [proModel, setProModel] = useState(settings.ai.proModel || "gemini-1.5-pro");
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [modelList, setModelList] = useState<string | null>(null);
  const [conciseMode, setConciseMode] = useState(settings.ai.conciseMode);

  const isPanelEnabled = settings.dashboardPanels.find(p => p.id === 'ai')?.enabled ?? false;
  const isFreeTier = settings.ai.tier === 'free';

  const handleSave = async () => {
    setLoading(true);
    setSaveMessage('');
    try {
      setAiSettings({ 
        apiKey: apiKey.trim(),
        freeModel: freeModel.trim(),
        proModel: proModel.trim(),
        conciseMode: conciseMode,
      });
      setSaveMessage('Settings saved successfully.');
    } catch (e: any) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleListModels = async () => {
    if (!apiKey.trim() && !settings.ai.apiKey) {
      setSaveMessage('Error: Please enter or save an API key first.');
      return;
    }
    setLoading(true);
    setSaveMessage('Fetching model list...');
    try {
      const raw = await transport.invoke<string>('list_gemini_models', { apiKey: apiKey || settings.ai.apiKey });
      const data = JSON.parse(raw);
      if (data.models) {
        const names = data.models.map((m: any) => m.name.replace('models/', '')).join(', ');
        setModelList(names);
        setSaveMessage('Available models fetched.');
      } else {
        setModelList(raw);
        setSaveMessage('Fetched raw model data.');
      }
    } catch (e: any) {
      setSaveMessage(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  };

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className={subHeaderCls}>Dashboard Integration</h4>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)] mb-1 block">Show AI Panel</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">Enable the interactive AI chat panel on the dashboard.</span>
          </div>
          <button
            onClick={() => setDashboardPanelEnabled('ai', !isPanelEnabled)}
            className={`relative h-5 w-9 rounded-full transition-colors ${isPanelEnabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${isPanelEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-[var(--text-primary)] mb-1 block">Concise Responses</span>
            <span className="text-[10px] text-[var(--text-tertiary)]">AI will provide brief, direct answers with minimal explanation.</span>
          </div>
          <button
            onClick={() => setConciseMode(!conciseMode)}
            className={`relative h-5 w-9 rounded-full transition-colors ${conciseMode ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${conciseMode ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Model Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Free Tier Model</label>
            <input
              type="text"
              value={freeModel}
              onChange={(e) => setFreeModel(e.target.value)}
              className={inputCls}
              placeholder="e.g. gemini-1.5-flash"
            />
          </div>
          <div>
            <label className={labelCls}>Pro Tier Model</label>
            <input
              type="text"
              value={proModel}
              onChange={(e) => setProModel(e.target.value)}
              className={inputCls}
              placeholder="e.g. gemini-1.5-pro"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>AI Engine Tier</h4>
        <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
          <button
            onClick={() => setAiSettings({ tier: 'free' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              isFreeTier
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setAiSettings({ tier: 'pro' })}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              !isFreeTier
                ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
          >
            Pro Tier
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          {isFreeTier 
            ? `Using the built-in free tier with ${settings.ai.freeModel}. Speed-optimized for fast responses.`
            : `Using ${settings.ai.proModel} for the most advanced reasoning. Requires your own Google API key.`}
        </p>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>API Credentials</h4>
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">
            {settings.ai.apiKey ? 'Key is Set ✓' : 'No Key Configured'}
          </span>
        </div>
        
        <div>
          <label className={labelCls}>Gemini API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings.ai.apiKey ? "••••••••••••••••" : "Paste your Gemini API Key here..."}
            className={inputCls}
          />
          <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            {isFreeTier 
              ? "You can provide your own key here to use the Free model, or leave it blank if the app was built with a bundled key."
              : "Your key is secure. Ensure you use a valid Pro capable API key for the selected model."}
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-medium rounded-lg hover:bg-[var(--accent-primary)]/90 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? 'Saving...' : 'Save AI Configuration'}
          </button>
          <button
            onClick={handleListModels}
            disabled={loading}
            className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-medium rounded-lg hover:bg-[var(--bg-secondary)] disabled:opacity-50 transition-colors"
          >
            {loading ? '...' : 'List Models'}
          </button>
        </div>
        {saveMessage && (
          <p className={`text-center text-[10px] mt-2 ${saveMessage.includes('Error') ? 'text-[var(--danger-color)]' : 'text-[var(--success-color)]'}`}>
            {saveMessage}
          </p>
        )}
        {modelList && (
          <div className="mt-4 p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] overflow-hidden">
            <h5 className="text-[10px] font-bold text-[var(--accent-primary)] mb-1 uppercase">Models Your Key Can Access:</h5>
            <div className="text-[10px] text-[var(--text-secondary)] font-mono max-h-24 overflow-y-auto break-all whitespace-pre-wrap">
              {modelList}
            </div>
            <p className="mt-2 text-[8px] text-[var(--text-tertiary)] italic">Copy/paste one of these into the model boxes above if you get 404 errors.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Macros section ──────────────────────────────────────────────────────────

function MacrosContent() {
  const { settings, addMacro, updateMacro, deleteMacro } = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const subHeaderCls = 'text-xs font-bold text-[var(--accent-primary)] mb-3 uppercase tracking-wider';
  const labelCls = 'block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5';
  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    addMacro({ name: newName, content: newContent });
    setNewName('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    if (!newName.trim() || !newContent.trim()) return;
    updateMacro(id, { name: newName, content: newContent });
    setEditingId(null);
    setNewName('');
    setNewContent('');
  };

  const startEdit = (macro: any) => {
    setEditingId(macro.id);
    setNewName(macro.name);
    setNewContent(macro.content);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Stored Macros</h4>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-[10px] font-bold rounded-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <h5 className="text-[11px] font-bold text-[var(--text-primary)] uppercase">
            {isAdding ? 'Create New Macro' : 'Edit Macro'}
          </h5>
          <div>
            <label className={labelCls}>Macro Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Probe Z"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>G-code Content</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="G0 X10..."
              className={`${inputCls} min-h-[100px] font-mono text-xs`}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                if (isAdding) handleAdd();
                else if (editingId) handleUpdate(editingId);
              }}
              className="flex-1 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isAdding ? 'Save Macro' : 'Update Macro'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {settings.macros.map((macro) => (
          <div
            key={macro.id}
            className={`group p-3 rounded-xl border transition-all ${
              editingId === macro.id
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 opacity-50'
                : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[var(--text-primary)]">{macro.name}</h5>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate max-w-[200px]">
                    {macro.content.split('\n')[0]}
                    {macro.content.includes('\n') ? '...' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Edit Macro" position="top">
                  <button
                    onClick={() => startEdit(macro)}
                    disabled={!!editingId}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all disabled:opacity-30 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete Macro" position="top">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${macro.name}"?`)) {
                        deleteMacro(macro.id);
                      }
                    }}
                    disabled={!!editingId}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all disabled:opacity-30 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}

        {settings.macros.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-dashed border-[var(--border-color)]">
            <Settings className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-20" />
            <p className="text-xs text-[var(--text-tertiary)] italic">No macros saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Section definitions ─────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'dashboard',   title: 'Dashboard',      icon: <LayoutGrid className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'widgets',     title: 'Widgets',        icon: <LayoutDashboard className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'connection',  title: 'Connection',     icon: <Cable className="w-4 h-4" />, tab: 'machine' },
  { id: 'probe',       title: 'Probe',          icon: <Crosshair className="w-4 h-4" />, tab: 'machine' },
  { id: 'spindle',     title: 'Spindle',        icon: <Cpu className="w-4 h-4" />, tab: 'machine' },
  { id: 'macros',      title: 'Macros',         icon: <FileCode className="w-4 h-4" />, tab: 'machine' },
  { id: 'toolchanger', title: 'Tool Changer',   icon: <Wrench className="w-4 h-4" />, tab: 'machine' },
  { id: 'rotary',      title: 'Rotary Config',  icon: <RotateCw className="w-4 h-4" />, tab: 'machine' },
  { id: 'general',     title: 'General',        icon: <SlidersHorizontal className="w-4 h-4" />, tab: 'machine' },
  { id: 'file-manager', title: 'File Manager',   icon: <Folder className="w-4 h-4" />, tab: 'machine' },
  { id: 'visualizer',  title: 'Bed Visualizer', icon: <Box className="w-4 h-4" />, tab: 'machine' },
  { id: 'stats',       title: 'Stats',          icon: <BarChart2 className="w-4 h-4" />, tab: 'machine' },
  { id: 'ai',          title: 'AI Assistant',   icon: <Bot className="w-4 h-4" />, tab: 'machine' },
  { id: 'theme',       title: 'Theme',          icon: <Palette className="w-4 h-4" />, tab: 'machine' },
  { id: 'history',     title: 'History',        icon: <History className="w-4 h-4" />, tab: 'machine' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function getSectionContent(id: SectionId): ReactNode | undefined {
  if (id === 'dashboard')  return <DashboardContent />;
  if (id === 'theme')      return <ThemeContent />;
  if (id === 'general')    return <GeneralContent />;
  if (id === 'connection') return <ConnectionContent />;
  if (id === 'file-manager') return <FileManagerContent />;
  if (id === 'probe')        return <ProbeContent />;
  if (id === 'spindle')      return <SpindleContent />;
  if (id === 'stats')        return <StatsContent />;
  if (id === 'ai')           return <AIAssistantContent />;
  if (id === 'visualizer') return <VisualizerContent />;
  if (id === 'macros')     return <MacrosContent />;
  return undefined; // renders placeholder
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const { settingsOpen, settingsTab, settingsSection, closeSettings, setSettingsTab } = useUIStore();
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settingsOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
      
      // Auto-scroll to section if provided
      if (settingsSection) {
        setTimeout(() => {
          const el = document.getElementById(`settings-section-${settingsSection}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
      }
    } else {
      setSearch('');
    }
  }, [settingsOpen, settingsSection]);

  const query = search.trim().toLowerCase();
  
  // If searching, show all matches. Otherwise, filter by active tab.
  const visibleSections = SECTIONS.filter((s) => {
    const matchesSearch = s.title.toLowerCase().includes(query);
    if (query) return matchesSearch;
    return s.tab === settingsTab;
  });

  return (
    <>
      {/* Trigger */}
      <Tooltip content="Settings & Preferences" position="bottom">
        <button
          onClick={() => useUIStore.getState().openSettings()}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      {/* Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
          onClick={closeSettings}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl border border-[var(--border-color)] overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
              <button
                onClick={closeSettings}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Search and Tabs Container */}
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search settings…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all duration-200"
                />
              </div>

              {!query && (
                <div className="flex p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                    <button
                        onClick={() => setSettingsTab('dashboard')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'dashboard'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        Dashboard
                    </button>
                    <button
                        onClick={() => setSettingsTab('machine')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'machine'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        Machine & System
                    </button>
                </div>
              )}
            </div>

            {/* Scrollable sections */}
            <div ref={scrollContainerRef} className="overflow-y-auto flex-1 px-4 py-4 space-y-3 custom-scrollbar">
              {visibleSections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="w-8 h-8 text-[var(--text-tertiary)] mb-3" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    No results for "{search}"
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    Try a different search term.
                  </p>
                </div>
              ) : (
                visibleSections.map((section) => (
                  <div key={section.id} id={`settings-section-${section.id}`}>
                    <SettingsSection title={section.title} icon={section.icon}>
                      {getSectionContent(section.id)}
                    </SettingsSection>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex justify-end flex-shrink-0">
              <button
                onClick={closeSettings}
                className="px-5 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer shadow-sm hover:shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
