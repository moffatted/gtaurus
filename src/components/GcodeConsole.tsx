/**
 * @file GcodeConsole.tsx
 * @purpose Specialized terminal interface for sending manual G-code commands and viewing machine responses.
 */
import {
  useEffect,
  useRef,
  useState,
  KeyboardEvent,
} from 'react';
import {
  Terminal,
  Wifi,
  Usb,
  Play,
  Square,
  RotateCcw,
  RefreshCw,
  HelpCircle,
  X,
  ChevronRight,
  AlertTriangle,
  PlugZap,
  Unplug,
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { useSettingsStore } from '../stores/settingsStore';
import { isTauriApp } from '../utils/platform';
import { transport } from '../services/transportService';

import { useConsoleStore, type LineType } from '../stores/consoleStore';


const LINE_STYLES: Record<LineType, string> = {
  cmd:    'text-[var(--accent-primary)]',
  ok:     'text-emerald-400/80',
  error:  'text-red-400',
  alarm:  'text-red-500 font-bold',
  status: 'text-cyan-400',
  msg:    'text-amber-400',
  info:   'text-[var(--text-tertiary)]',
  sys:    'text-violet-400 italic',
};

// ─── Connection Dialog ────────────────────────────────────────────────────────

interface ConnectDialogProps {
  onClose: () => void;
  onConnected: () => void;
}

function ConnectDialog({ onClose, onConnected }: ConnectDialogProps) {
  const { settings, updateSettings } = useSettingsStore();
  const conn = settings.connection;

  const [mode, setMode]         = useState<'telnet' | 'serial' | 'websocket'>(
    conn.preferredMode || 'websocket'
  );
  const [wsHost, setWsHost]     = useState(conn.wsHost);
  const [wsPort, setWsPort]     = useState(conn.wsPort ?? 23);
  const [bridgeHost, setBridgeHost] = useState(conn.bridgeHost || window.location.hostname);
  const [bridgePort, setBridgePort] = useState(conn.bridgePort || Number(import.meta.env.VITE_BACKEND_PORT) || 9001);
  const [port, setPort]         = useState(conn.serialPort);
  const [baud, setBaud]         = useState(conn.baudRate);
  const [ports, setPorts]       = useState<string[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    if (mode === 'serial' && isTauriApp()) {
      transport.invoke<string[]>('list_serial_ports').then(setPorts).catch(() => setPorts([]));
    }
  }, [mode]);

  async function handleConnect() {
    setConnecting(true);
    setError('');
    try {
      if (mode === 'websocket') {
        transport.setMode('websocket');
        transport.reconnect(bridgeHost, bridgePort);
        // Delay status check slightly to allow bridge connection
        setTimeout(() => {
            transport.invoke<string>('get_connection_status').then(s => {
                if (s !== 'Disconnected') {
                    onConnected();
                    onClose();
                }
            }).catch(() => {});
        }, 500);
      } else if (mode === 'telnet') {
        if (isTauriApp()) transport.setMode('native');
        await transport.invoke('connect_telnet', { host: wsHost, wsPort });
        updateSettings({ connection: { ...conn, preferredMode: 'telnet', wsHost, wsPort } });
        onConnected();
        onClose();
      } else {
        if (isTauriApp()) transport.setMode('native');
        await transport.invoke('connect_serial', { portName: port, baudRate: baud });
        updateSettings({ connection: { ...conn, preferredMode: 'serial', serialPort: port, baudRate: baud } });
        onConnected();
        onClose();
      }
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] shadow-2xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <PlugZap className="w-5 h-5 text-[var(--accent-primary)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connect to FluidNC</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] cursor-pointer">
            <X className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Mode selector */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)]">
            {(['telnet', 'serial', 'websocket'] as const)
              .map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 border-r last:border-r-0 border-[var(--border-color)] text-xs font-medium transition-all cursor-pointer ${
                  mode === m
                    ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                {m === 'telnet' && <><Wifi className="w-3.5 h-3.5" /> Telnet</>}
                {m === 'serial' && <><Usb className="w-3.5 h-3.5" /> USB</>}
                {m === 'websocket' && <><RefreshCw className="w-3.5 h-3.5" /> Bridge</>}
              </button>
            ))}
          </div>

          {/* Fields */}
          {mode === 'websocket' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Bridge Host
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={bridgeHost}
                    onChange={(e) => setBridgeHost(e.target.value)}
                    placeholder="localhost"
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <input
                    type="number"
                    value={bridgePort}
                    onChange={(e) => setBridgePort(Number(e.target.value))}
                    className="w-20 px-2 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'telnet' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Host
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wsHost}
                    onChange={(e) => setWsHost(e.target.value)}
                    placeholder="fluidnc.local"
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                  <input
                    type="number"
                    value={wsPort}
                    onChange={(e) => setWsPort(Number(e.target.value))}
                    min={1}
                    max={65535}
                    className="w-20 px-2 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">
                  Connects to <code className="font-mono">{wsHost}:{wsPort}</code> (TCP/Telnet)
                </p>
              </div>
            </div>
          )}

          {mode === 'serial' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Serial Port</label>
                <select
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                >
                  <option value="">Select port…</option>
                  {ports.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Baud Rate</label>
                <select
                  value={baud}
                  onChange={(e) => setBaud(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                >
                  {[9600, 19200, 38400, 57600, 115200, 230400].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/30 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-color)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={connecting || (mode === 'serial' && !port) || (mode === 'telnet' && !wsHost) || (mode === 'websocket' && !bridgeHost)}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting ? 'Connecting…' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GcodeConsole ─────────────────────────────────────────────────────────────

const MAX_HISTORY = 50;

export function GcodeConsole() {
  const { settings } = useSettingsStore();
  const { lines, appendLine } = useConsoleStore();
  const [input, setInput]             = useState('');
  const [connected, setConnected]     = useState(false);
  const [statusLabel, setStatusLabel] = useState('Disconnected');
  const [showConnect, setShowConnect] = useState(false);
  const [cmdHistory, setCmdHistory]   = useState<string[]>([]);
  const [histIdx, setHistIdx]         = useState(-1);

  const logRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);


  // Auto-scroll log to bottom
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [lines]);

  // Listen for FluidNC RX events
  useEffect(() => {
    let unlisten: any | null = null;

    transport.listen<string>('fluidnc://rx', (event: any) => {
      const text = event.payload.trim();
      if (!text) return;
      appendLine(text);

      // Auto-detect connection from traffic
      if (text.startsWith('<') && text.endsWith('>')) {
        setConnected(true);
      }

      // Detect connection-closed messages
      if (text.includes('connection closed') || text.includes('read error')) {
        setConnected(false);
        setStatusLabel('Disconnected');
      }
    }).then((fn) => { unlisten = fn; });

    return () => { unlisten?.(); };
  }, [appendLine]);

  // Sync connection status from backend regularly
  useEffect(() => {
    const syncStatus = () => {
        transport.invoke<string>('get_connection_status')
          .then((s) => {
            setStatusLabel(s);
            setConnected(s !== 'Disconnected');
          })
          .catch(() => {});
    };

    syncStatus();
    const interval = setInterval(syncStatus, settings.connection.statusPollInterval || 2000);
    return () => clearInterval(interval);
  }, [settings.connection.statusPollInterval]);

  // Send a command
  async function sendCommand(cmd: string) {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    appendLine(`> ${trimmed}`, 'cmd');
    try {
      await transport.invoke('send_gcode', { cmd: trimmed });
    } catch (e) {
      appendLine(`error: ${String(e)}`, 'error');
    }
    setCmdHistory((prev) => {
      const next = [trimmed, ...prev.filter((c) => c !== trimmed)].slice(0, MAX_HISTORY);
      return next;
    });
    setHistIdx(-1);
    setInput('');
  }

  // Send a realtime byte
  async function sendRealtime(byte: number, label: string) {
    if (!connected) return;
    appendLine(`> [${label}]`, 'cmd');
    try {
      await transport.invoke('send_realtime', { byte });
    } catch (e) {
      appendLine(`error: ${String(e)}`, 'error');
    }
  }

  function handleDisconnect() {
    transport.invoke('disconnect').then(() => {
      setConnected(false);
      setStatusLabel('Disconnected');
      appendLine('[GTaurus] Disconnected', 'sys');
    }).catch(() => {});
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      sendCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, cmdHistory.length - 1);
      setHistIdx(next);
      setInput(cmdHistory[next] ?? '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = histIdx - 1;
      if (next < 0) { setHistIdx(-1); setInput(''); }
      else { setHistIdx(next); setInput(cmdHistory[next]); }
    }
  }

  function handleConnected() {
    transport.invoke<string>('get_connection_status')
      .then((s) => {
        setConnected(true);
        setStatusLabel(s);
      })
      .catch(() => {});
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden min-h-0">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0 flex-wrap">
        <Terminal className="w-4 h-4 text-[var(--accent-primary)] mr-1" />
        <span className="text-xs font-semibold text-[var(--text-primary)] mr-2">G-code Console</span>

        {/* Status badge */}
        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium mr-auto ${
          connected
            ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/30'
            : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-[var(--text-tertiary)]'}`} />
          {statusLabel}
        </span>

        {/* Realtime buttons — only active when connected */}
        <Tooltip content="Status Query (?)" position="bottom">
            <button
            onClick={() => sendRealtime(0x3F, '?')}
            disabled={!connected}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            </button>
        </Tooltip>
        <Tooltip content="Feed Hold (!)" position="bottom">
            <button
            onClick={() => sendRealtime(0x21, '! Feed Hold')}
            disabled={!connected}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
            <Square className="w-3.5 h-3.5 text-amber-400" />
            </button>
        </Tooltip>
        <Tooltip content="Cycle Start / Resume (~)" position="bottom">
            <button
            onClick={() => sendRealtime(0x7E, '~ Resume')}
            disabled={!connected}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            </button>
        </Tooltip>
        <Tooltip content="Soft Reset (Ctrl+X)" position="bottom">
            <button
            onClick={() => sendRealtime(0x18, 'Soft Reset')}
            disabled={!connected}
            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            </button>
        </Tooltip>

        <div className="w-px h-4 bg-[var(--border-color)] mx-0.5" />

        {/* Connect / Disconnect */}
        {connected ? (
          <Tooltip content="Disconnect" position="bottom">
            <button
                onClick={handleDisconnect}
                className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors"
            >
                <Unplug className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Connect to controller" position="bottom">
            <button
                onClick={() => setShowConnect(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium cursor-pointer transition-colors"
            >
                <PlugZap className="w-3 h-3" /> Connect
            </button>
          </Tooltip>
        )}
      </div>

      {/* ── Log ───────────────────────────────────────────────────────────── */}
      <style>{`
        .gcode-log-scroll::-webkit-scrollbar {
          width: 14px;
          height: 14px;
          display: block;
        }
        .gcode-log-scroll::-webkit-scrollbar-track {
          background: var(--bg-secondary);
          border-left: 1px solid var(--border-color);
        }
        .gcode-log-scroll::-webkit-scrollbar-thumb {
          background-color: var(--text-tertiary);
          border-radius: 7px;
          border: 3px solid var(--bg-secondary);
        }
        .gcode-log-scroll::-webkit-scrollbar-thumb:hover {
          background-color: var(--text-secondary);
        }
      `}</style>
      <div
        ref={logRef}
        className="flex-1 overflow-y-scroll gcode-log-scroll px-3 py-2 font-mono text-xs leading-relaxed space-y-0.5 min-h-0"
      >
        {lines.length === 0 && (
          <p className="text-[var(--text-tertiary)] italic mt-4 text-center">
            Console output will appear here. Click <strong>Connect</strong> to get started.
          </p>
        )}
        {lines.map((line) => (
          <div key={line.id} className={`flex items-start gap-2 ${LINE_STYLES[line.type]}`}>
            <ChevronRight className={`w-3 h-3 mt-0.5 flex-shrink-0 ${line.type === 'cmd' ? 'opacity-100' : 'opacity-0'}`} />
            <span className="break-all">{line.text}</span>
          </div>
        ))}
      </div>

      {/* ── Input bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
        <span className="text-[var(--accent-primary)] font-mono text-xs select-none">{'>'}</span>
        <Tooltip content="Type G-code or $ commands (Enter to send)" position="top" className="flex-1">
            <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? 'Type G-code or $ command… (↑↓ for history)' : 'Not connected'}
            disabled={!connected}
            className="w-full bg-transparent text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none disabled:opacity-50"
            autoComplete="off"
            spellCheck={false}
            />
        </Tooltip>
        <Tooltip content="Send command" position="top">
            <button
            onClick={() => sendCommand(input)}
            disabled={!connected || !input.trim()}
            className="px-2.5 py-1 text-xs rounded-md bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-medium cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
            Send
            </button>
        </Tooltip>
      </div>

      {/* ── Connection dialog ──────────────────────────────────────────────── */}
      {showConnect && (
        <ConnectDialog
          onClose={() => setShowConnect(false)}
          onConnected={handleConnected}
        />
      )}
    </div>
  );
}
