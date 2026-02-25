import { useEffect, useState, useCallback } from 'react';
import { 
  FileText, Upload, Trash2, Play, Search, 
  RefreshCw, HardDrive, FileCode, MoreVertical,
  Clock, Database, Eye
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../stores/settingsStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { formatDistanceToNow } from 'date-fns';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { transport, isTauri } from '../services/transportService';

interface LocalFile {
  name: string;
  size: number;
  modified: number; // timestamp in seconds
}

export default function FileManager() {
  const { settings, healStoragePath } = useSettingsStore();
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshFiles = useCallback(async (isRetry = false) => {
    if (!settings.gcodeStoragePath) return;
    setLoading(true);
    setError(null);
    try {
      const list = await transport.invoke<LocalFile[]>('list_local_files', { 
        path: settings.gcodeStoragePath 
      });
      // Sort by modified date descending
      setFiles(list.sort((a, b) => Number(b.modified) - Number(a.modified)));
    } catch (err) {
      console.error("[FileManager] Failed to list files:", err);
      // Smart path healing: if error 2 (not found), try to heal the path and retry once
      if (!isRetry && String(err).toLowerCase().includes("no such file")) {
        console.log("[FileManager] Path looks invalid, attempting healing...");
        const newPath = await healStoragePath();
        if (newPath) {
          // No need to manually retry, the settings change will trigger a refresh via the hook
          return;
        }
      }
      setError("Failed to access storage directory.");
    } finally {
      setLoading(false);
    }
  }, [settings.gcodeStoragePath, healStoragePath]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const handleUpload = async () => {
    if (!settings.gcodeStoragePath) {
      alert("Please configure a G-code storage path in Settings first.");
      return;
    }

    try {
      const isRemote = transport.isWebSocketMode();
      console.log("[FileManager] handleUpload - isTauri:", isTauri, "isRemote:", isRemote);

      if (isTauri && !isRemote) {
        // --- Local Tauri Upload (File Copy) ---
        const selected = await openDialog({
          multiple: false,
          filters: [{ name: 'G-code', extensions: ['nc', 'gcode', 'gc', 'tap', 'txt'] }]
        });

        if (selected && typeof selected === 'string') {
          console.log("[FileManager] Local Upload source:", selected);
          let isValid = true;
          try {
            isValid = await transport.invoke<boolean>('validate_gcode_file', { path: selected });
          } catch (valErr) {
            console.warn("[FileManager] Validation failed:", valErr);
          }
          if (!isValid && !confirm("This file doesn't look like valid G-code. Upload anyway?")) {
            return;
          }
          await transport.invoke('copy_to_storage', { 
            sourcePath: selected, 
            destDir: settings.gcodeStoragePath 
          });
          refreshFiles();
        }
      } else {
        // --- Web or Remote Bridge Upload (Send Content) ---
        console.log("[FileManager] Remote/Web upload path. Dest:", settings.gcodeStoragePath);
        let fileContent: string = "";
        let fileName: string = "";

        if (isTauri) {
          const selected = await openDialog({
            multiple: false,
            filters: [{ name: 'G-code', extensions: ['nc', 'gcode', 'gc', 'tap', 'txt'] }]
          });
          if (!selected || typeof selected !== 'string') return;
          console.log("[FileManager] Remote Bridge: Reading local file content from:", selected);
          
          fileContent = await tauriInvoke<string>('read_local_file', { 
            path: "", 
            filename: selected 
          });
          fileName = selected.split(/[\\/]/).pop() || "uploaded.gcode";
        } else {
          // Standard browser file input
          const file = await new Promise<File | null>((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.nc,.gcode,.gc,.tap,.txt';
            input.onchange = (e: any) => resolve(e.target.files?.[0] || null);
            input.click();
          });
          if (!file) return;
          fileName = file.name;
          fileContent = await file.text();
        }

        console.log("[FileManager] Sending file content to bridge. Size:", fileContent.length);

        // Basic validation
        const isGcode = ['G','M','X','Y','Z','$','F','S','T'].some(char => fileContent.includes(char));
        if (!isGcode && !confirm("This file doesn't look like valid G-code. Upload anyway?")) {
          return;
        }

        await transport.invoke('save_local_file', {
          path: settings.gcodeStoragePath,
          filename: fileName,
          content: fileContent
        });
        refreshFiles();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FileManager] Upload failed:", msg);
      
      // Smart path healing for upload failure
      if (msg.toLowerCase().includes("no such file")) {
          console.log("[FileManager] Upload failed due to path, attempting healing...");
          const newPath = await healStoragePath();
          if (newPath) {
              alert("The storage path was invalid for this connection. We've updated it to your home directory. Please try the upload again.");
              return;
          }
      }
      
      alert(`Failed to upload file to storage:\n${msg}`);
    }
  };

  const activeFileName = useGcodeStore(state => state.activeFileName);
  const resetGcode = useGcodeStore(state => state.reset);
  const setGcode = useGcodeStore(state => state.setGcode);
  const simulate = useGcodeStore(state => state.simulate);

  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) return;
    try {
      await transport.invoke('delete_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      if (activeFileName === filename) {
        resetGcode();
      }
      refreshFiles();
    } catch (err) {
      console.error("[FileManager] Delete failed:", err);
      alert("Failed to delete file.");
    }
  };


  const handlePreview = async (filename: string) => {
    try {
      const fullPath = `${settings.gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      const content = await transport.invoke<string>('read_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      setGcode(content, filename, fullPath);
      simulate();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FileManager] Preview failed:", msg);
      alert(`Failed to load file preview:\n${msg}`);
    }
  };

  const handleSelect = async (filename: string) => {
    try {
      const fullPath = `${settings.gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      const content = await transport.invoke<string>('read_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      setGcode(content, filename, fullPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FileManager] Select failed:", msg);
      alert(`Failed to load file:\n${msg}`);
    }
  };

  const handleUploadToSD = async (filename: string) => {
    try {
      const content = await transport.invoke<string>('read_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      const uploadUrl = `http://${settings.connection.wsHost}/upload`;
      await transport.invoke('upload_fluidnc_file', {
        url: uploadUrl,
        target_path: "/sd/",
        filename,
        content
      });
      alert(`Synchronized ${filename} to machine SD card.`);
    } catch (err) {
      console.error("[FileManager] SD Upload failed:", err);
      alert("Failed to upload to machine. Check connection.");
    }
  };


  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden min-w-[300px]">
      {/* Header */}
      <div className="flex flex-col border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-4 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-[var(--accent-primary)]/10 rounded-lg shrink-0">
              <Database className="w-5 h-5 text-[var(--accent-primary)]" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">G-code Files</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <HardDrive className="w-3 h-3 text-[var(--text-tertiary)] shrink-0" />
                <span className="text-[10px] text-[var(--text-tertiary)] font-mono truncate max-w-full" title={settings.gcodeStoragePath}>
                  {settings.gcodeStoragePath || 'Not configured'}
                </span>
                <button
                  onClick={async () => {
                    const selected = await openDialog({ directory: true, multiple: false });
                    if (selected && typeof selected === 'string') {
                      const normalized = selected.replace(/\\/g, '/');
                      await transport.invoke('ensure_dir_exists', { path: normalized });
                      useSettingsStore.getState().updateSettings({ gcodeStoragePath: normalized });
                    }
                  }}
                  className="text-[9px] px-1.5 py-0.5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded transition-colors shrink-0"
                >
                  Change
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => refreshFiles()}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={handleUpload}
              className="flex items-center gap-2 px-3 py-1.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading && files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-50">
            <RefreshCw className="w-8 h-8 animate-spin mb-2 text-[var(--accent-primary)]" />
            <p className="text-xs text-[var(--text-secondary)]">Loading local library...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-6 bg-red-500/5 rounded-2xl border border-red-500/10">
            <HardDrive className="w-8 h-8 text-red-500/50 mb-3" />
            <p className="text-sm font-medium text-red-500/80 mb-1">{error}</p>
            <p className="text-xs text-[var(--text-tertiary)]">Check your storage path in Settings.</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 opacity-40">
            <FileCode className="w-12 h-12 mb-3" />
            <p className="text-sm font-medium">No files found</p>
            <p className="text-xs">Upload some G-code to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredFiles.map((file) => (
              <div 
                key={file.name}
                onClick={() => handleSelect(file.name)}
                className={`group flex items-center justify-between p-3 border rounded-xl transition-all duration-200 cursor-pointer ${
                  activeFileName === file.name 
                  ? "bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30 shadow-[0_0_12px_rgba(59,130,246,0.15)] border-l-4" 
                  : "bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-color)]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-lg transition-colors ${
                    activeFileName === file.name 
                    ? "bg-[var(--accent-primary)]/20" 
                    : "bg-blue-500/10 group-hover:bg-blue-500/20"
                  }`}>
                    <FileText className={`w-5 h-5 ${activeFileName === file.name ? "text-[var(--accent-primary)]" : "text-blue-500"}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-medium text-[var(--text-primary)] truncate pr-4" title={file.name}>
                      {file.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-color)]">
                        {formatSize(file.size)}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(file.modified * 1000, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePreview(file.name); }}
                    className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all"
                    title="Preview Path"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleSelect(file.name); }}
                    className={`p-2 rounded-lg transition-all ${
                        activeFileName === file.name 
                        ? "text-[var(--accent-primary)] bg-[var(--accent-primary)]/10" 
                        : "text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10"
                    }`}
                    title={activeFileName === file.name ? "File Loaded" : "Select for Carving"}
                  >
                    <Play className={`w-4 h-4 ${activeFileName === file.name ? 'fill-current' : ''}`} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleUploadToSD(file.name); }}
                    className="p-2 text-[var(--text-secondary)] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                    title="Send to Machine SD Card"
                  >
                    <HardDrive className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                    className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Delete file"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                  onClick={(e) => e.stopPropagation()} 
                  className="p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] rounded-lg transition-all"
                  title="More options"
                >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)] anim-pulse" />
            <span>{files.length} Files Ready</span>
          </div>
          <span>Total Size: {formatSize(files.reduce((acc, f) => acc + f.size, 0))}</span>
        </div>
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          <span>G-code Files</span>
        </div>
      </div>
    </div>
  );
}
