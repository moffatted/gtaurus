/**
 * @file SettingsPanel.tsx
 * @purpose Comprehensive configuration interface for application, UI, and machine-specific settings.
 */
import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  Settings, X, Sun, Moon, Search, Bot,
  Palette, SlidersHorizontal, Cable, Crosshair,
  Cpu, Box, History, BarChart2, Wrench, RotateCw, LayoutDashboard,
  ChevronDown, LayoutGrid, ChevronUp, Eye, EyeOff,
  Wifi, UsbIcon, RefreshCw, Power, Activity,
  Folder, HardDrive, Plus, Trash, Edit, Save, FileCode, Play, Camera, Drill,
  Sparkles, Wind, Ghost, Leaf
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useThemeStore } from '../stores/themeStore';
import { AiClientSettings, AiProvider, AiTier, useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { isTauriApp } from '../utils/platform';
import { transport } from '../services/transportService';
import { MachineSetupWizard } from './wizards/MachineSetupWizard';
import { useMachineStore } from '../stores/machineStore';

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

  const themes = [
    { id: 'light',    label: 'Standard Light', icon: <Sun className="w-4 h-4" />,      colors: ['#fafbfc', '#2d3748', '#4a90e2'] },
    { id: 'dark',     label: 'Standard Dark',  icon: <Moon className="w-4 h-4" />,     colors: ['#121417', '#e4e7eb', '#5a9fd4'] },
    { id: 'midnight', label: 'Midnight Blue',  icon: <Sparkles className="w-4 h-4" />, colors: ['#020617', '#f1f5f9', '#6366f1'] },
    { id: 'nord',     label: 'Arctic Nord',    icon: <Wind className="w-4 h-4" />,     colors: ['#2e3440', '#eceff4', '#88c0d0'] },
    { id: 'dracula',  label: 'Gothic Dracula', icon: <Ghost className="w-4 h-4" />,    colors: ['#21222c', '#f8f8f2', '#bd93f9'] },
    { id: 'bamboo',   label: 'Zen Bamboo',     icon: <Leaf className="w-4 h-4" />,     colors: ['#0f110f', '#e6e8e6', '#84cc16'] },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-4">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`relative group flex flex-col p-3.5 rounded-xl border-2 transition-all duration-300 cursor-pointer text-left overflow-hidden ${
            theme === t.id
              ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] shadow-lg shadow-[var(--accent-primary)]/10'
              : 'border-[var(--border-color)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-tertiary)]/50'
          }`}
          aria-label={`${t.label} theme`}
          aria-pressed={theme === t.id}
        >
          {/* Active indicator */}
          {theme === t.id && (
            <div className="absolute top-0 right-0 w-8 h-8 flex items-center justify-center">
              <div className="absolute top-[-10px] right-[-10px] w-20 h-20 bg-[var(--accent-primary)] rotate-45 transform pointer-events-none opacity-10" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] relative z-10" />
            </div>
          )}

          <div className="flex items-center gap-2.5 mb-3 relative z-10">
            <span className={`p-1.5 rounded-lg transition-colors ${
              theme === t.id ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]'
            }`}>
              {t.icon}
            </span>
            <span className={`text-xs font-bold tracking-tight transition-colors ${
              theme === t.id ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'
            }`}>
              {t.label}
            </span>
          </div>

          <div className="flex gap-1.5 items-center relative z-10">
            {t.colors.map((c, i) => (
              <div 
                key={i} 
                className="w-full h-1.5 rounded-full border border-black/5" 
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Subtle background glow for selected theme */}
          {theme === t.id && (
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent pointer-events-none" />
          )}
        </button>
      ))}

      {/* UI Scale */}
      <div className="col-span-2 pt-4 border-t border-[var(--border-color)]">
        <div className="space-y-3">
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            UI Scale ({(useSettingsStore(s => s.settings.general.uiScale) || 1.0).toFixed(1)}x)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={useSettingsStore(s => s.settings.general.uiScale) || 1.0}
              onChange={(e) => useSettingsStore.getState().setGeneralSettings({ uiScale: parseFloat(e.target.value) || 1.0 })}
              className="flex-1 accent-[var(--accent-primary)] cursor-pointer"
            />
            <button
              onClick={() => useSettingsStore.getState().setGeneralSettings({ uiScale: 1.0 })}
              className="p-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-colors cursor-pointer text-xs flex items-center gap-1"
              title="Reset to 1.0x"
            >
              Reset
            </button>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            Adjust the overall size of the user interface. You can also use Ctrl/Cmd + and - to zoom, and 0 to reset.
          </p>
        </div>
      </div>
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

      {/* Legacy GRBL 1.1 Mode */}
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

      <div className="border-t border-[var(--border-color)]" />

      {/* Axis Homing Direction */}
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

// ─── ATC section ─────────────────────────────────────────────────────────────

function AtcContent() {
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
                value={panel.defaultWidth ?? ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setDashboardPanelDimensions(panel.id, { defaultWidth: val });
                }}
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
  const [bridgePort, setBridgePort] = useState(String(conn.bridgePort || import.meta.env.VITE_BACKEND_PORT || 9001));
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
      connection: { ...conn, bridgeHost: bridgeHost.trim(), bridgePort: isNaN(port) ? Number(import.meta.env.VITE_BACKEND_PORT || 9001) : port },
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
  const { settings, setStatsSettings } = useSettingsStore();
  const sts = settings.stats;
  const [showResetConfirm, setShowResetConfirm] = useState(false);

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
      
      {/* Visibility Toggle */}
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

      {/* 3. Global Stats (Read Only with Reset) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>3. Accumulated Statistics</h4>
          <button 
            onClick={() => setShowResetConfirm(true)}
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

      {showResetConfirm && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">Reset Machine Statistics</h5>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">Are you sure you want to reset all accumulated machine statistics?</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">This action cannot be undone.</p>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
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
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AI Assistant section ──────────────────────────────────────────────────

function AIAssistantContent() {
  const { settings, setDashboardPanelEnabled, setAiSettings } = useSettingsStore();
  const [selectedClientId, setSelectedClientId] = useState(settings.ai.activeClientId || settings.ai.clients[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [modelList, setModelList] = useState<string | null>(null);
  const [copilotRuntimeStatus, setCopilotRuntimeStatus] = useState<{ available: boolean; version?: string; message: string } | null>(null);
  const [pendingDeleteClient, setPendingDeleteClient] = useState<{ id: string; name: string } | null>(null);
  const [testingClientId, setTestingClientId] = useState<string | null>(null);
  const [testStatusByClientId, setTestStatusByClientId] = useState<Record<string, { ok: boolean; message: string }>>({});
  const [clientModal, setClientModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    client: AiClientSettings | null;
  }>({ open: false, mode: 'add', client: null });

  const isPanelEnabled = settings.dashboardPanels.find(p => p.id === 'ai')?.enabled ?? false;
  const clients = settings.ai.clients ?? [];
  const activeClient = clients.find((c) => c.id === settings.ai.activeClientId) ?? clients[0] ?? null;

  const providerDefaults: Record<AiProvider, { model: string; baseUrl?: string }> = {
    gemini: { model: 'gemini-1.5-pro' },
    'copilot-sdk': { model: 'gpt-4o' },
    openai: { model: 'gpt-4.1', baseUrl: 'https://api.openai.com/v1' },
    anthropic: { model: 'claude-3-5-sonnet-latest', baseUrl: 'https://api.anthropic.com/v1' },
    openrouter: { model: 'google/gemini-2.0-flash-exp:free', baseUrl: 'https://openrouter.ai/api/v1' },
    groq: { model: 'llama-3.3-70b-versatile', baseUrl: 'https://api.groq.com/openai/v1' },
    mistral: { model: 'mistral-large-latest', baseUrl: 'https://api.mistral.ai/v1' },
    xai: { model: 'grok-2-latest', baseUrl: 'https://api.x.ai/v1' },
    'openai-compatible': { model: 'qwen/qwen2.5-coder-14b', baseUrl: 'http://192.168.68.57:1473/v1' },
  };

  const providerHelp: Record<AiProvider, { title: string; keyHint: string; endpointHint: string; modelHint: string }> = {
    gemini: {
      title: 'Google Gemini',
      keyHint: 'Google AI Studio key (AIza...) or bundled free key when available.',
      endpointHint: 'Managed internally via Google Generative Language API.',
      modelHint: 'Examples: gemini-1.5-flash, gemini-1.5-pro',
    },
    'copilot-sdk': {
      title: 'GitHub Copilot SDK',
      keyHint: 'Uses Copilot entitlement (subscription) or BYOK credentials in SDK mode.',
      endpointHint: 'No direct HTTP endpoint. Uses Copilot runtime/CLI session orchestration.',
      modelHint: 'Examples: gpt-4o-mini, gpt-4o, claude-family (when available in session config)',
    },
    openai: {
      title: 'OpenAI',
      keyHint: 'OpenAI key (sk-...).',
      endpointHint: 'https://api.openai.com/v1',
      modelHint: 'Examples: gpt-4o-mini, gpt-4.1',
    },
    anthropic: {
      title: 'Anthropic',
      keyHint: 'Anthropic key (sk-ant-...).',
      endpointHint: 'https://api.anthropic.com/v1',
      modelHint: 'Examples: claude-3-5-sonnet-latest',
    },
    openrouter: {
      title: 'OpenRouter',
      keyHint: 'OpenRouter key (sk-or-v1-...).',
      endpointHint: 'https://openrouter.ai/api/v1',
      modelHint: 'Examples: google/gemini-2.0-flash-exp:free, anthropic/claude-3.5-sonnet',
    },
    groq: {
      title: 'Groq',
      keyHint: 'Groq API key (gsk_...).',
      endpointHint: 'https://api.groq.com/openai/v1',
      modelHint: 'Examples: llama-3.3-70b-versatile',
    },
    mistral: {
      title: 'Mistral',
      keyHint: 'Mistral API key.',
      endpointHint: 'https://api.mistral.ai/v1',
      modelHint: 'Examples: mistral-large-latest',
    },
    xai: {
      title: 'xAI',
      keyHint: 'xAI API key.',
      endpointHint: 'https://api.x.ai/v1',
      modelHint: 'Examples: grok-2-latest',
    },
    'openai-compatible': {
      title: 'OpenAI-Compatible Local/Hosted',
      keyHint: 'Any token expected by your compatible gateway (or blank if not required).',
      endpointHint: 'Example: http://192.168.68.57:1473/v1',
      modelHint: 'Examples: qwen/qwen2.5-coder-14b, llama3.1',
    },
  };

  const freeTierProviders: AiProvider[] = ['gemini', 'copilot-sdk', 'openrouter', 'openai', 'groq'];
  const proTierProviders: AiProvider[] = ['gemini', 'copilot-sdk', 'openai', 'anthropic', 'groq', 'mistral', 'xai', 'openrouter'];
  const localTierProviders: AiProvider[] = ['openai-compatible'];

  useEffect(() => {
    const fallbackId = settings.ai.activeClientId || settings.ai.clients[0]?.id || '';
    const nextSelectedId = settings.ai.clients.some((c) => c.id === selectedClientId) ? selectedClientId : fallbackId;
    if (nextSelectedId !== selectedClientId) {
      setSelectedClientId(nextSelectedId);
    }
  }, [settings.ai, selectedClientId]);

  const syncLegacyFields = (nextClients: AiClientSettings[], nextActiveClientId: string) => {
    const freeClient = nextClients.find((c) => c.tier === 'free');
    const proClient = nextClients.find((c) => c.tier === 'pro');
    const localClient = nextClients.find((c) => c.tier === 'local');
    const active = nextClients.find((c) => c.id === nextActiveClientId) ?? nextClients[0];
    const geminiClient = nextClients.find((c) => c.provider === 'gemini');

    return {
      clients: nextClients,
      activeClientId: nextActiveClientId,
      tier: active?.tier ?? settings.ai.tier,
      apiKey: geminiClient?.apiKey ?? settings.ai.apiKey,
      freeModel: freeClient?.model ?? settings.ai.freeModel,
      proModel: proClient?.model ?? settings.ai.proModel,
      localModel: localClient?.model ?? settings.ai.localModel,
      localBaseUrl: localClient?.baseUrl ?? settings.ai.localBaseUrl,
      localApiKey: localClient?.apiKey ?? settings.ai.localApiKey,
      conciseMode: settings.ai.conciseMode,
    };
  };

  const createClient = (tier: AiTier, provider?: AiProvider): AiClientSettings => {
    const resolvedProvider: AiProvider = provider ?? (tier === 'local' ? 'openai-compatible' : 'gemini');
    const defaults = providerDefaults[resolvedProvider];
    const model = tier === 'free' && resolvedProvider === 'gemini'
      ? 'gemini-1.5-flash'
      : defaults.model;

    return {
      id: crypto.randomUUID(),
      name: `${tier.toUpperCase()} ${resolvedProvider.replace('-', ' ')}`,
      tier,
      provider: resolvedProvider,
      model,
      baseUrl: defaults.baseUrl || '',
      apiKey: tier === 'local' ? 'lm-studio' : '',
      enabled: true,
    };
  };

  const updateModalClient = (patch: Partial<AiClientSettings>) => {
    setClientModal((prev) => {
      if (!prev.client) return prev;
      return {
        ...prev,
        client: { ...prev.client, ...patch },
      };
    });
  };

  const checkCopilotRuntime = async () => {
    setLoading(true);
    try {
      const status = await transport.invoke<{ available: boolean; version?: string; message: string }>('copilot_runtime_status');
      setCopilotRuntimeStatus(status);
      setSaveMessage(status.available ? 'Copilot runtime detected.' : `Copilot runtime not ready: ${status.message}`);
    } catch (e: any) {
      setSaveMessage(`Error: ${e}`);
      setCopilotRuntimeStatus({ available: false, message: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const handleListModels = async (client?: AiClientSettings | null) => {
    const key = client?.apiKey?.trim() || settings.ai.apiKey;
    if (!key) {
      setSaveMessage('Error: Please enter or save an API key first.');
      return;
    }

    setLoading(true);
    setSaveMessage('Fetching model list...');

    try {
      const raw = await transport.invoke<string>('list_gemini_models', { apiKey: key });
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

  const activateClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    setAiSettings(syncLegacyFields(clients, clientId));
    setSelectedClientId(clientId);
    setSaveMessage(`Active client set to ${client.name}.`);
  };

  const openAddClientModal = (tier: AiTier) => {
    const newClient = createClient(tier);
    setClientModal({ open: true, mode: 'add', client: newClient });
    setModelList(null);
    setCopilotRuntimeStatus(null);
  };

  const openEditClientModal = (client: AiClientSettings) => {
    setClientModal({ open: true, mode: 'edit', client: { ...client } });
    setModelList(null);
    setCopilotRuntimeStatus(null);
  };

  const saveModalClient = () => {
    if (!clientModal.client) return;
    const normalizedClient = {
      ...clientModal.client,
      name: clientModal.client.name.trim() || 'LLM Client',
      model: clientModal.client.model.trim(),
      baseUrl: clientModal.client.baseUrl?.trim(),
      apiKey: clientModal.client.apiKey?.trim(),
    };

    if (clientModal.mode === 'add') {
      const nextClients = [...clients, normalizedClient];
      setAiSettings(syncLegacyFields(nextClients, normalizedClient.id));
      setSelectedClientId(normalizedClient.id);
      setSaveMessage(`${normalizedClient.tier.toUpperCase()} client created.`);
    } else {
      const nextClients = clients.map((c) => (c.id === normalizedClient.id ? normalizedClient : c));
      setAiSettings(syncLegacyFields(nextClients, settings.ai.activeClientId));
      setSelectedClientId(normalizedClient.id);
      setSaveMessage('Client profile saved.');
    }

    setClientModal({ open: false, mode: 'add', client: null });
  };

  const toggleClientEnabled = (clientId: string) => {
    const target = clients.find((c) => c.id === clientId);
    if (!target) return;
    const nextClients = clients.map((c) => (c.id === clientId ? { ...c, enabled: !c.enabled } : c));
    setAiSettings(syncLegacyFields(nextClients, settings.ai.activeClientId));
    setSaveMessage(`${target.name} ${target.enabled ? 'disabled' : 'enabled'}.`);
  };

  const deleteClient = (clientId?: string) => {
    const targetId = clientId ?? selectedClientId;
    const targetClient = clients.find((c) => c.id === targetId);
    if (!targetClient) return;

    if (clients.length <= 1) {
      setSaveMessage('Error: At least one client profile is required.');
      return;
    }

    const nextClients = clients.filter((c) => c.id !== targetId);
    const nextActiveId = settings.ai.activeClientId === targetId ? nextClients[0].id : settings.ai.activeClientId;
    setAiSettings(syncLegacyFields(nextClients, nextActiveId));
    setSelectedClientId(nextClients[0].id);
    setSaveMessage('Client profile deleted.');
  };

  const testClientConnectivity = async (client: AiClientSettings) => {
    setTestingClientId(client.id);
    setTestStatusByClientId((prev) => {
      const next = { ...prev };
      delete next[client.id];
      return next;
    });
    setSaveMessage('Testing LLM connectivity...');
    try {
      const result = await transport.invoke<{ ok: boolean; message: string }>('test_ai_client_connectivity', {
        selectedClient: client,
        fallbackApiKey: settings.ai.apiKey,
        fallbackLocalApiKey: settings.ai.localApiKey,
      });
      setTestStatusByClientId((prev) => ({
        ...prev,
        [client.id]: { ok: result.ok, message: result.message },
      }));
      setSaveMessage(result.ok ? `Reachable: ${result.message}` : `Error: ${result.message}`);
    } catch (e: any) {
      setTestStatusByClientId((prev) => ({
        ...prev,
        [client.id]: { ok: false, message: String(e) },
      }));
      setSaveMessage(`Error: ${e}`);
    } finally {
      setTestingClientId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Visibility Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Show AI Assistant Button</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Display the AI Assistant button in the top menu.
          </p>
        </div>
        <button
          onClick={() => setAiSettings({ enabled: !settings.ai.enabled })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.ai.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={settings.ai.enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              settings.ai.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

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
            onClick={() => setAiSettings({ conciseMode: !settings.ai.conciseMode })}
            className={`relative h-5 w-9 rounded-full transition-colors ${settings.ai.conciseMode ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'}`}
          >
            <span className={`absolute top-0.5 left-0.5 h-4 w-4 bg-white rounded-full transition-transform ${settings.ai.conciseMode ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Client Profiles</h4>
          <span className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">{clients.length} configured</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {clients.map((client) => (
            <div
              key={client.id}
              className={`w-full p-2 rounded-lg border transition-colors ${
                selectedClientId === client.id
                  ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedClientId(client.id);
                  }}
                  className="flex-1 text-left"
                >
                  <div className="text-xs font-semibold text-[var(--text-primary)]">{client.name}</div>
                  <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{client.tier} • {client.provider}</div>
                  {testStatusByClientId[client.id] && (
                    <Tooltip
                      content={testStatusByClientId[client.id].message}
                      position="top"
                    >
                      <div className={`mt-1 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] ${testStatusByClientId[client.id].ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {testStatusByClientId[client.id].ok ? 'Reachable' : 'Unreachable'}
                      </div>
                    </Tooltip>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    {settings.ai.activeClientId === client.id ? 'Active' : client.enabled ? 'Idle' : 'Disabled'}
                  </div>
                  <button
                    onClick={() => toggleClientEnabled(client.id)}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    {client.enabled ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => activateClient(client.id)}
                    disabled={settings.ai.activeClientId === client.id}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {settings.ai.activeClientId === client.id ? 'Active' : 'Show'}
                  </button>
                  <button
                    onClick={() => openEditClientModal(client)}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => testClientConnectivity(client)}
                    disabled={testingClientId === client.id}
                    className="px-2 py-1 text-[10px] rounded border border-[var(--border-color)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                  >
                    {testingClientId === client.id ? 'Testing' : 'Test'}
                  </button>
                  <button
                    onClick={() => setPendingDeleteClient({ id: client.id, name: client.name })}
                    disabled={clients.length <= 1}
                    className="px-2 py-1 text-[10px] rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={clients.length <= 1 ? 'At least one client is required' : `Delete ${client.name}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => openAddClientModal('free')} className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">+ Free</button>
          <button onClick={() => openAddClientModal('pro')} className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">+ Pro</button>
          <button onClick={() => openAddClientModal('local')} className="px-2 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">+ Local</button>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {saveMessage && (
        <p className={`text-center text-[10px] mt-2 ${saveMessage.includes('Error') ? 'text-[var(--danger-color)]' : 'text-[var(--success-color)]'}`}>
          {saveMessage}
        </p>
      )}

      {clientModal.open && clientModal.client && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">{clientModal.mode === 'add' ? 'Add LLM Client' : 'Edit LLM Client'}</h5>
            </div>
            <div className="px-4 py-4 space-y-3 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Display Name</label>
                  <input type="text" value={clientModal.client.name} onChange={(e) => updateModalClient({ name: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tier</label>
                  <select
                    value={clientModal.client.tier}
                    onChange={(e) => {
                      const nextTier = e.target.value as AiTier;
                      const allowedProviders = nextTier === 'free' ? freeTierProviders : nextTier === 'pro' ? proTierProviders : localTierProviders;
                      const nextProvider = allowedProviders.includes(clientModal.client!.provider) ? clientModal.client!.provider : allowedProviders[0];
                      updateModalClient({
                        tier: nextTier,
                        provider: nextProvider,
                        model: providerDefaults[nextProvider].model,
                        baseUrl: providerDefaults[nextProvider].baseUrl || '',
                      });
                    }}
                    className={inputCls}
                  >
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="local">Local</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Provider</label>
                  <select
                    value={clientModal.client.provider}
                    onChange={(e) => {
                      const nextProvider = e.target.value as AiProvider;
                      const defaults = providerDefaults[nextProvider];
                      updateModalClient({
                        provider: nextProvider,
                        model: defaults.model,
                        baseUrl: defaults.baseUrl || '',
                      });
                    }}
                    className={inputCls}
                  >
                    {(clientModal.client.tier === 'free' ? freeTierProviders : clientModal.client.tier === 'pro' ? proTierProviders : localTierProviders).map((provider) => (
                      <option key={provider} value={provider}>{provider}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Model String</label>
                  <input type="text" value={clientModal.client.model} onChange={(e) => updateModalClient({ model: e.target.value })} className={inputCls} placeholder="e.g. gemini-1.5-pro" />
                </div>
              </div>

              <div className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                <div className="text-[10px] uppercase tracking-wider text-[var(--accent-primary)] mb-1">
                  Provider Help: {providerHelp[clientModal.client.provider].title}
                </div>
                <div className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                  <div>Key: {providerHelp[clientModal.client.provider].keyHint}</div>
                  <div>Endpoint: {providerHelp[clientModal.client.provider].endpointHint}</div>
                  <div>Model: {providerHelp[clientModal.client.provider].modelHint}</div>
                </div>
              </div>

              {clientModal.client.provider !== 'gemini' && clientModal.client.provider !== 'anthropic' && clientModal.client.provider !== 'copilot-sdk' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>API Base URL</label>
                    <input type="text" value={clientModal.client.baseUrl || ''} onChange={(e) => updateModalClient({ baseUrl: e.target.value })} className={inputCls} placeholder="http://192.168.68.57:1473/v1" />
                  </div>
                  <div>
                    <label className={labelCls}>API Key</label>
                    <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="Optional token" />
                  </div>
                </div>
              )}

              {clientModal.client.provider === 'anthropic' && (
                <div>
                  <label className={labelCls}>Anthropic API Key</label>
                  <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="sk-ant-..." />
                </div>
              )}

              {clientModal.client.provider === 'gemini' && (
                <div>
                  <label className={labelCls}>Gemini API Key</label>
                  <input type="password" value={clientModal.client.apiKey || ''} onChange={(e) => updateModalClient({ apiKey: e.target.value })} className={inputCls} placeholder="AIza..." />
                </div>
              )}

              {clientModal.client.provider === 'copilot-sdk' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Auth Mode</label>
                      <select
                        value={clientModal.client.copilotAuthMode || 'subscription'}
                        onChange={(e) => updateModalClient({ copilotAuthMode: e.target.value as 'subscription' | 'byok' })}
                        className={inputCls}
                      >
                        <option value="subscription">Copilot Subscription</option>
                        <option value="byok">BYOK</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>BYOK Provider</label>
                      <select
                        value={clientModal.client.copilotByokProvider || 'openai'}
                        onChange={(e) => {
                          const provider = e.target.value as 'openai' | 'anthropic';
                          updateModalClient({
                            copilotByokProvider: provider,
                            baseUrl: provider === 'openai' ? 'https://api.openai.com/v1' : 'https://api.anthropic.com/v1',
                          });
                        }}
                        className={inputCls}
                        disabled={(clientModal.client.copilotAuthMode || 'subscription') !== 'byok'}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic</option>
                      </select>
                    </div>
                  </div>

                  {(clientModal.client.copilotAuthMode || 'subscription') === 'byok' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>BYOK API Key</label>
                        <input
                          type="password"
                          value={clientModal.client.apiKey || ''}
                          onChange={(e) => updateModalClient({ apiKey: e.target.value })}
                          className={inputCls}
                          placeholder={(clientModal.client.copilotByokProvider || 'openai') === 'anthropic' ? 'sk-ant-...' : 'sk-...'}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>BYOK Base URL</label>
                        <input
                          type="text"
                          value={clientModal.client.baseUrl || ''}
                          onChange={(e) => updateModalClient({ baseUrl: e.target.value })}
                          className={inputCls}
                          placeholder={(clientModal.client.copilotByokProvider || 'openai') === 'anthropic' ? 'https://api.anthropic.com/v1' : 'https://api.openai.com/v1'}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={checkCopilotRuntime}
                      disabled={loading}
                      className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                    >
                      {loading ? 'Checking...' : 'Check Copilot Runtime'}
                    </button>
                    {copilotRuntimeStatus && (
                      <span className={`text-[10px] ${copilotRuntimeStatus.available ? 'text-[var(--success-color)]' : 'text-[var(--danger-color)]'}`}>
                        {copilotRuntimeStatus.available
                          ? `Ready${copilotRuntimeStatus.version ? ` (${copilotRuntimeStatus.version})` : ''}`
                          : copilotRuntimeStatus.message}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <label className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  checked={clientModal.client.enabled}
                  onChange={(e) => updateModalClient({ enabled: e.target.checked })}
                  className="rounded border-[var(--border-color)]"
                />
                Enabled for selection
              </label>

              {modelList && (
                <div className="mt-4 p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] overflow-hidden">
                  <h5 className="text-[10px] font-bold text-[var(--accent-primary)] mb-1 uppercase">Gemini Models:</h5>
                  <div className="text-[10px] text-[var(--text-secondary)] font-mono max-h-24 overflow-y-auto break-all whitespace-pre-wrap">
                    {modelList}
                  </div>
                </div>
              )}
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => setClientModal({ open: false, mode: 'add', client: null })}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              {clientModal.client.provider === 'gemini' && (
                <button
                  onClick={() => handleListModels(clientModal.client)}
                  disabled={loading}
                  className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  {loading ? '...' : 'List Models'}
                </button>
              )}
              <button
                onClick={() => testClientConnectivity(clientModal.client!)}
                disabled={testingClientId === clientModal.client.id}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                {testingClientId === clientModal.client.id ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={saveModalClient}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDeleteClient && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">Delete LLM Client</h5>
            </div>
            <div className="px-4 py-4 space-y-2">
              <p className="text-xs text-[var(--text-secondary)]">
                Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)]">{pendingDeleteClient.name}</span>?
              </p>
              <p className="text-[10px] text-[var(--text-tertiary)]">This removes the client profile from AI Assistant settings.</p>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => setPendingDeleteClient(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteClient(pendingDeleteClient.id);
                  setPendingDeleteClient(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
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
  const [pendingDeleteMacro, setPendingDeleteMacro] = useState<{ id: string; name: string } | null>(null);

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
                    onClick={() => setPendingDeleteMacro({ id: macro.id, name: macro.name })}
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

// ─── Rotary section ──────────────────────────────────────────────────────────

function RotaryContent() {
  const { settings, setRotarySettings } = useSettingsStore();
  const rotary = settings.rotary;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';
  
  const subHeaderCls = "text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-3 mt-1";

  // Calculations
  const calcStepsPerMm = rotary.rotaryType === 'Roller'
    ? (rotary.stepsPerRevolution * rotary.microstepping) / (Math.PI * rotary.rollerDiameter)
    : (rotary.stepsPerRevolution * rotary.microstepping) / (Math.PI * rotary.objectDiameter);

  const calcStepsPerDegree = (rotary.stepsPerRevolution * rotary.microstepping) / 360;

  return (
    <div className="space-y-8">
      
      {/* 1. Hardware Setup */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={subHeaderCls}>1. Hardware Setup</h4>
          <Tooltip content="Enable or disable Rotary Mode globally" position="left">
            <button
              onClick={() => setRotarySettings({ enabled: !rotary.enabled })}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                rotary.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  rotary.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </Tooltip>
        </div>

        <div className="grid grid-cols-2 gap-4 opacity-100 transition-opacity">
          <Tooltip content="Choose how your rotary is wired: Swapping a Y/X motor, or using a dedicated 4th axis" position="top">
            <div>
              <label className={labelCls}>Strategy</label>
              <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                  <button
                    onClick={() => setRotarySettings({ strategy: 'A_Swap' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.strategy === 'A_Swap'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Axis Swap
                  </button>
                  <button
                    onClick={() => setRotarySettings({ strategy: 'B_Dedicated' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.strategy === 'B_Dedicated'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Dedicated A-Axis
                  </button>
              </div>
            </div>
          </Tooltip>
          
          <Tooltip content="Roller uses a fixed roller diameter. Chuck uses the actual object's diameter." position="top">
            <div>
              <label className={labelCls}>Rotary Type</label>
              <div className="flex gap-1.5 p-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                  <button
                    onClick={() => setRotarySettings({ rotaryType: 'Roller' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.rotaryType === 'Roller'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Roller
                  </button>
                  <button
                    onClick={() => setRotarySettings({ rotaryType: 'Chuck' })}
                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${
                      rotary.rotaryType === 'Chuck'
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    Chuck
                  </button>
              </div>
            </div>
          </Tooltip>

          {rotary.strategy === 'A_Swap' && (
            <Tooltip content="Which standard axis is unplugged / substituted by the rotary stepper" position="top">
              <div>
                <label className={labelCls}>Swapped Axis</label>
                <select
                  value={rotary.swapAxis}
                  onChange={(e) => setRotarySettings({ swapAxis: e.target.value as any })}
                  className={inputCls}
                >
                  <option value="X">X-Axis</option>
                  <option value="Y">Y-Axis</option>
                  <option value="Z">Z-Axis</option>
                </select>
              </div>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 2. Calibration Calculations */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>2. Calibration Calculations</h4>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Number of full steps the stepper motor requires for 1 revolution (e.g. 200 for 1.8 degree motors)" position="top">
            <div>
              <label className={labelCls}>Motor Steps/Rev</label>
              <input
                type="number"
                value={rotary.stepsPerRevolution}
                onChange={(e) => setRotarySettings({ stepsPerRevolution: parseInt(e.target.value) || 200 })}
                className={inputCls}
                step={100}
              />
            </div>
          </Tooltip>
          
          <Tooltip content="Microsteps set on the stepper driver hardware (e.g., 16, 32, etc.)" position="top">
            <div>
              <label className={labelCls}>Microstepping (Driver setting)</label>
              <input
                type="number"
                value={rotary.microstepping}
                onChange={(e) => setRotarySettings({ microstepping: parseInt(e.target.value) || 16 })}
                className={inputCls}
              />
            </div>
          </Tooltip>
          
          {rotary.rotaryType === 'Roller' ? (
            <Tooltip content="The exact diameter (in mm) of the rubber rollers driving the object" position="top">
              <div>
                <label className={labelCls}>Roller Diameter (mm)</label>
                <input
                  type="number"
                  value={rotary.rollerDiameter}
                  onChange={(e) => setRotarySettings({ rollerDiameter: parseFloat(e.target.value) || 40 })}
                  className={inputCls}
                  step={0.1}
                />
              </div>
            </Tooltip>
          ) : (
            <Tooltip content="The diameter (in mm) of the material securely held in the chuck" position="top">
              <div>
                <label className={labelCls}>Object Diameter (mm)</label>
                <input
                  type="number"
                  value={rotary.objectDiameter}
                  onChange={(e) => setRotarySettings({ objectDiameter: parseFloat(e.target.value) || 50 })}
                  className={inputCls}
                  step={0.1}
                />
                <p className="mt-1 text-[9px] text-[var(--text-tertiary)] italic">
                  A Chuck on $101 requires changing this value per object.
                </p>
              </div>
            </Tooltip>
          )}
        </div>

        {/* Dynamic Display of Value */}
        <Tooltip content="Update your controller firmware config with these calculated steps" position="top">
          <div className="mt-4 p-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
              <h5 className="text-[10px] uppercase font-bold text-[var(--text-tertiary)] mb-2">Calculated Value</h5>
              {rotary.strategy === 'B_Dedicated' ? (
                 <div className="flex justify-between items-center">
                     <div className="text-xl font-bold text-[var(--accent-primary)]">{calcStepsPerDegree.toFixed(3)}</div>
                     <div className="text-xs text-[var(--text-secondary)]">Steps per Degree</div>
                 </div>
              ) : (
                 <div className="flex justify-between items-center">
                     <div className="text-xl font-bold text-[var(--accent-primary)]">{calcStepsPerMm.toFixed(3)}</div>
                     <div className="text-xs text-[var(--text-secondary)]">Steps per mm</div>
                 </div>
              )}
              <p className="mt-2 text-[10px] text-[var(--text-tertiary)]">
                  {rotary.strategy === 'B_Dedicated' 
                   ? `Set $103=${calcStepsPerDegree.toFixed(3)} or 'steps_per_mm' in your fluidnc A-axis block.`
                   : `Set $101=${calcStepsPerMm.toFixed(3)} or 'steps_per_mm' in your fluidnc Y-axis block.`}
              </p>
          </div>
        </Tooltip>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 3. FluidNC Environments */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>3. FluidNC Config Files</h4>
        <p className="text-[10px] text-[var(--text-tertiary)] leading-relaxed -mt-2 mb-3">
          Switching configurations quickly is a feature of FluidNC. Ensure these files exist on your controller.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Path to your default non-rotary FluidNC config.yaml" position="top">
            <div>
              <label className={labelCls}>Standard Config</label>
              <input
                type="text"
                value={rotary.standardConfigPath}
                onChange={(e) => setRotarySettings({ standardConfigPath: e.target.value })}
                className={inputCls}
                placeholder="config.yaml"
              />
              <button 
                onClick={() => transport.invoke('send_gcode', { cmd: `?$Config/Filename=${rotary.standardConfigPath}` })}
                className="mt-2 w-full text-[10px] py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] rounded transition-colors"
              >
                Load Standard
              </button>
            </div>
          </Tooltip>
          
          <Tooltip content="Path to your secondary FluidNC rotary config (e.g. rotary.yaml)" position="top">
            <div>
              <label className={labelCls}>Rotary Config</label>
              <input
                type="text"
                value={rotary.rotaryConfigPath}
                onChange={(e) => setRotarySettings({ rotaryConfigPath: e.target.value })}
                className={inputCls}
                placeholder="rotary.yaml"
              />
              <button 
                onClick={() => transport.invoke('send_gcode', { cmd: `?$Config/Filename=${rotary.rotaryConfigPath}` })}
                className="mt-2 w-full text-[10px] py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)] rounded transition-colors"
              >
                Load Rotary
              </button>
            </div>
          </Tooltip>
        </div>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      {/* 4. Motion Parameters */}
      <div className="space-y-4">
        <h4 className={subHeaderCls}>4. Constraints & Motion Limits</h4>
        <div className="grid grid-cols-2 gap-4">
          <Tooltip content="Max velocity limit for the axis in GRBL ($110/$111/$113) or fluidnc 'max_travel_mm_per_min'" position="top">
            <div>
              <label className={labelCls}>Max Rate ({rotary.strategy === 'B_Dedicated' ? 'degrees/min' : 'mm/min'})</label>
              <input
                type="number"
                value={rotary.maxRate}
                onChange={(e) => setRotarySettings({ maxRate: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </div>
          </Tooltip>
          
          <Tooltip content="Max acceleration limit for the axis in GRBL ($120/$121/$123) or fluidnc 'acceleration_mm_per_sec2'" position="top">
            <div>
              <label className={labelCls}>Acceleration ({rotary.strategy === 'B_Dedicated' ? 'deg/sec²' : 'mm/sec²'})</label>
              <input
                type="number"
                value={rotary.acceleration}
                onChange={(e) => setRotarySettings({ acceleration: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
               <p className="mt-1 text-[9px] text-[var(--accent-primary)] italic">
                Keep low (e.g. 50-100) on Roller to prevent slip!
              </p>
            </div>
          </Tooltip>
        </div>
      </div>

    </div>
  );
}

// ─── Camera section ──────────────────────────────────────────────────────────

function CameraContent() {
  const { settings, setCameraSettings } = useSettingsStore();
  const cam = settings.camera;

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Enable Camera Viewer</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Allow viewing camera stream and controlling settings from the UI.
          </p>
        </div>
        <button
          onClick={() => setCameraSettings({ enabled: !cam.enabled })}
          className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            cam.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)]'
          }`}
          role="switch"
          aria-checked={cam.enabled}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              cam.enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <div className="border-t border-[var(--border-color)]" />

      <div>
        <label className={labelCls}>Stream URL</label>
        <input
          type="text"
          value={cam.streamUrl}
          onChange={(e) => setCameraSettings({ streamUrl: e.target.value })}
          placeholder="http://192.168.1.100:8080/stream"
          className={inputCls}
        />
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The exact URL where the MJPEG stream is hosted.
        </p>
      </div>

      <div>
        <label className={labelCls}>Crowsnest Config Path</label>
        <input
          type="text"
          value={cam.crowsnestConfigPath}
          onChange={(e) => setCameraSettings({ crowsnestConfigPath: e.target.value })}
          placeholder="/home/user/printer_data/config/crowsnest.conf"
          className={inputCls}
        />
        <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
          The absolute path to your crowsnest.conf file on the server.
        </p>
      </div>
    </div>
  );
}

// ─── Navigation section ───────────────────────────────────────────────────────

function NavigationContent() {
  const { settings, setAiSettings, setStatsSettings, setCameraSettings, setAtcSettings, setToolLibrarySettings, setFluidncManagerSettings } = useSettingsStore();

  const buttons = [
    { 
      id: 'camera', 
      label: 'Camera Viewer', 
      enabled: settings.camera.enabled, 
      toggle: () => setCameraSettings({ enabled: !settings.camera.enabled }),
      icon: <Camera className="w-4 h-4" />
    },
    { 
      id: 'ai', 
      label: 'AI Assistant', 
      enabled: settings.ai.enabled, 
      toggle: () => setAiSettings({ enabled: !settings.ai.enabled }),
      icon: <Bot className="w-4 h-4" />
    },
    { 
      id: 'stats', 
      label: 'Machine Statistics', 
      enabled: settings.stats.enabled, 
      toggle: () => setStatsSettings({ enabled: !settings.stats.enabled }),
      icon: <BarChart2 className="w-4 h-4" />
    },
    { 
      id: 'library', 
      label: 'Bit Library', 
      enabled: settings.toolLibrary.enabled, 
      toggle: () => setToolLibrarySettings({ enabled: !settings.toolLibrary.enabled }),
      icon: <Wrench className="w-4 h-4" />
    },
    { 
      id: 'tools', 
      label: 'Tool Changer', 
      enabled: settings.atc.enabled, 
      toggle: () => setAtcSettings({ enabled: !settings.atc.enabled }),
      icon: <Drill className="w-4 h-4" />
    },
    ...(!settings.general.legacyGrblMode ? [{ 
      id: 'manager', 
      label: 'FluidNC Manager', 
      enabled: settings.fluidncManager.enabled, 
      toggle: () => setFluidncManagerSettings({ enabled: !settings.fluidncManager.enabled }),
      icon: <SlidersHorizontal className="w-4 h-4" />
    }] : []),
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--text-tertiary)] mb-4 italic">
        Toggle which buttons are visible in the top navigation menu.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {buttons.map((btn) => (
          <div key={btn.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <span className="text-[var(--accent-primary)]">{btn.icon}</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{btn.label}</span>
            </div>
            <button
              onClick={btn.toggle}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                btn.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--border-color)]'
              }`}
              role="switch"
              aria-checked={btn.enabled}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  btn.enabled ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {pendingDeleteMacro && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
              <h5 className="text-sm font-semibold text-[var(--text-primary)]">Delete Macro</h5>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-[var(--text-secondary)]">
                Delete macro <span className="font-semibold text-[var(--text-primary)]">{pendingDeleteMacro.name}</span>?
              </p>
            </div>
            <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
              <button
                onClick={() => setPendingDeleteMacro(null)}
                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMacro(pendingDeleteMacro.id);
                  setPendingDeleteMacro(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Section definitions ─────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'dashboard',   title: 'Dashboard',      icon: <LayoutGrid className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'widgets',     title: 'Widgets',        icon: <LayoutDashboard className="w-4 h-4" />, tab: 'dashboard' },
  { id: 'theme',       title: 'Theme & UX',     icon: <Palette className="w-4 h-4" />, tab: 'ui' },
  { id: 'navigation',  title: 'Top Menu',       icon: <Activity className="w-4 h-4" />, tab: 'ui' },
  { id: 'visualizer',  title: 'Bed Visualizer', icon: <Box className="w-4 h-4" />, tab: 'ui' },
  { id: 'stats',       title: 'Stats Display',  icon: <BarChart2 className="w-4 h-4" />, tab: 'ui' },
  { id: 'camera',      title: 'Camera',         icon: <Camera className="w-4 h-4" />, tab: 'ui' },
  { id: 'general',     title: 'General',        icon: <SlidersHorizontal className="w-4 h-4" />, tab: 'machine' },
  { id: 'connection',  title: 'Connection',     icon: <Cable className="w-4 h-4" />, tab: 'machine' },
  { id: 'file-manager', title: 'File Manager',   icon: <Folder className="w-4 h-4" />, tab: 'machine' },
  { id: 'probe',       title: 'Probe',          icon: <Crosshair className="w-4 h-4" />, tab: 'machine' },
  { id: 'spindle',     title: 'Spindle',        icon: <Cpu className="w-4 h-4" />, tab: 'machine' },
  { id: 'macros',      title: 'Macros',         icon: <FileCode className="w-4 h-4" />, tab: 'machine' },
  { id: 'atc',         title: 'Tool Changer',   icon: <Wrench className="w-4 h-4" />, tab: 'machine' },
  { id: 'rotary',      title: 'Rotary Config',  icon: <RotateCw className="w-4 h-4" />, tab: 'machine' },
  { id: 'ai',          title: 'AI Assistant',   icon: <Bot className="w-4 h-4" />, tab: 'machine' },
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
  if (id === 'atc')          return <AtcContent />;
  if (id === 'rotary')       return <RotaryContent />;
  if (id === 'stats')        return <StatsContent />;
  if (id === 'camera')       return <CameraContent />;
  if (id === 'ai')           return <AIAssistantContent />;
  if (id === 'navigation')   return <NavigationContent />;
  if (id === 'visualizer') return <VisualizerContent />;
  if (id === 'macros')     return <MacrosContent />;
  return undefined; // renders placeholder
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const { settingsOpen, settingsTab, settingsSection, closeSettings, setSettingsTab } = useUIStore();
  const { hasHomed } = useMachineStore();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
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
          data-testid="settings-panel-trigger"
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
            className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-4xl border border-[var(--border-color)] overflow-hidden flex flex-col"
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

            {/* Quick Setup Wizard Banner */}
            <div className="mx-4 mt-4 p-3 bg-blue-600/10 rounded-xl border border-blue-500/30 flex items-center justify-between gap-4 group hover:bg-blue-600/15 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">Quick Setup Wizard</h4>
                    <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-1">Connection, Axis Direction & Homing Calibration.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-1.5 shrink-0"
                >
                  <Play className="w-3 h-3" />
                  {hasHomed ? 'Restart' : 'Start'}
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
                        onClick={() => setSettingsTab('ui')}
                        className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 cursor-pointer ${
                            settingsTab === 'ui'
                                ? 'bg-[var(--bg-secondary)] text-[var(--accent-primary)] shadow-sm border border-[var(--border-color)]'
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        <Palette className="w-3.5 h-3.5" />
                        UI Controls
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

            {/* Main Content Area with Optional Sidebar */}
            <div className="flex flex-1 overflow-hidden relative">
              {/* Sidebar - only show if not searching and we are in UI or Machine tabs */}
              {!query && (settingsTab === 'ui' || settingsTab === 'machine') && (
                <div className="w-56 bg-[var(--bg-tertiary)]/30 border-r border-[var(--border-color)] overflow-y-auto py-6 flex-shrink-0 hidden md:block select-none">
                  <div className="px-4 space-y-1">
                    <div className="px-2 mb-4">
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest opacity-60">
                        {settingsTab === 'ui' ? 'UI Navigation' : 'Machine Navigation'}
                      </span>
                    </div>
                    {visibleSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => {
                          const el = document.getElementById(`settings-section-${section.id}`);
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] transition-all duration-200 group text-left border border-transparent hover:border-[var(--border-color)] active:scale-[0.98]"
                      >
                        <span className="p-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] group-hover:border-[var(--accent-primary)]/30 group-hover:shadow-sm transition-all duration-200">
                          {section.icon}
                        </span>
                        <span className="truncate">{section.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scrollable sections */}
              <div 
                ref={scrollContainerRef} 
                className="overflow-y-auto flex-1 px-6 py-8 space-y-8 custom-scrollbar scroll-smooth"
              >
                {visibleSections.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Search className="w-10 h-10 text-[var(--text-tertiary)] mb-4 opacity-50" />
                    <p className="text-base font-semibold text-[var(--text-secondary)]">
                      No results found for "{search}"
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-2">
                      Try searching for a different setting or feature.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-10">
                    {visibleSections.map((section) => (
                      <div key={section.id} id={`settings-section-${section.id}`} className="scroll-mt-8">
                        <SettingsSection title={section.title} icon={section.icon}>
                          {getSectionContent(section.id)}
                        </SettingsSection>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

      <MachineSetupWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
      />
    </>
  );
}
