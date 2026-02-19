import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settingsStore';
import { 
  Play, Terminal, Save, RefreshCw, 
  Upload, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

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
  { cmd: '$Report/Interval=250', desc: 'Set status report interval to 250ms.' },
  { cmd: '$System/Stats', desc: 'Show system statistics (memory, tasks).' },
];

// ─── Components ──────────────────────────────────────────────────────────────

function CommandRow({ cmd, desc }: { cmd: string, desc: string }) {
  const run = () => invoke('send_gcode', { cmd });

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
    const [config, setConfig] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'success' | 'error'>('idle');
    const [errorMsg, setError] = useState('');

    const configUrl = `http://${settings.connection.wsHost}/config.yaml`;
    // Note: Upload usually goes to /upload endpoint as multipart
    const uploadUrl = `http://${settings.connection.wsHost}/upload`;

    const loadConfig = async () => {
        setStatus('loading');
        setError('');
        try {
            const res = await fetch(configUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            const text = await res.text();
            setConfig(text);
            setStatus('idle');
        } catch (e: any) {
            setStatus('error');
            setError(e.message || 'Failed to load config');
        }
    };

    const saveConfig = async () => {
        if (!confirm('Overwrite config.yaml on the controller? This may require a restart.')) return;
        
        setStatus('saving');
        try {
            // FluidNC/ESP3D expects a multipart form upload for files
            const blob = new Blob([config], { type: 'text/yaml' });
            const formData = new FormData();
            formData.append('path', '/');
            formData.append('myfile', blob, 'config.yaml');

            const res = await fetch(uploadUrl, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e: any) {
            setStatus('error');
            setError(e.message || 'Failed to save config');
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">config.yaml</h3>
                    <span className="text-xs text-[var(--text-tertiary)] font-mono">{configUrl}</span>
                </div>
                <div className="flex gap-2">
                    <Tooltip content="Reload Config" position="bottom">
                        <button 
                            onClick={loadConfig} 
                            disabled={status === 'loading' || status === 'saving'}
                            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded cursor-pointer"
                        >
                            <RefreshCw className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
                        </button>
                    </Tooltip>
                    <Tooltip content="Save Config to Board" position="bottom">
                        <button 
                            onClick={saveConfig}
                            disabled={status === 'loading' || status === 'saving'}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
                        >
                            <Save className="w-3.5 h-3.5" />
                            Save to Board
                        </button>
                    </Tooltip>
                </div>
            </div>

            {status === 'error' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    {errorMsg}
                </div>
            )}
            
            {status === 'success' && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-xs text-green-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Saved successfully! Restart board to apply changes.
                </div>
            )}

            <textarea 
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg p-3 font-mono text-xs leading-relaxed resize-none focus:outline-none focus:border-[var(--accent-primary)] text-[var(--text-primary)]"
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                spellCheck={false}
                placeholder="Click reload to fetch configuration..."
            />
        </div>
    );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function FluidNCManager() {
  const [tab, setTab] = useState<'commands' | 'config'>('commands');

  return (
    <div className="h-full flex flex-col overflow-hidden p-4 max-w-5xl mx-auto w-full gap-4">
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-color)]">
        <button
          onClick={() => setTab('commands')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'commands' 
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Quick Commands
        </button>
        <button
          onClick={() => setTab('config')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            tab === 'config' 
              ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' 
              : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Config Editor
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {tab === 'commands' ? (
           <div className="h-full overflow-y-auto pr-2 space-y-8">
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
        ) : (
           <ConfigEditor />
        )}
      </div>
    </div>
  );
}
