/**
 * @file FileManager.tsx
 * @purpose Manages G-code file browsing, uploads, and deletions on the CNC controller and local storage.
 */
import { useEffect, useState, useCallback } from 'react';
import { 
  FileText, Upload, Trash2, Search, 
  RefreshCw, HardDrive, FileCode,
  Clock, Database, Eye, Route
} from 'lucide-react';
import { ConfirmPopover, AlertPopover } from './ui/Popovers';
import { useRef } from 'react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { useSettingsStore } from '../stores/settingsStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { formatDistanceToNow } from 'date-fns';
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { transport, isTauri } from '../services/transportService';
import { useVisualizerStore } from '../stores/visualizerStore';
import { Tooltip } from './ui/Tooltip';

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
  const [isWebSocket, setIsWebSocket] = useState(transport.isWebSocketMode());
  const [isDragging, setIsDragging] = useState(false);
  const openVisualizer = useVisualizerStore(state => state.openVisualizer);

  // Popover State
  const [popover, setPopover] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    kind: 'info' | 'warning' | 'error' | 'success';
    okLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    position?: 'top' | 'bottom' | 'left' | 'right';
    triggerRef?: React.RefObject<HTMLElement | null>;
  }>({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    kind: 'info'
  });

  const uploadButtonRef = useRef<HTMLButtonElement>(null);
  const deleteRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const sdRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Watch for transport mode changes
  useEffect(() => {
    const interval = setInterval(() => {
      const mode = transport.isWebSocketMode();
      if (mode !== isWebSocket) setIsWebSocket(mode);
    }, 1000);
    return () => clearInterval(interval);
  }, [isWebSocket]);

  const refreshFiles = useCallback(async (isRetry = false) => {
    if (!settings.gcodeStoragePath) return;
    setLoading(true);
    setError(null);
    try {
      const list = await transport.invoke<LocalFile[]>('list_local_files', { 
        path: settings.gcodeStoragePath 
      });
      setFiles(list.sort((a, b) => Number(b.modified) - Number(a.modified)));
    } catch (err) {
      console.error("[FileManager] Failed to list files:", err);
      if (!isRetry && String(err).toLowerCase().includes("no such file")) {
        const newPath = await healStoragePath();
        if (newPath) return;
      }
      setError("Failed to access storage directory.");
    } finally {
      setLoading(false);
    }
  }, [settings.gcodeStoragePath, healStoragePath]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const saveFileContent = async (fileName: string, fileContent: string) => {
    if (!settings.gcodeStoragePath) return;
    const isGcode = ['G','M','X','Y','Z','$','F','S','T'].some(char => fileContent.includes(char));
    if (!isGcode) {
        setPopover({
            isOpen: true,
            type: 'confirm',
            title: "Validation Warning",
            message: "This file doesn't look like valid G-code. Upload anyway?",
            kind: "warning",
            okLabel: "Upload Anyway",
            onConfirm: () => performSave(fileName, fileContent),
            triggerRef: uploadButtonRef,
            position: 'bottom'
        });
        return;
    }

    await performSave(fileName, fileContent);
  };

  const performSave = async (fileName: string, fileContent: string) => {
    await transport.invoke('save_local_file', {
      path: settings.gcodeStoragePath,
      filename: fileName,
      content: fileContent
    });
    refreshFiles();
  };

  // Use a ref to track drag enter/leave depth to avoid flickering when hovering over children
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    // Only intercept if we are dragging external files
    if (!e.dataTransfer.types.includes("Files")) return;
    
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    // Check if it's a file drag - if not, let it bubble up to Dockview/parent
    if (!e.dataTransfer.types.includes("Files")) return;
    
    // Valid file drag, mark as drop target
    e.preventDefault();
    // Do NOT call e.stopPropagation() here. Bubbling allows the parent (Dockview)
    // to see these events and properly manage its panel indicators/markers.
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes("Files")) return;

    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    // If not a file drop, do nothing and let it bubble
    if (!e.dataTransfer.types.includes("Files")) return;

    e.preventDefault();
    // Do NOT stop propagation. Dockview needs to see that a drop happened 
    // to clear its markers if this drop happened to occur inside another drag operation.
    setIsDragging(false);
    dragCounter.current = 0;

    if (!settings.gcodeStoragePath) {
      setPopover({
        isOpen: true,
        type: 'alert',
        title: 'Storage Path Required',
        message: 'Please configure a G-code storage path in Settings first.',
        kind: 'warning',
        triggerRef: uploadButtonRef,
        position: 'bottom',
      });
      return;
    }

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      const content = await file.text();
      await saveFileContent(file.name, content);
    }
  };

  const handleUpload = async () => {
    if (!settings.gcodeStoragePath) {
      setPopover({
        isOpen: true,
        type: 'alert',
        title: 'Storage Path Required',
        message: 'Please configure a G-code storage path in Settings first.',
        kind: 'warning',
        triggerRef: uploadButtonRef,
        position: 'bottom',
      });
      return;
    }

    try {
      const isRemote = transport.isWebSocketMode();
      if (isTauri && !isRemote) {
        const selected = await openDialog({
          multiple: false,
          filters: [{ name: 'G-code', extensions: ['nc', 'gcode', 'gc', 'tap', 'txt'] }]
        });
        if (selected && typeof selected === 'string') {
          let isValid = true;
          if (!isValid) {
              setPopover({
                    isOpen: true,
                    type: 'confirm',
                    title: "Validation Warning",
                    message: "This file doesn't look like valid G-code. Upload anyway?",
                    kind: "warning",
                    okLabel: "Upload Anyway",
                    onConfirm: async () => {
                        await transport.invoke('copy_to_storage', { sourcePath: selected, destDir: settings.gcodeStoragePath });
                        refreshFiles();
                    },
                    triggerRef: uploadButtonRef,
                    position: 'bottom'
              });
              return;
          }
          await transport.invoke('copy_to_storage', { sourcePath: selected, destDir: settings.gcodeStoragePath });
          refreshFiles();
        }
      } else {
        let fileContent: string = "";
        let fileName: string = "";
        if (isTauri) {
          const selected = await openDialog({
            multiple: false,
            filters: [{ name: 'G-code', extensions: ['nc', 'gcode', 'gc', 'tap', 'txt'] }]
          });
          if (!selected || typeof selected !== 'string') return;
          fileContent = await tauriInvoke<string>('read_local_file', { path: "", filename: selected });
          fileName = selected.split(/[\\/]/).pop() || "uploaded.gcode";
        } else {
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
        await saveFileContent(fileName, fileContent);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("no such file")) {
          const newPath = await healStoragePath();
          if (newPath) {
              setPopover({
                  isOpen: true,
                  type: 'alert',
                  title: "Path Updated",
                  message: "Storage path was missing but has been recovered. Please try again.",
                  kind: "info",
                  triggerRef: uploadButtonRef,
                  position: 'bottom'
              });
              return;
          }
      }
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Upload Failed",
          message: `Reason: ${msg}`,
          kind: "error",
          triggerRef: uploadButtonRef,
          position: 'bottom'
      });
    }
  };

  const activeFileName = useGcodeStore(state => state.activeFileName);
  const resetGcode = useGcodeStore(state => state.reset);
  const setGcode = useGcodeStore(state => state.setGcode);
  const simulate = useGcodeStore(state => state.simulate);

  const handleDelete = async (filename: string) => {
    setPopover({
        isOpen: true,
        type: 'confirm',
        title: "Delete File",
        message: `Are you sure you want to delete ${filename}?`,
        kind: "error",
        okLabel: "Delete Permanently",
        onConfirm: async () => {
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
                setPopover({
                    isOpen: true,
                    type: 'alert',
                    title: "Delete Failed",
                    message: "Failed to delete file.",
                    kind: "error",
                    triggerRef: { current: deleteRefs.current[filename] },
                    position: 'left'
                });
              }
        },
        triggerRef: { current: deleteRefs.current[filename] },
        position: 'left'
    });
  };


  const handlePreview = async (filename: string) => {
    try {
      const fullPath = `${settings.gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      await openVisualizer(fullPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FileManager] Preview failed:", msg);
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Preview Failed",
          message: msg,
          kind: "error",
          triggerRef: uploadButtonRef, // Fallback
          position: 'left'
      });
    }
  };

  const handleSelect = async (filename: string, shouldSimulate: boolean = false) => {
    try {
      const fullPath = `${settings.gcodeStoragePath}/${filename}`.replace(/\\/g, '/');
      const content = await transport.invoke<string>('read_local_file', { 
        path: settings.gcodeStoragePath,
        filename 
      });
      setGcode(content, filename, fullPath);
      if (shouldSimulate) {
        simulate();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[FileManager] Select failed:", msg);
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Load Failed",
          message: msg,
          kind: "error",
          triggerRef: uploadButtonRef, // Fallback
          position: 'left'
      });
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
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Sync Successful",
          message: `Synchronized ${filename} to machine SD card.`,
          kind: "success",
          triggerRef: { current: sdRefs.current[filename] },
          position: 'left'
      });
    } catch (err) {
      console.error("[FileManager] SD Upload failed:", err);
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Sync Failed",
          message: "Failed to upload to machine. Check connection and SD card status.",
          kind: "error",
          triggerRef: { current: sdRefs.current[filename] },
          position: 'left'
      });
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
    <div 
      ref={dropZoneRef}
      className="flex flex-col h-full bg-[var(--bg-primary)] overflow-hidden min-w-[300px] relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--accent-primary)]/10 backdrop-blur-[2px] border-4 border-dashed border-[var(--accent-primary)]/40 rounded-2xl m-3 pointer-events-none animate-in fade-in zoom-in duration-200">
          <div className="bg-[var(--bg-primary)] p-8 rounded-full shadow-2xl border border-[var(--accent-primary)]/20 mb-6">
            <Upload className="w-16 h-16 text-[var(--accent-primary)] animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)]">Drop G-code to Upload</h3>
          <p className="text-sm text-[var(--text-tertiary)] mt-2 font-medium">Files will be saved to your local library</p>
        </div>
      )}

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
            <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
              <Database className={`w-3 h-3 ${isWebSocket ? 'text-green-500' : 'text-blue-500'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                {isWebSocket ? 'Bridge' : 'Local'}
              </span>
            </div>
            <button 
              onClick={() => refreshFiles()}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              ref={uploadButtonRef}
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
                  <Tooltip content="Preview & Analysis" position="top">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePreview(file.name); }}
                      className="p-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </Tooltip>
                  
                  <Tooltip content="Load Toolpath to Bed" position="top">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleSelect(file.name, true); }}
                      className="p-2 rounded-lg transition-all text-[var(--text-secondary)] hover:text-orange-400 hover:bg-orange-500/10 active:scale-95"
                    >
                      <Route className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  <Tooltip content="Upload to SD Card" position="top">
                    <button 
                      ref={el => { sdRefs.current[file.name] = el; }}
                      onClick={(e) => { e.stopPropagation(); handleUploadToSD(file.name); }}
                      className="p-2 text-[var(--text-secondary)] hover:text-green-400 hover:bg-green-500/10 rounded-lg transition-all"
                    >
                      <HardDrive className="w-4 h-4" />
                    </button>
                  </Tooltip>

                  <Tooltip content="Delete File" position="top">
                    <button 
                      ref={el => { deleteRefs.current[file.name] = el; }}
                      onClick={(e) => { e.stopPropagation(); handleDelete(file.name); }}
                      className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </Tooltip>
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

      {popover.type === 'confirm' ? (
        <ConfirmPopover
            isOpen={popover.isOpen}
            onClose={() => setPopover(p => ({ ...p, isOpen: false }))}
            onConfirm={popover.onConfirm || (() => {})}
            title={popover.title}
            message={popover.message}
            kind={popover.kind}
            okLabel={popover.okLabel}
            cancelLabel={popover.cancelLabel}
            triggerRef={(popover.triggerRef as React.RefObject<HTMLElement | null>) || uploadButtonRef}
            position={popover.position || 'bottom'}
        />
      ) : (
        <AlertPopover
            isOpen={popover.isOpen}
            onClose={() => setPopover(p => ({ ...p, isOpen: false }))}
            title={popover.title}
            message={popover.message}
            kind={popover.kind}
            okLabel={popover.okLabel}
            triggerRef={(popover.triggerRef as React.RefObject<HTMLElement | null>) || uploadButtonRef}
            position={popover.position || 'bottom'}
        />
      )}
    </div>
  );
}
