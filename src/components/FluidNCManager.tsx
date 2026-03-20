/**
 * @file FluidNCManager.tsx
 * @purpose Specialized management interface for FluidNC-specific commands and settings.
 */
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Play, Terminal, Save, RefreshCw, 
  Upload, AlertTriangle, CheckCircle,
  Search, Copy, List, FileText, Power, History
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { transport, isTauri } from '../services/transportService';
import { useConsoleStore } from '../stores/consoleStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import * as yaml from 'js-yaml';

// ─── Command Definitions ──────────────────────────────────────────────────────

const GRBL_COMMANDS = [
  { cmd: '$H',   desc: 'Homing Cycle. Runs the homing procedure.' },
  { cmd: '$X',   desc: 'Kill Alarm Lock. Unlocks the machine from alarm state.' },
  { cmd: '$G',   desc: 'View G-code Parser State. Shows active modal states.' },
  { cmd: '$#',   desc: 'View G-code Parameters. Shows work offsets and probes.' },
  { cmd: '$$',   desc: 'View Settings. Dumps all settings to console.' },
  { cmd: '$I',   desc: 'View Build Info. Firmware version and build strings.' },
  { cmd: '$N',   desc: 'View Startup Blocks. G-code lines that run on boot.' },
  { cmd: '$RST=*', desc: 'Restore Defaults. Wipes settings to firmware defaults.' },
];

const FLUIDNC_COMMANDS = [
  { cmd: '$config/list', desc: 'List config files stored on flash.' },
  { cmd: '$Firmware/Info', desc: 'Detailed firmware build information.' },
  { cmd: '$SD/List',     desc: 'List files on the SD card.' },
  { cmd: '$Report/Interval=500', desc: 'Set status report interval to 500ms.' },
  { cmd: '$System/Stats', desc: 'Show system statistics (memory, tasks).' },
];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function CommandRow({ cmd, desc }: { cmd: string, desc: string }) {
  const run = () => {
    useConsoleStore.getState().appendLine(`> ${cmd}`, 'cmd');
    return transport.invoke('send_gcode', { cmd });
  };

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--bg-tertiary)]/30 px-2 transition-colors">
      <Tooltip content="Run this command" position="left">
        <button 
            onClick={run}
            className="flex-shrink-0 min-w-[120px] px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] 
                    rounded font-mono text-sm text-[var(--accent-primary)] font-semibold 
                    hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 
                    active:translate-y-0.5 transition-all text-left flex items-center gap-2 group cursor-pointer"
        >
            <Play className="w-3 h-3 opacity-50 group-hover:opacity-100" />
            {cmd}
        </button>
      </Tooltip>
      <span className="text-sm text-[var(--text-secondary)]">{desc}</span>
    </div>
  );
}

function ConfigEditor() {
    const { settings } = useSettingsStore();
    const { machine } = useMachineStatusStore();
    const isConnected = machine.status !== 'Disconnected';
    
    const [config, setConfig] = useState('');
    const [activeFilename, setActiveFilename] = useState('config.yaml');
    const [searchTerm, setSearchTerm] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [showFileList, setShowFileList] = useState(false);
    const [showRestartMenu, setShowRestartMenu] = useState(false);
    const [needsRestart, setNeedsRestart] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('idle');
    const [errorMsg, setError] = useState('');
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        onConfirm: () => void;
    } | null>(null);

    const uploadUrl = `http://${settings.connection.wsHost}/upload`;

    // Fetch the config on initial load so the download button has valid data
    useEffect(() => {
        loadConfig('config.yaml');
    }, []);

    const sanitizeYaml = (raw: string) => {
        // Strip Windows CRLF, zero-width spaces, and BOM characters that break ESP32/FluidNC parsing
        // Also strip any null bytes or non-printable ASCII that sometimes creep in
        return raw.replace(/\r/g, '')
                  .replace(/[\u200B-\u200D\uFEFF]/g, '')
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');
    };

    const validateYaml = (silent = false): boolean => {
        try {
            const clean = sanitizeYaml(config);
            yaml.load(clean);
            if (!silent) {
                setStatus('success');
                setError('');
                setTimeout(() => setStatus('idle'), 2000);
            }
            return true;
        } catch (e: any) {
            setStatus('error');
            setError(`YAML Validation Error: ${e.message}`);
            return false;
        }
    };

    const loadConfig = async (filename?: string) => {
        const targetFile = filename || activeFilename;
        if (filename) setActiveFilename(filename);
        
        setStatus('loading');
        setError('');
        try {
            const url = `http://${settings.connection.wsHost}/${targetFile}`;
            const text = await transport.invoke<string>('fetch_fluidnc_file', { url });
            setConfig(text);
            setStatus('idle');
        } catch (e: any) {
            setStatus('error');
            if (!isConnected) {
                setError('Failed to load config: Machine is not connected.');
            } else {
                setError(`Failed to load config: ${e.toString()}`);
            }
        }
    };

    const fetchFileList = async () => {
        const url = `http://${settings.connection.wsHost}/files?path=/`;
        try {
            const res = await transport.invoke<string>('fetch_fluidnc_file', { url });
            // FluidNC returns detailed JSON: {"path":"/","files":[{"name":"config.yaml","size":1234},...]}
            const data = JSON.parse(res);
            if (data && data.files) {
                const yamlFiles = data.files
                    .map((f: any) => f.name)
                    .filter((name: string) => name.endsWith('.yaml') || name.endsWith('.yml'));
                setFiles(yamlFiles);
            }
        } catch (e) {
            console.error('Failed to fetch file list:', e);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(config);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    };

    const downloadConfig = () => {
        // If config is empty, don't download a blank dummy file
        if (!config || config.trim() === '') {
             setStatus('error');
             setError('Config is empty or not loaded yet.');
             return;
        }
        const cleanYaml = sanitizeYaml(config);
        const blob = new Blob([cleanYaml], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFilename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const createLocalBackup = async (filename: string) => {
        try {
            // 1. Fetch current content from controller
            const url = `http://${settings.connection.wsHost}/${filename}`;
            const text = await transport.invoke<string>('fetch_fluidnc_file', { url });
            
            if (!text || text.trim() === '') return false;

            // 2. Prepare local path
            const now = new Date();
            const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
            const cleanFilename = filename.split('.')[0];
            const backupFilename = `${cleanFilename}_${timestamp}.yaml`;
            const backupPath = `${settings.gcodeStoragePath}/backups/configs`;

            // 3. Save to host machine
            await transport.invoke('ensure_dir_exists', { path: backupPath });
            await transport.invoke('save_local_file', { 
                path: backupPath, 
                filename: backupFilename, 
                content: text 
            });
            
            useConsoleStore.getState().appendLine(`[Manager] Created local backup: ${backupFilename}`, 'sys');
            return true;
        } catch (e) {
            // Silently fail if file doesn't exist yet, common for new builds
            console.warn('[Manager] Could not create backup (file might not exist yet)', e);
            return false;
        }
    };

    const saveLiveToFlash = async (skipBackupWarning = false) => {
        if (!validateYaml(true)) return;
        
        const warning = `SAVE LIVE ($CD) Warning:\n\n` +
            `This command dumps the CONTROLLER'S MEMORY state to flash.\n` +
            `- It removes all your comments and reorders the file.\n` +
            `- Recent FluidNC versions have reported bugs where $CD adds invalid lines or "NO PIN" values which can prevent booting.\n\n` +
            `A local backup will be created first. Are you absolutely sure?`;

        if (!skipBackupWarning) {
            setConfirmDialog({
                title: 'Save Live To Flash',
                message: warning,
                confirmLabel: 'Save Live',
                onConfirm: () => {
                    setConfirmDialog(null);
                    void saveLiveToFlash(true);
                },
            });
            return;
        }
        
        try {
            const backedUp = await createLocalBackup(activeFilename);
            if (!backedUp && isConnected) {
                setConfirmDialog({
                    title: 'Backup Warning',
                    message: 'Could not create a local backup (the file may not exist yet). Proceed anyway?',
                    confirmLabel: 'Proceed',
                    onConfirm: () => {
                        setConfirmDialog(null);
                        useConsoleStore.getState().appendLine(`> $CD=${activeFilename}`, 'cmd');
                        void transport.invoke('send_gcode', { cmd: `$CD=${activeFilename}` });
                        setStatus('success');
                        setTimeout(() => setStatus('idle'), 3000);
                    },
                });
                return;
            }
            useConsoleStore.getState().appendLine(`> $CD=${activeFilename}`, 'cmd');
            await transport.invoke('send_gcode', { cmd: `$CD=${activeFilename}` });
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e: any) {
            setStatus('error');
            setError('Failed to save live config');
        }
    };

    const setActiveConfig = async (confirmed = false) => {
        if (!confirmed) {
            setConfirmDialog({
                title: 'Set Active Config',
                message: `Set ${activeFilename} as the active boot configuration? This requires a restart.`,
                confirmLabel: 'Set Active',
                onConfirm: () => {
                    setConfirmDialog(null);
                    void setActiveConfig(true);
                },
            });
            return;
        }
        try {
            useConsoleStore.getState().appendLine(`> $Config/Filename=${activeFilename}`, 'cmd');
            await transport.invoke('send_gcode', { cmd: `$Config/Filename=${activeFilename}` });
            setStatus('success');
            setNeedsRestart(true);
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e: any) {
            setStatus('error');
            setError('Failed to set active config');
        }
    };

    const restartController = async (type: 'soft' | 'full' = 'soft', confirmed = false) => {
        const isFull = type === 'full';
        if (!confirmed) {
            setConfirmDialog({
                title: isFull ? 'Full Controller Reboot' : 'Soft Controller Reset',
                message: isFull
                    ? 'Perform a full hardware reboot? This is required to apply some configuration items.'
                    : 'Perform a soft reset to stop G-code and refresh the UI?',
                confirmLabel: isFull ? 'Reboot' : 'Reset',
                onConfirm: () => {
                    setConfirmDialog(null);
                    void restartController(type, true);
                },
            });
            return;
        }
        
        try {
            const url = isFull 
                ? `http://${settings.connection.wsHost}/command?plain=$Bye`
                : `http://${settings.connection.wsHost}/restart_reload`;
            useConsoleStore.getState().appendLine(`[GTaurus] Performing ${isFull ? 'Controller Reboot ($Bye)' : 'Soft Reload'}...`, 'sys');
            const response = await transport.invoke<string>('restart_fluidnc', { url });
            setNeedsRestart(false);
            setShowRestartMenu(false);
            setStatus('success');
            console.log(`FluidNC ${isFull ? 'Full' : 'Soft'} Restart Response:`, response);
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e: any) {
            console.error('Restart failed:', e);
            setStatus('error');
            setError(`Restart failed: ${e}`);
        }
    };

    const saveConfig = async (confirmed = false) => {
        if (!validateYaml(false)) return;
        
        const cleanYaml = sanitizeYaml(config);
        if (cleanYaml.trim().length < 10) {
            setError("Configuration is too short or empty. Upload aborted for safety.");
            return;
        }

        if (!confirmed) {
            setConfirmDialog({
                title: 'Upload Configuration',
                message: `Overwrite ${activeFilename} on the controller with the editor content? A local backup of the old file will be created first.`,
                confirmLabel: 'Upload',
                onConfirm: () => {
                    setConfirmDialog(null);
                    void saveConfig(true);
                },
            });
            return;
        }
        
        setStatus('saving');
        try {
            await createLocalBackup(activeFilename);
            useConsoleStore.getState().appendLine(`[GTaurus] Uploading ${activeFilename}...`, 'sys');
            await transport.invoke('upload_fluidnc_file', { 
                url: uploadUrl, 
                target_path: "/",
                filename: activeFilename, 
                content: cleanYaml 
            });
            setStatus('success');
            setNeedsRestart(true);
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e: any) {
            setStatus('error');
            setError(e.toString() || 'Failed to save config');
        }
    };

    return (
        <div className="flex flex-col h-full gap-4 min-w-[380px]">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4 flex-1 min-w-0">
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md px-2 py-1">
                            <input 
                                type="text"
                                value={activeFilename}
                                onChange={(e) => setActiveFilename(e.target.value)}
                                className="bg-transparent border-none text-xs font-mono text-[var(--accent-primary)] focus:outline-none w-28"
                                placeholder="config.yaml"
                            />
                        </div>
                        <Tooltip content="Set as Boot Config" position="bottom">
                            <button 
                                onClick={() => {
                                    void setActiveConfig();
                                }}
                                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                            >
                                <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                        </Tooltip>
                    </div>
                    <div className="relative flex-1 min-w-[120px] max-w-sm">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search settings..."
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                    <Tooltip content="Copy to Clipboard" position="bottom">
                        <button onClick={copyToClipboard} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded cursor-pointer">
                            <Copy className="w-4 h-4" />
                        </button>
                    </Tooltip>
                    
                    <div className="relative">
                    <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
                        <Tooltip content="Open Local Backups Folder" position="bottom">
                            <button 
                                onClick={async () => {
                                    const path = `${settings.gcodeStoragePath}/backups/configs`.replace(/\\/g, '/');
                                    await transport.invoke('ensure_dir_exists', { path });
                                    if (isTauri) {
                                        try {
                                            await tauriInvoke('plugin:opener|open_path', { path });
                                        } catch (e) {
                                            console.error('Failed to open folder:', e);
                                        }
                                    } else {
                                        setStatus('error');
                                        setError(`Backups are located at: ${path}`);
                                    }
                                }}
                                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded transition-all cursor-pointer"
                            >
                                <History className="w-4 h-4" />
                            </button>
                        </Tooltip>
                        <div className="w-[1px] h-4 bg-[var(--border-color)]" />
                        <Tooltip content="List Files" position="bottom">
                            <button 
                                onClick={() => {
                                    if (!showFileList) fetchFileList();
                                    setShowFileList(!showFileList);
                                }} 
                                className={`p-1.5 rounded cursor-pointer transition-colors ${showFileList ? 'text-[var(--accent-primary)] bg-[var(--bg-tertiary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </Tooltip>
                    </div>
                        
                        {showFileList && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowFileList(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 py-1 max-h-64 overflow-y-auto custom-scrollbar">
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider border-b border-[var(--border-color)] mb-1">
                                        Configuration Files
                                    </div>
                                    {files.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-[var(--text-tertiary)] italic">No config files found</div>
                                    ) : (
                                        files.map(file => (
                                            <button
                                                key={file}
                                                onClick={() => {
                                                    loadConfig(file);
                                                    setShowFileList(false);
                                                }}
                                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--bg-tertiary)] transition-colors ${activeFilename === file ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                                <span className="truncate">{file}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <Tooltip content="Validate YAML format" position="bottom">
                        <button onClick={() => validateYaml(false)} className="px-2 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-green-400 hover:bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded cursor-pointer transition-colors shadow-sm">
                            Validate
                        </button>
                    </Tooltip>

                    <Tooltip content="Download File" position="bottom">
                        <button onClick={downloadConfig} className="p-1.5 ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded cursor-pointer">
                            <Upload className="w-4 h-4 rotate-180" />
                        </button>
                    </Tooltip>
                    <Tooltip content="Reload Config" position="bottom">
                        <button 
                            onClick={() => loadConfig()} 
                            disabled={status === 'loading' || status === 'saving'}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded cursor-pointer"
                        >
                            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
                        </button>
                    </Tooltip>

                    <div className="w-px h-8 bg-[var(--border-color)] mx-1" />

                    <div className="relative">
                        <Tooltip content={needsRestart ? "Restart/Reboot Required" : "Controller Restart"} position="bottom">
                            <button 
                                onClick={() => setShowRestartMenu(!showRestartMenu)}
                                className={`p-1.5 rounded cursor-pointer transition-all ${needsRestart ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'}`}
                            >
                                <Power className="w-4 h-4" />
                            </button>
                        </Tooltip>

                        {showRestartMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowRestartMenu(false)} />
                                <div className="absolute right-0 mt-2 w-52 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                                    <button
                                        onClick={() => restartController('soft')}
                                        className="w-full px-4 py-2.5 text-xs text-left hover:bg-[var(--bg-tertiary)] flex flex-col gap-0.5"
                                    >
                                        <span className="font-medium text-[var(--text-primary)]">Soft Reset</span>
                                        <span className="text-[10px] text-[var(--text-tertiary)]">Stop jobs & refresh WebUI</span>
                                    </button>
                                    <button
                                        onClick={() => restartController('full')}
                                        className="w-full px-4 py-3 text-xs text-left hover:bg-[var(--bg-tertiary)] flex flex-col gap-0.5 border-t border-[var(--border-color)]"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-[var(--accent-primary)]">Full Reboot ($Bye)</span>
                                            {needsRestart && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse" />}
                                        </div>
                                        <span className="text-[10px] text-[var(--text-tertiary)]">Required to apply config changes</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--border-color)]">
                        <Tooltip 
                            content={
                                <div className="space-y-1 p-1">
                                    <p className="font-bold">Save Live ($CD)</p>
                                    <p className="text-[10px] opacity-80">Dumps the controller's current in-memory settings into flash. Use this to persist changes made via the console.</p>
                                </div>
                            } 
                            position="bottom"
                        >
                            <button 
                                onClick={() => {
                                    void saveLiveToFlash();
                                }}
                                className="px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded transition-all cursor-pointer"
                            >
                                Save Live
                            </button>
                        </Tooltip>
                        <div className="w-[1px] bg-[var(--border-color)] mx-1" />
                        <Tooltip 
                            content={
                                <div className="space-y-1 p-1">
                                    <p className="font-bold">Upload Editor Content</p>
                                    <p className="text-[10px] opacity-80">Takes the YAML text in the editor below and overwrites the file on the controller's flash.</p>
                                </div>
                            } 
                            position="bottom"
                        >
                            <button 
                                onClick={() => {
                                    void saveConfig();
                                }}
                                disabled={status === 'loading' || status === 'saving'}
                                className="flex items-center gap-2 px-3 py-1 bg-[var(--accent-primary)] text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                <Save className="w-3.5 h-3.5" />
                                Upload
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {!isConnected && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Warning: You are currently disconnected. The machine configuration cannot be fetched or updated until a connection is established.
                </div>
            )}

            {status === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}
            
            {status === 'success' && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Action successful!
                </div>
            )}

            <textarea 
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                spellCheck={false}
                placeholder="Click reload to fetch configuration..."
            />

            {confirmDialog && (
                <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
                            <h5 className="text-sm font-semibold text-[var(--text-primary)]">{confirmDialog.title}</h5>
                        </div>
                        <div className="px-4 py-4">
                            <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{confirmDialog.message}</p>
                        </div>
                        <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
                            <button
                                onClick={() => setConfirmDialog(null)}
                                className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDialog.onConfirm}
                                className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
                            >
                                {confirmDialog.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SettingsSection({ title, children, icon: Icon }: { title: string, children: React.ReactNode, icon?: any }) {
    return (
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-[var(--bg-tertiary)]/50 border-b border-[var(--border-color)] flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-[var(--accent-primary)]" />}
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h4>
            </div>
            <div className="p-4 space-y-4">
                {children}
            </div>
        </div>
    );
}

function MachineSettings() {
    const [wifiSsid, setWifiSsid] = useState('');
    const [wifiPass, setWifiPass] = useState('');
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        confirmLabel?: string;
        onConfirm: () => void;
    } | null>(null);

    const sendCmd = (cmd: string) => {
        useConsoleStore.getState().appendLine(`> ${cmd}`, 'cmd');
        return transport.invoke('send_gcode', { cmd });
    };

    const handleApplyWifi = async () => {
        setConfirmDialog({
            title: 'Apply WiFi Settings',
            message: 'Setting WiFi will disconnect the current session. Proceed?',
            confirmLabel: 'Apply',
            onConfirm: async () => {
                setConfirmDialog(null);
                try {
                    await sendCmd(`$Sta/SSID=${wifiSsid}`);
                    await sendCmd(`$Sta/Password=${wifiPass}`);
                    setStatus('success');
                    setTimeout(() => setStatus('idle'), 3000);
                } catch (e) {
                    setStatus('error');
                }
            },
        });
    };

    const requestRestart = () => {
        setConfirmDialog({
            title: 'Restart FluidNC',
            message: 'Restart FluidNC now? The connection will drop temporarily.',
            confirmLabel: 'Restart',
            onConfirm: () => {
                setConfirmDialog(null);
                sendCmd('$System/Restart');
            },
        });
    };

    return (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto pr-2 pb-6 h-full custom-scrollbar">
            {/* 1. WiFi Config */}
            <SettingsSection title="WiFi Configuration" icon={Upload}>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">SSID</label>
                        <input 
                            type="text" 
                            value={wifiSsid}
                            onChange={(e) => setWifiSsid(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                            placeholder="Network Name"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Password</label>
                        <input 
                            type="password" 
                            value={wifiPass}
                            onChange={(e) => setWifiPass(e.target.value)}
                            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--accent-primary)]"
                            placeholder="••••••••"
                        />
                    </div>
                    <button 
                        onClick={handleApplyWifi}
                        className="w-full py-2 bg-[var(--accent-primary)] text-white rounded text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                    >
                        Apply WiFi Settings
                    </button>
                    {status === 'success' && <p className="text-[10px] text-green-400 text-center">Commands sent!</p>}
                </div>
            </SettingsSection>

            {/* 2. FluidNC Features */}
            <SettingsSection title="FluidNC Features" icon={CheckCircle}>
                <div className="space-y-4">
                    {[
                        { label: 'Telnet Server', cmd: '$Telnet/Enable' },
                        { label: 'MDNS Support', cmd: '$MDNS/Enable' },
                        { label: 'Local Notifications', cmd: '$Notifications/Enable' }
                    ].map(feature => (
                        <div key={feature.label} className="flex items-center justify-between">
                            <span className="text-sm text-[var(--text-secondary)]">{feature.label}</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => sendCmd(`${feature.cmd}=On`)}
                                    className="px-2 py-1 text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 rounded hover:bg-green-500/20 cursor-pointer"
                                > On </button>
                                <button 
                                    onClick={() => sendCmd(`${feature.cmd}=Off`)}
                                    className="px-2 py-1 text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 cursor-pointer"
                                > Off </button>
                            </div>
                        </div>
                    ))}
                </div>
            </SettingsSection>

            {/* 3. Interface */}
            <SettingsSection title="Interface" icon={Terminal}>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Message Level</span>
                        <select 
                            onChange={(e) => sendCmd(`$Message/Level=${e.target.value}`)}
                            className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded text-xs px-2 py-1 focus:outline-none"
                        >
                            <option value="Info">Info</option>
                            <option value="Debug">Debug</option>
                            <option value="Critical">Critical</option>
                        </select>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--text-secondary)]">Echo Commands</span>
                        <div className="flex gap-2">
                             <button onClick={() => sendCmd('$GCode/Echo=On')} className="px-2 py-1 text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded cursor-pointer">On</button>
                             <button onClick={() => sendCmd('$GCode/Echo=Off')} className="px-2 py-1 text-[10px] bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded cursor-pointer">Off</button>
                        </div>
                    </div>
                </div>
            </SettingsSection>

            {/* 4. FluidNC Tools */}
            <SettingsSection title="FluidNC Tools" icon={Play}>
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={requestRestart}
                        className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/20 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Restart Board
                    </button>
                    <button 
                        onClick={() => sendCmd('$Config/List')}
                        className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded text-xs hover:border-[var(--accent-primary)] transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        List Files
                    </button>
                    <button 
                        onClick={() => sendCmd('$System/Stats')}
                        className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded text-xs hover:border-[var(--accent-primary)] transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                        <CheckCircle className="w-4 h-4" />
                        System Stats
                    </button>
                    <button 
                        onClick={() => sendCmd('$Firmware/Info')}
                        className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded text-xs hover:border-[var(--accent-primary)] transition-colors flex flex-col items-center gap-2 cursor-pointer"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Build Info
                    </button>
                </div>
                {/* Fallback Indicator */}
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded text-[10px] text-blue-400 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Auto-Fallback: FluidNC will use internal config if yours is invalid.
                </div>
            </SettingsSection>
        </div>

        {confirmDialog && (
            <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-header)]">
                        <h5 className="text-sm font-semibold text-[var(--text-primary)]">{confirmDialog.title}</h5>
                    </div>
                    <div className="px-4 py-4">
                        <p className="text-xs text-[var(--text-secondary)]">{confirmDialog.message}</p>
                    </div>
                    <div className="px-4 py-3 border-t border-[var(--border-color)] flex justify-end gap-2 bg-[var(--bg-header)]">
                        <button
                            onClick={() => setConfirmDialog(null)}
                            className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDialog.onConfirm}
                            className="px-3 py-1.5 text-xs rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/10"
                        >
                            {confirmDialog.confirmLabel || 'Confirm'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function FluidNCManager() {
  const [tab, setTab] = useState<'commands' | 'settings' | 'config'>('commands');

  return (
    <div className="h-full flex flex-col overflow-hidden p-4 max-w-5xl mx-auto w-full gap-4 min-w-[400px]">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        {[
            { id: 'commands', label: 'Quick Commands' },
            { id: 'settings', label: 'Machine Settings' },
            { id: 'config',   label: 'Config Editor' },
        ].map(t => (
            <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
                    tab === t.id 
                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                }`}
            >
                {t.label}
            </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'commands' && (
           <div className="h-full overflow-y-auto pr-2 space-y-8 custom-scrollbar">
               <div className="space-y-3">
                   <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                       <Terminal className="w-3.5 h-3.5" />
                       Standard Grbl Commands
                   </h3>
                   <div className="border-t border-[var(--border-color)]">
                       {GRBL_COMMANDS.map((c) => <CommandRow key={c.cmd} {...c} />)}
                   </div>
               </div>

               <div className="space-y-3">
                   <h3 className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider flex items-center gap-2">
                       <Upload className="w-3.5 h-3.5" />
                       FluidNC Extensions
                   </h3>
                   <div className="border-t border-[var(--border-color)]">
                       {FLUIDNC_COMMANDS.map((c) => <CommandRow key={c.cmd} {...c} />)}
                   </div>
               </div>
           </div>
        )}
        {tab === 'settings' && <MachineSettings />}
        {tab === 'config' && <ConfigEditor />}
      </div>
    </div>
  );
}
