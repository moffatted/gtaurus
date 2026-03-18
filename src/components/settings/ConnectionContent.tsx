import { useEffect, useState } from 'react';
import { Wifi, UsbIcon, RefreshCw, Power, Activity } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { isTauriApp } from '../../utils/platform';
import { transport } from '../../services/transportService';

export function ConnectionContent() {
  const { settings, updateSettings } = useSettingsStore();
  const conn = settings.connection;

  const [wsHost, setWsHost] = useState(conn.wsHost);
  const [wsPort, setWsPort] = useState(String(conn.wsPort));
  const [bridgeHost, setBridgeHost] = useState(conn.bridgeHost || window.location.hostname);
  const [bridgePort, setBridgePort] = useState(String(conn.bridgePort || import.meta.env.VITE_BACKEND_PORT || 9001));
  const [pollInterval, setPollInterval] = useState(String(conn.statusPollInterval));
  const [serialPort, setSP] = useState(conn.serialPort);
  const [baudRate, setBaud] = useState(String(conn.baudRate || 115200));
  const [ports, setPorts] = useState<string[]>([]);
  const [loadingPorts, setLoadingPorts] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    fetchPorts();
    void transport.invoke<string>('get_status').then((s) => setStatus(s)).catch(() => {});
  }, []);

  const fetchPorts = async () => {
    setLoadingPorts(true);
    try {
      const list = await transport.invoke<string[]>('list_serial_ports');
      setPorts(Array.isArray(list) ? list : []);
    } catch {
      setPorts([]);
    } finally {
      setLoadingPorts(false);
    }
  };

  const saveWifi = () => {
    const host = wsHost.trim() || '192.168.68.61';
    const port = Math.max(1, Math.min(65535, parseInt(wsPort || '23', 10) || 23));
    updateSettings({
      connection: {
        ...conn,
        wsHost: host,
        wsPort: port,
      },
    });
  };

  const saveSerial = (newPort?: string, newBaud?: string) => {
    const port = newPort ?? serialPort;
    const baud = parseInt(newBaud ?? baudRate, 10) || 115200;
    updateSettings({
      connection: {
        ...conn,
        serialPort: port,
        baudRate: baud,
      },
    });
  };

  const saveBridge = () => {
    const host = bridgeHost.trim() || window.location.hostname;
    const port = Math.max(1, Math.min(65535, parseInt(bridgePort || '9001', 10) || 9001));
    updateSettings({
      connection: {
        ...conn,
        bridgeHost: host,
        bridgePort: port,
      },
    });

    void transport.reconnect(host, port).then(() => {
      setStatus('Connected');
    }).catch(() => {
      setStatus('Disconnected');
    });
  };

  const savePoll = () => {
    const next = Math.max(1000, Math.min(10000, parseInt(pollInterval || '2000', 10) || 2000));
    setPollInterval(String(next));
    updateSettings({
      connection: {
        ...conn,
        statusPollInterval: next,
      },
    });
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await transport.invoke('disconnect');
      setStatus('Disconnected');
    } catch (err) {
      console.warn('[settings] Disconnect failed:', err);
    } finally {
      setDisconnecting(false);
    }
  };

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  return (
    <div className="space-y-5">
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
