import { useState } from 'react';
import { Folder, HardDrive } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';

export function FileManagerContent() {
  const { settings, updateSettings } = useSettingsStore();
  const [path, setPath] = useState(settings.gcodeStoragePath);

  const savePath = async () => {
    const trimmed = path.trim();
    if (!trimmed) return;
    try {
      await transport.invoke('ensure_dir_exists', { path: trimmed });
      updateSettings({ gcodeStoragePath: trimmed });
    } catch (err) {
      console.error('[settings] Failed to update storage path:', err);
    }
  };

  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1.5';

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[var(--accent-primary)]">
          <HardDrive className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold uppercase tracking-wide">Local Storage</span>
        </div>

        <div>
          <label className={labelCls}>G-code Storage Path</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              onBlur={savePath}
              placeholder="C:/Users/me/gcode_files"
              className={inputCls}
            />
            <button
              onClick={async () => {
                const selected = await openDialog({ directory: true, multiple: false });
                if (selected && typeof selected === 'string') {
                  const normalized = selected.replace(/\\/g, '/');
                  setPath(normalized);
                  await transport.invoke('ensure_dir_exists', { path: normalized });
                  updateSettings({ gcodeStoragePath: normalized });
                }
              }}
              className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--border-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] transition-colors"
              title="Browse folders"
            >
              <Folder className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-[var(--text-tertiary)] italic leading-relaxed">
            The directory on this computer where your G-code files are stored.
            Default is <span className="font-mono">~/gcode_files</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
