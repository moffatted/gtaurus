import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, PlugZap, Activity, Usb } from "lucide-react";
import clsx from "clsx";

interface SidebarProps {
    className?: string;
}

export function Sidebar({ className }: SidebarProps) {
    const [selectedPort, setSelectedPort] = useState<string>("");
    const [baudRate, setBaudRate] = useState<number>(115200);
    const [status, setStatus] = useState<string>("Disconnected");

    const { data: ports, refetch, isLoading } = useQuery({
        queryKey: ["serial-ports"],
        queryFn: async () => {
            const ports = await invoke<string[]>("list_serial_ports");
            return ports;
        },
    });

    const handleConnect = async () => {
        if (!selectedPort) return;
        try {
            setStatus("Connecting...");
            const msg = await invoke<string>("connect_to_board", {
                portName: selectedPort,
                baudRate: baudRate,
            });
            setStatus(msg);
        } catch (error) {
            console.error(error);
            setStatus(`Error: ${error}`);
        }
    };

    return (
        <aside className={clsx("w-64 bg-[#1e1e1e] border-r border-[#333] flex flex-col h-full", className)}>
            <div className="p-4 border-b border-[#333] flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                <h1 className="font-bold text-lg text-white">Gtaurus</h1>
            </div>

            <div className="p-4 flex-1 overflow-y-auto">
                <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Connection</label>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-sm text-gray-300">Port</label>
                            <button
                                onClick={() => refetch()}
                                className="p-1 hover:bg-[#333] rounded transition-colors"
                                title="Refresh Ports"
                                disabled={isLoading}
                            >
                                <RefreshCw className={clsx("w-3 h-3 text-gray-400", isLoading && "animate-spin")} />
                            </button>
                        </div>
                        <select
                            value={selectedPort}
                            onChange={(e) => setSelectedPort(e.target.value)}
                            className="w-full bg-[#2a2a2a] border border-[#444] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Select Port</option>
                            {ports?.map((port) => (
                                <option key={port} value={port}>{port}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Baud Rate</label>
                        <select
                            value={baudRate}
                            onChange={(e) => setBaudRate(Number(e.target.value))}
                            className="w-full bg-[#2a2a2a] border border-[#444] rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value={115200}>115200</option>
                            <option value={9600}>9600</option>
                            <option value={250000}>250000</option>
                        </select>
                    </div>

                    <button
                        onClick={handleConnect}
                        disabled={!selectedPort}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <PlugZap className="w-4 h-4" />
                        Connect
                    </button>
                </div>

                <div className="mt-6">
                    <label className="text-xs font-semibold text-gray-400 uppercase mb-2 block">Status</label>
                    <div className="bg-[#2a2a2a] p-3 rounded text-sm font-mono text-gray-300 border border-[#444] break-all">
                        {status}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-[#333] text-xs text-gray-500 flex items-center gap-2">
                <Usb className="w-3 h-3" />
                v0.1.0-alpha
            </div>
        </aside>
    );
}
