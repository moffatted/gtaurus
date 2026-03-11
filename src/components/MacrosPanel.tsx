/**
 * @file MacrosPanel.tsx
 * @purpose UI panel for defining and executing custom G-code macros.
 */
import { Play, FileCode, Zap, Settings, Plus, Edit, Trash } from "lucide-react";
import { useSettingsStore, Macro } from "../stores/settingsStore";
import { useMachineStatusStore } from "../stores/machineStatusStore";
import { useUIStore } from "../stores/uiStore";
import { Tooltip } from "./ui/Tooltip";
import clsx from "clsx";
import { transport } from '../services/transportService';
import { ConfirmPopover } from './ui/Popovers';
import { useRef, useState } from 'react';

export function MacrosPanel() {
    const { settings, deleteMacro } = useSettingsStore();
    const { machine } = useMachineStatusStore();
    const { openSettings } = useUIStore();
    const connected = machine.status !== "Disconnected";

    const [popover, setPopover] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        triggerRef: React.RefObject<HTMLButtonElement | null>;
    } | null>(null);

    const deleteRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    const runMacro = async (macro: Macro) => {
        if (!connected) return;
        
        console.log(`[Macros] Running macro: ${macro.name}`);
        const lines = macro.content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('(')) continue;
            
            try {
                // We await each line to ensure sequential execution and buffer safety
                await transport.invoke('send_gcode', { cmd: trimmed });
            } catch (e) {
                console.error(`[Macros] Error sending command "${trimmed}":`, e);
                // We continue with other commands unless it's a critical error
            }
        }
    };

    return (
        <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden min-w-[280px]">
            <div className="p-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h2 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Quick Macros</h2>
                </div>
                <div className="flex items-center gap-1">
                    <Tooltip content="Add New Macro" position="bottom">
                        <button 
                            onClick={() => openSettings('machine', 'macros')}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Manage Macros" position="bottom">
                        <button 
                            onClick={() => openSettings('machine', 'macros')}
                            className="p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
                        >
                            <Settings className="w-4 h-4" />
                        </button>
                    </Tooltip>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-2">
                {settings.macros.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2.5">
                        {settings.macros.map((macro) => (
                            <button
                                key={macro.id}
                                onClick={() => runMacro(macro)}
                                disabled={!connected}
                                className={clsx(
                                    "group w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200",
                                    connected
                                        ? "bg-[var(--bg-secondary)] border-[var(--border-color)] hover:border-[var(--accent-primary)]/50 hover:bg-[var(--bg-tertiary)] cursor-pointer"
                                        : "bg-[var(--bg-secondary)]/50 border-[var(--border-color)] opacity-50 cursor-not-allowed"
                                )}
                            >
                                <div className="flex items-center gap-3 text-left">
                                    <div className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        connected 
                                            ? "bg-[var(--bg-tertiary)] text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white"
                                            : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                                    )}>
                                        <FileCode className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">{macro.name}</div>
                                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono mt-0.5 opacity-70">
                                            {macro.content.split('\n').filter(l => l.trim() && !l.trim().startsWith(';') && !l.trim().startsWith('(')).length} commands
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openSettings('machine', 'macros');
                                            }}
                                            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all cursor-pointer"
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            ref={el => { deleteRefs.current[macro.id] = el; }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPopover({
                                                    isOpen: true,
                                                    title: "Delete Macro",
                                                    message: `Are you sure you want to delete "${macro.name}"?`,
                                                    onConfirm: () => deleteMacro(macro.id),
                                                    triggerRef: { current: deleteRefs.current[macro.id] }
                                                });
                                            }}
                                            className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all cursor-pointer"
                                        >
                                            <Trash className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <div className={clsx(
                                        "p-2 rounded-full transition-all flex item-center justify-center",
                                        connected 
                                            ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white"
                                            : "bg-transparent text-[var(--text-tertiary)]"
                                    )}>
                                        <Play className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 py-12">
                        <div className="p-4 rounded-full bg-[var(--bg-tertiary)] mb-4">
                            <Zap className="w-8 h-8 text-[var(--text-tertiary)] opacity-30" />
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wide">No Macros</p>
                        <p className="text-xs text-[var(--text-tertiary)] mt-2 max-w-[180px] leading-relaxed">
                            Configure your favorite G-code snippets in Settings to run them with one click.
                        </p>
                    </div>
                )}
            </div>

            <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex-shrink-0">
                <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                    <p className="text-[9px] text-[var(--text-tertiary)] italic leading-tight">
                        Macros execute immediately. Inspect G-code in Settings before running to ensure machine safety.
                    </p>
                </div>
            </div>

            {popover && (
                <ConfirmPopover
                    isOpen={popover.isOpen}
                    onClose={() => setPopover(null)}
                    onConfirm={popover.onConfirm}
                    title={popover.title}
                    message={popover.message}
                    kind="error"
                    okLabel="Delete"
                    triggerRef={popover.triggerRef}
                    position="left"
                />
            )}
        </div>
    );
}
