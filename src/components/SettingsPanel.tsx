import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  Settings, X, Sun, Moon, Search,
  Palette, SlidersHorizontal, Cable, Crosshair,
  Cpu, Box, History, BarChart2, Wrench, RotateCw, LayoutDashboard,
  ChevronDown, LayoutGrid, ChevronUp, Eye, EyeOff,
  Wifi, UsbIcon, RefreshCw, Power,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { invoke } from '@tauri-apps/api/core';
import { useThemeStore } from '../stores/themeStore';
import { useSettingsStore } from '../stores/settingsStore';

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

// ─── Dashboard section ───────────────────────────────────────────────────────

function DashboardContent() {
  const { settings, setDashboardPanelEnabled, setDashboardPanelSize, moveDashboardPanelUp, moveDashboardPanelDown } =
    useSettingsStore();

  const sorted = [...settings.dashboardPanels].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--text-tertiary)] pb-1">
        Enable panels and drag to set the display order on your Dashboard.
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

          {/* Size Input */}
          <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity mr-2">
            <span className="text-[10px] uppercase text-[var(--text-tertiary)] tracking-wider">Size</span>
            <input
              type="number"
              min="100"
              max="2000"
              step="10"
              className="w-16 px-1.5 py-0.5 text-xs text-center rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
              placeholder="Auto"
              value={panel.size || ''}
              onChange={(e) => {
                const val = e.target.value;
                setDashboardPanelSize(panel.id, val ? parseInt(val, 10) : undefined);
              }}
              disabled={!panel.enabled}
            />
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
  const [serialPort, setSP]     = useState(conn.serialPort);
  const [baudRate, setBaud]     = useState(String(conn.baudRate));
  const [ports, setPorts]       = useState<string[]>([]);
  const [loadingPorts, setLP]   = useState(false);
  const [status, setStatus]     = useState('Disconnected');
  const [disconnecting, setDis] = useState(false);

  const refreshStatus = async () => {
    try {
      const s = await invoke<string>('get_connection_status');
      setStatus(s);
    } catch {
      setStatus('Disconnected');
    }
  };

  const handleDisconnect = async () => {
    setDis(true);
    try {
      await invoke('disconnect');
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
      const list = await invoke<string[]>('list_serial_ports');
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

  const saveSerial = (newPort?: string, newBaud?: string) => {
    const baud = parseInt(newBaud ?? baudRate, 10);
    updateSettings({
      connection: { ...conn, serialPort: newPort ?? serialPort, baudRate: isNaN(baud) ? 115200 : baud },
    });
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
    </div>
  );
}

// ─── Visualizer section ───────────────────────────────────────────────────────

function VisualizerContent() {
  const { settings, setShowAutolevelMesh } = useSettingsStore();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-primary)]">Show Autolevel Mesh</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Display the generated autolevel heightmap overlay on the CNC bed.
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
    </div>
  );
}

// ─── Section definitions ─────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'dashboard',   title: 'Dashboard',      icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'theme',       title: 'Theme',          icon: <Palette className="w-4 h-4" /> },
  { id: 'general',     title: 'General',        icon: <SlidersHorizontal className="w-4 h-4" /> },
  { id: 'connection',  title: 'Connection',     icon: <Cable className="w-4 h-4" /> },
  { id: 'probe',       title: 'Probe',          icon: <Crosshair className="w-4 h-4" /> },
  { id: 'spindle',     title: 'Spindle',        icon: <Cpu className="w-4 h-4" /> },
  { id: 'visualizer',  title: 'Bed Visualizer',     icon: <Box className="w-4 h-4" /> },
  { id: 'history',     title: 'History',        icon: <History className="w-4 h-4" /> },
  { id: 'stats',       title: 'Stats',          icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'toolchanger', title: 'Tool Changer',   icon: <Wrench className="w-4 h-4" /> },
  { id: 'rotary',      title: 'Rotary Config',  icon: <RotateCw className="w-4 h-4" /> },
  { id: 'widgets',     title: 'Widgets',        icon: <LayoutDashboard className="w-4 h-4" /> },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function getSectionContent(id: SectionId): ReactNode | undefined {
  if (id === 'dashboard')  return <DashboardContent />;
  if (id === 'theme')      return <ThemeContent />;
  if (id === 'connection') return <ConnectionContent />;
  if (id === 'visualizer') return <VisualizerContent />;
  return undefined; // renders placeholder
}

// ─── SettingsPanel ───────────────────────────────────────────────────────────

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const query = search.trim().toLowerCase();
  const visibleSections = SECTIONS.filter((s) => s.title.toLowerCase().includes(query));

  return (
    <>
      {/* Trigger */}
      <Tooltip content="Settings & Preferences" position="bottom">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
          aria-label="Open settings"
        >
          <Settings className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>
      </Tooltip>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-[var(--bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--border-color)] overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Settings</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer"
                aria-label="Close settings"
              >
                <X className="w-5 h-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0">
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
            </div>

            {/* Scrollable sections */}
            <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3">
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
                  <SettingsSection key={section.id} title={section.title} icon={section.icon}>
                    {getSectionContent(section.id)}
                  </SettingsSection>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-header)] flex justify-end flex-shrink-0">
              <button
                onClick={() => setIsOpen(false)}
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
