/**
 * @file Sidebar.tsx
 * @purpose Main navigation and connection status sidebar for the application.
 */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, PlugZap, Usb, Wifi, Power, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { isTauriApp } from "../utils/platform";
import { useSettingsStore } from "../stores/settingsStore";
import { useLayoutStore } from "../stores/layoutStore";
import { useMachineStore } from "../stores/machineStore";
import { useMachineStatusStore } from "../stores/machineStatusStore";
import { Tooltip } from "./ui/Tooltip";
import { transport } from '../services/transportService';

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
    const [mode, setMode] = useState<'telnet' | 'serial' | 'websocket'>(
        conn.preferredMode || 'websocket'
    );

    useEffect(() => {
        // Enforce websocket mode in browser unless Tauri
        if (!isTauriApp()) {
            transport.setMode('websocket');
        }
    }, []);

    // WiFi fields
    const [wsHost, setWsHost] = useState(conn.wsHost);
    const [wsPort, setWsPort] = useState(String(conn.wsPort));

    // Bridge fields
    const [bridgeHost, setBridgeHost] = useState(conn.bridgeHost || window.location.hostname);
    const [bridgePort, setBridgePort] = useState(String(conn.bridgePort || import.meta.env.VITE_BACKEND_PORT || 9001));

    // Serial fields
    const [selectedPort, setSelectedPort] = useState(conn.serialPort);
    const [baudRate, setBaudRate]          = useState(conn.baudRate);

    const { resetPrerequisites } = useMachineStore();
    const { resetMachine } = useMachineStatusStore();

    // Shared state
    const [status, setStatus]       = useState("Disconnected");
    const [connecting, setConn]     = useState(false);
    const [disconnecting, setDis]   = useState(false);

    // Serial port list
    const { data: ports, refetch, isLoading } = useQuery({
        queryKey: ["serial-ports"],
        queryFn: () => transport.invoke<string[]>("list_serial_ports"),
    });

    // Poll connection status every 2 s
    useEffect(() => {
        const tick = async () => {
            try {
                const s = await transport.invoke<string>("get_connection_status");
                if (s === "Disconnected" && status !== "Disconnected") {
                    resetMachine();
                    resetPrerequisites();
                }
                setStatus(s);
            } catch {
                if (status !== "Disconnected") {
                    resetMachine();
                    resetPrerequisites();
                    setStatus("Disconnected");
                }
            }
        };
        void tick();
        const id = setInterval(tick, 2000);
        return () => clearInterval(id);
    }, [status, resetPrerequisites]);

    const connected = status !== "Disconnected";

    const handleConnect = async () => {
        setConn(true);
        setStatus("Connecting…");
        try {
            if (mode === 'websocket') {
                transport.setMode('websocket');
                transport.reconnect(bridgeHost, parseInt(bridgePort, 10));
                setTimeout(async () => {
                    try {
                        await transport.invoke("resume_auto_connect");
                    } catch (e) {
                        console.error("Failed to resume bridge connection:", e);
                    }
                    void refreshStatus();
                }, 500);
            } else if (mode === 'telnet') {
                if (isTauriApp()) transport.setMode('native');
                const port = parseInt(wsPort, 10);
                await transport.invoke("connect_telnet", {
                    host: wsHost,
                    wsPort: isNaN(port) ? 23 : port,
                });
            } else {
                if (isTauriApp()) transport.setMode('native');
                if (!selectedPort) return;
                await transport.invoke("connect_serial", {
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
            await transport.invoke("disconnect");
            setStatus("Disconnected");
            resetPrerequisites();
            resetMachine();
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
                {(['telnet', 'serial', 'websocket'] as const).map((m) => (
                    <Tooltip key={m} content={`Use ${m === 'telnet' ? 'Network (Telnet)' : m === 'serial' ? 'USB Serial' : 'Agent Bridge (WebSocket)'} connection`} position="top" className="flex-1">
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
                            {m === 'telnet' && <><Wifi className="w-3 h-3" /> Telnet</>}
                            {m === 'serial' && <><Usb  className="w-3 h-3" /> USB</>}
                            {m === 'websocket' && <><RefreshCw className="w-3 h-3" /> Bridge</>}
                        </button>
                    </Tooltip>
                ))}
            </div>

            {/* Bridge fields */}
            {mode === 'websocket' && (
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Bridge Host</label>
                        <input
                            type="text"
                            value={bridgeHost}
                            onChange={(e) => setBridgeHost(e.target.value)}
                            placeholder="localhost"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] mb-1 block">Bridge Port</label>
                        <input
                            type="number"
                            value={bridgePort}
                            onChange={(e) => setBridgePort(e.target.value)}
                            className={inputCls}
                        />
                    </div>
                </div>
            )}

            {/* WiFi Telnet fields */}
            {mode === 'telnet' && (
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

            {/* Warning about simultaneous connections via separate layers */}
            {(mode === 'telnet' || mode === 'serial') && (
                <div className="text-[10px] text-[var(--text-tertiary)] italic p-2 bg-[var(--bg-tertiary)]/50 rounded-lg border border-amber-500/20 leading-tight">
                    <span className="text-amber-500 font-bold">Note:</span> If the GTaurus Bridge Server is running on another machine and connected to your controller, using Local {mode === 'telnet' ? 'Telnet' : 'USB'} simultaneously might cause dropped commands or conflicts.
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
                <Tooltip content={mode === 'telnet' ? "Connect via Telnet" : mode === 'websocket' ? "Connect via Gtaurus Bridge" : "Connect via Serial USB"} position="top" className="w-full">
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
    const collapsed = useLayoutStore((state) => state.sidebarCollapsed);
    const toggle    = useLayoutStore((state) => state.toggleSidebarCollapsed);
    const [status, setStatus] = useState("Disconnected");

    // Poll connection status for collapsed indicator
    useEffect(() => {
        const tick = async () => {
            try {
                const s = await transport.invoke<string>("get_connection_status");
                setStatus(s);
            } catch {
                setStatus("Disconnected");
            }
        };
        void tick();
        const id = setInterval(tick, 2000);
        return () => clearInterval(id);
    }, []);

    const connected = status !== "Disconnected";

    return (
        <aside 
            className={clsx(
                "bg-[var(--bg-sidebar)] border-r border-[var(--border-color)] flex flex-col h-full shadow-lg transition-all duration-300 ease-in-out relative z-30", 
                collapsed ? "w-16" : "w-72",
                className
            )}
        >
            {/* Collapse Toggle Button - Floating style when collapsed */}
            <button
                onClick={toggle}
                className={clsx(
                    "absolute top-6 -right-3 w-6 h-6 rounded-full bg-[var(--bg-sidebar)] border border-[var(--border-color)] shadow-sm flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] transition-all cursor-pointer z-40 hover:scale-110",
                    collapsed ? "rotate-0" : "rotate-0"
                )}
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
                {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </button>

            <div className={clsx(
                "p-4 border-b border-[var(--border-color)] flex items-center h-14 overflow-hidden",
                collapsed ? "justify-center" : "justify-start gap-3"
            )}>
                <TaurusLogo className="w-8 h-8 text-blue-500 flex-shrink-0" />
                {!collapsed && (
                    <h1 className="font-bold text-lg text-[var(--text-primary)] whitespace-nowrap transition-opacity duration-300">
                        Gtaurus
                    </h1>
                )}
            </div>

            <div className={clsx(
                "p-4 flex-1 overflow-y-auto overflow-x-hidden",
                collapsed && "flex flex-col items-center"
            )}>
                {!collapsed ? (
                    <>
                        <label className="text-xs font-semibold text-[var(--text-tertiary)] uppercase mb-3 block">
                            Connection
                        </label>
                        <ConnectionPanel />
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-6 mt-2">
                         <Tooltip content={`Status: ${status}`} position="right">
                             <div className="relative">
                                <div className={clsx(
                                    "p-2.5 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] shadow-sm",
                                    connected && "text-[var(--accent-primary)] border-[var(--accent-primary)]/30"
                                )}>
                                    <Usb className="w-5 h-5" />
                                </div>
                                <span className={clsx(
                                    "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-sidebar)]",
                                    connected ? "bg-green-500" : "bg-gray-400"
                                )} />
                             </div>
                         </Tooltip>
                         
                         <Tooltip content="Config Mode" position="right">
                            <button onClick={toggle} className="p-2.5 rounded-xl hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] transition-colors cursor-pointer">
                                <Wifi className="w-5 h-5" />
                            </button>
                         </Tooltip>
                    </div>
                )}
            </div>

            <div className={clsx(
                "p-4 border-t border-[var(--border-color)] text-[var(--text-tertiary)] flex items-center gap-2 overflow-hidden",
                collapsed ? "justify-center" : "text-[10px]"
            )}>
                <Usb className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="truncate opacity-60">v0.1.0-alpha</span>}
            </div>
        </aside>
    );
}



