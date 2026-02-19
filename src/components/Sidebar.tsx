import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, PlugZap, Usb, Wifi, Power } from "lucide-react";
import clsx from "clsx";
import { isTauriApp } from "../utils/platform";
import { useSettingsStore } from "../stores/settingsStore";
import { Tooltip } from "./ui/Tooltip";

// ─── Logo ─────────────────────────────────────────────────────────────────────

function TaurusLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M30 42 Q14 30 18 14 Q22 4 32 8" strokeWidth="5.5" />
            <path d="M70 42 Q86 30 82 14 Q78 4 68 8" strokeWidth="5.5" />
            <circle cx="50" cy="62" r="26" strokeWidth="5.5" />
        </svg>
    );
}

// ─── Connection panel ─────────────────────────────────────────────────────────

function ConnectionPanel() {
    const { settings } = useSettingsStore();
    const conn = settings.connection;

    // Mode tab — initialise from saved preference
    const [mode, setMode] = useState<'wifi' | 'serial'>(
        conn.preferredMode === 'serial' ? 'serial' : 'wifi'
    );

    // WiFi fields
    const [wsHost, setWsHost] = useState(conn.wsHost);
    const [wsPort, setWsPort] = useState(String(conn.wsPort));

    // Serial fields
    const [selectedPort, setSelectedPort] = useState(conn.serialPort);
    const [baudRate, setBaudRate]          = useState(conn.baudRate);

    // Shared state
    const [status, setStatus]       = useState("Disconnected");
    const [connecting, setConn]     = useState(false);
    const [disconnecting, setDis]   = useState(false);

    // Serial port list
    const { data: ports, refetch, isLoading } = useQuery({
        queryKey: ["serial-ports"],
        queryFn: () => invoke<string[]>("list_serial_ports"),
        enabled: isTauriApp(),
    });

    // Poll connection status every 2 s
    useEffect(() => {
        if (!isTauriApp()) return;
        const tick = async () => {
            try {
                setStatus(await invoke<string>("get_connection_status"));
            } catch {
                setStatus("Disconnected");
            }
        };
        void tick();
        const id = setInterval(tick, 2000);
        return () => clearInterval(id);
    }, []);

    const connected = status !== "Disconnected";

    const handleConnect = async () => {
        setConn(true);
        setStatus("Connecting…");
        try {
            if (mode === 'wifi') {
                const port = parseInt(wsPort, 10);
                await invoke("connect_telnet", {
                    host: wsHost,
                    wsPort: isNaN(port) ? 23 : port,
                });
            } else {
                if (!selectedPort) return;
                await invoke("connect_serial", {
                    portName: selectedPort,
                    baudRate,
                });
            }
        } catch (e) {
            setStatus(`Error: ${e}`);
        } finally {
            setConn(false);
        }
    };

    const handleDisconnect = async () => {
        setDis(true);
        try {
            await invoke("disconnect");
            setStatus("Disconnected");
        } catch {
            // ignore
        } finally {
            setDis(false);
        }
    };

    const inputCls =
        "w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-2 text-sm " +
        "text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] " +
        "focus:ring-1 focus:ring-[var(--accent-primary)]/30 transition-all duration-150";

    return (
        <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex rounded-lg overflow-hidden border border-[var(--border-color)] text-xs font-medium">
                {(['wifi', 'serial'] as const).map((m) => (
                    <Tooltip key={m} content={`Use ${m === 'wifi' ? 'Network (Telnet)' : 'USB Serial'} connection`} position="top" className="flex-1">
                        <button
                            onClick={() => setMode(m)}
                            className={clsx(
                                "w-full flex items-center justify-center gap-1.5 py-1.5 transition-colors duration-150 cursor-pointer",
                                mode === m
                                    ? "bg-[var(--accent-primary)] text-white"
                                    : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]/80"
                            )}
                            aria-pressed={mode === m}
                        >
                            {m === 'wifi'
                                ? <><Wifi className="w-3 h-3" /> WiFi</>
                                : <><Usb  className="w-3 h-3" /> USB</>
                            }
                        </button>
                    </Tooltip>
                ))}
            </div>

            {/* WiFi fields */}
            {mode === 'wifi' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Host</label>
                        <Tooltip content="IP address or hostname of the controller" position="top" className="w-full">
                            <input
                                type="text"
                                value={wsHost}
                                onChange={(e) => setWsHost(e.target.value)}
                                placeholder="192.168.68.61"
                                className={inputCls}
                            />
                        </Tooltip>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Port</label>
                        <Tooltip content="Telnet port (default 23)" position="top" className="w-full">
                            <input
                                type="number"
                                value={wsPort}
                                onChange={(e) => setWsPort(e.target.value)}
                                min={1}
                                max={65535}
                                className={inputCls}
                            />
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Serial fields */}
            {mode === 'serial' && (
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-[var(--text-secondary)]">Port</label>
                            <Tooltip content="Refresh available serial ports" position="top">
                                <button
                                    onClick={() => refetch()}
                                    disabled={isLoading}
                                    className="p-1 hover:bg-[var(--bg-tertiary)] rounded transition-colors cursor-pointer disabled:opacity-50"
                                    aria-label="Refresh serial ports"
                                >
                                    <RefreshCw className={clsx("w-3 h-3 text-[var(--text-tertiary)]", isLoading && "animate-spin")} />
                                </button>
                            </Tooltip>
                        </div>
                        <Tooltip content="Select the USB serial port" position="top" className="w-full">
                            <select
                                value={selectedPort}
                                onChange={(e) => setSelectedPort(e.target.value)}
                                className={clsx(inputCls, "cursor-pointer")}
                                aria-label="Select serial port"
                            >
                                <option value="">— select port —</option>
                                {ports?.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </Tooltip>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Baud Rate</label>
                        <Tooltip content="Communication speed (default 115200)" position="top" className="w-full">
                            <select
                                value={baudRate}
                                onChange={(e) => setBaudRate(Number(e.target.value))}
                                className={clsx(inputCls, "cursor-pointer")}
                                aria-label="Select baud rate"
                            >
                                {[9600, 19200, 38400, 57600, 115200, 230400, 250000].map((b) => (
                                    <option key={b} value={b}>{b}</option>
                                ))}
                            </select>
                        </Tooltip>
                    </div>
                </div>
            )}

            {/* Connect / Disconnect */}
            {connected ? (
                <Tooltip content="Disconnect from the controller" position="top" className="w-full">
                    <button
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer border border-red-500/50 text-red-400 hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Disconnect from controller"
                    >
                        <Power className="w-4 h-4" />
                        {disconnecting ? "Disconnecting…" : "Disconnect"}
                    </button>
                </Tooltip>
            ) : (
                <Tooltip content={mode === 'wifi' ? "Connect via Telnet" : "Connect via Serial USB"} position="top" className="w-full">
                    <button
                        onClick={handleConnect}
                        disabled={connecting || (mode === 'serial' && !selectedPort)}
                        className="w-full bg-[var(--accent-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer shadow-sm"
                        aria-label="Connect to controller"
                    >
                        <PlugZap className="w-4 h-4" />
                        {connecting ? "Connecting…" : "Connect"}
                    </button>
                </Tooltip>
            )}

            {/* Status */}
            <div>
                <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-1.5 block">Status</label>
                <Tooltip content="Current connection state" position="top" className="w-full">
                    <div className="flex items-center gap-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded p-2.5">
                        <span className={clsx(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            connected ? "bg-green-500" : "bg-[var(--text-tertiary)]"
                        )} />
                        <span className="text-xs font-mono text-[var(--text-secondary)] break-all">{status}</span>
                    </div>
                </Tooltip>
            </div>
        </div>
    );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    return (
        <aside className={clsx("w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col h-full shadow-lg", className)}>
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-2">
                <TaurusLogo className="w-7 h-7 text-blue-500" />
                <h1 className="font-bold text-lg text-[var(--text-primary)]">Gtaurus</h1>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-3 block">Connection</label>

                {isTauriApp() ? (
                    <ConnectionPanel />
                ) : (
                    <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-4 text-center">
                        <Usb className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                        <p className="text-sm text-[var(--text-secondary)] mb-1">Serial Communication Unavailable</p>
                        <p className="text-xs text-[var(--text-tertiary)]">Download the desktop app to connect to CNC hardware</p>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                <Usb className="w-3 h-3" />
                v0.1.0-alpha
            </div>
        </aside>
    );
}


