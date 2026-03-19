/**
 * @file SettingsPanel.tsx
 * @purpose Comprehensive configuration interface for application, UI, and machine-specific settings.
 */
import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  Settings, X, Search, Bot,
  Palette, SlidersHorizontal, Cable, Crosshair,
  Cpu, Box, History, BarChart2, Wrench, RotateCw, LayoutDashboard,
  ChevronDown, LayoutGrid, ChevronUp, Eye, EyeOff,
  Wifi, UsbIcon, RefreshCw, Power, Activity,
  Folder, HardDrive, Plus, Trash, Edit, Save, FileCode, Play, Camera, Drill,
  RotateCcw
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../stores/settingsStore';
import { useUIStore } from '../stores/uiStore';
import { ConfirmPopover } from './ui/Popovers';
import { isTauriApp } from '../utils/platform';
import { transport } from '../services/transportService';
import { MachineSetupWizard } from './wizards/MachineSetupWizard';
import { useMachineStore } from '../stores/machineStore';
import { ThemeContent } from './settings/ThemeContent';
import { GeneralContent } from './settings/GeneralContent';
import { DashboardContent } from './settings/DashboardContent';
import { SettingsSection } from './settings/SettingsSection';
import { ConnectionContent as SettingsConnectionContent } from './settings/ConnectionContent';
import { FileManagerContent as SettingsFileManagerContent } from './settings/FileManagerContent';
import { VisualizerContent as SettingsVisualizerContent } from './settings/VisualizerContent';
import { StatsContent as SettingsStatsContent } from './settings/StatsContent';
import { AIAssistantContent } from './settings/AIAssistantContent';
import { NavigationContent } from './settings/NavigationContent';

// ─── SettingsSection ─────────────────────────────────────────────────────────

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
  if (id === 'connection') return <SettingsConnectionContent />;
  if (id === 'file-manager') return <SettingsFileManagerContent />;
  if (id === 'probe')        return <ProbeContent />;
  if (id === 'spindle')      return <SpindleContent />;
  if (id === 'atc')          return <AtcContent />;
  if (id === 'rotary')       return <RotaryContent />;
  if (id === 'stats')        return <SettingsStatsContent />;
  if (id === 'camera')       return <CameraContent />;
  if (id === 'ai')           return <AIAssistantContent />;
  if (id === 'navigation')   return <NavigationContent />;
  if (id === 'visualizer') return <SettingsVisualizerContent />;
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
