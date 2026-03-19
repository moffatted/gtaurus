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
import { ProbeContent } from './settings/ProbeContent';
import { SpindleContent } from './settings/SpindleContent';
import AtcContent from './settings/AtcContent';
import MacrosContent from './settings/MacrosContent';

// ─── SettingsSection ─────────────────────────────────────────────────────────

// ─── ATC section ─────────────────────────────────────────────────────────────
// (Extracted to AtcContent.tsx component)



// ─── Macros section ──────────────────────────────────────────────────────────

// ─── Macros section ─────────────────────────────────────────────────────────────
// (Extracted to MacrosContent.tsx component)

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
