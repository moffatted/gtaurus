/**
 * @file ToolLibraryPanel.tsx
 * @purpose Two-pane tool library: left sidebar list + right detail/edit panel.
 */
import { useState, useRef } from 'react';
import {
  Wrench, Plus, Search, Trash, Edit, History, CheckCircle2, Clock,
  Navigation, ExternalLink, BookOpen, ChevronDown, Upload, Download,
  FolderSearch, Settings, X, Check,
} from 'lucide-react';
import { useToolStore, Bit, ToolType } from '../stores/toolStore';
import { useSettingsStore } from '../stores/settingsStore';
import { Tooltip } from './ui/Tooltip';
import { BitVisualizer } from './ui/BitVisualizer';
import { ConfirmPopover, AlertPopover } from './ui/Popovers';
import { isTauriApp } from '../utils/platform';
import clsx from 'clsx';

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_FILTERS = ['all', 'endmill', 'v-bit', 'ballnose', 'surfacing', 'other'] as const;
type FilterType = (typeof TYPE_FILTERS)[number];

const TYPE_COLORS: Record<ToolType, string> = {
  endmill:   'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'v-bit':   'text-purple-400 bg-purple-500/10 border-purple-500/30',
  ballnose:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  surfacing: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  other:     'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] border-[var(--border-color)]',
};

const EMPTY_FORM = (): Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'> => ({
  name: '', type: 'endmill', diameter: 6, number: 1,
  fluteCount: 2, fluteLength: undefined, overallLength: undefined,
  angle: undefined, material: 'Carbide', notes: '',
});

// ─── Main Component ──────────────────────────────────────────────────────────

export function ToolLibraryPanel() {
  const { tools, activeToolId, addTool, updateTool, deleteTool, setActiveTool } = useToolStore();
  const { settings, setToolLibrarySettings } = useSettingsStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM());

  const deleteRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [popover, setPopover] = useState<{
    isOpen: boolean; type: 'confirm' | 'alert'; title: string; message: string;
    kind: 'info' | 'warning' | 'error' | 'success'; okLabel?: string;
    onConfirm?: () => void; triggerRef: React.RefObject<HTMLButtonElement | null>;
  } | null>(null);

  // ── Derived state ────────────────────────────────────────────────────────
  const filtered = tools.filter(t => {
    const matchesType = filter === 'all' || t.type === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.type.includes(q) || String(t.number).includes(q);
    return matchesType && matchesSearch;
  });

  const selectedTool = tools.find(t => t.id === selectedId) ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const startAdd = () => {
    setForm(EMPTY_FORM());
    setEditingId(null);
    setIsAdding(true);
    setSelectedId(null);
  };

  const startEdit = (tool: Bit) => {
    setForm({ name: tool.name, type: tool.type, diameter: tool.diameter, number: tool.number,
      fluteCount: tool.fluteCount, fluteLength: tool.fluteLength, overallLength: tool.overallLength,
      angle: tool.angle, material: tool.material, notes: tool.notes });
    setEditingId(tool.id);
    setIsAdding(false);
    setSelectedId(tool.id);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      updateTool(editingId, form);
      setEditingId(null);
    } else {
      addTool(form);
      setIsAdding(false);
    }
    setForm(EMPTY_FORM());
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setForm(EMPTY_FORM());
  };

  const handleDelete = (tool: Bit) => {
    setPopover({
      isOpen: true, type: 'confirm', title: 'Delete Tool',
      message: `Delete "${tool.name}" from your library?`,
      kind: 'error', okLabel: 'Delete',
      onConfirm: () => { deleteTool(tool.id); if (selectedId === tool.id) setSelectedId(null); },
      triggerRef: { current: deleteRefs.current[tool.id] },
    });
  };

  // ── Import / Export ──────────────────────────────────────────────────────
  const importFromJSON = (text: string) => {
    const data = JSON.parse(text);
    const items: any[] = Array.isArray(data) ? data : (data.data || data.tools || []);
    let imported = 0;
    for (const item of items) {
      const bit = parseFusionTool(item);
      if (!bit) continue;
      const existing = bit.fusionGuid ? tools.find(t => t.fusionGuid === bit.fusionGuid) : null;
      if (existing) { updateTool(existing.id, bit); } else { addTool(bit); imported++; }
    }
    setPopover({ isOpen: true, type: 'alert', title: 'Import Successful',
      message: `Imported ${imported} tool${imported !== 1 ? 's' : ''}.`, kind: 'success',
      triggerRef: { current: null } });
  };

  const importFromCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let imported = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const get = (k: string) => { const idx = headers.indexOf(k); return idx >= 0 ? cols[idx] : undefined; };
      const diameter = parseFloat(get('diameter') || '0');
      if (!diameter) continue;
      const rawType = (get('type') || 'other').toLowerCase();
      const type = (['endmill', 'v-bit', 'ballnose', 'surfacing'].includes(rawType) ? rawType : 'other') as ToolType;
      addTool({ name: get('name') || `Tool ${i}`, type, diameter,
        number: parseInt(get('number') || String(tools.length + imported + 1)),
        fluteCount: parseInt(get('flutes') || '2'), fluteLength: parseFloat(get('flute_length') || '') || undefined,
        overallLength: parseFloat(get('overall_length') || '') || undefined, angle: parseFloat(get('angle') || '') || undefined,
        material: get('material') || 'Carbide', notes: get('notes') || '' });
      imported++;
    }
    setPopover({ isOpen: true, type: 'alert', title: 'CSV Import Successful',
      message: `Imported ${imported} tool${imported !== 1 ? 's' : ''} from CSV.`, kind: 'success',
      triggerRef: { current: null } });
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,.csv,.tools';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0]; if (!file) return;
      try {
        if (file.name.endsWith('.csv')) { importFromCSV(await file.text()); }
        else if (file.name.endsWith('.tools')) { await importFromToolsFile(file); }
        else { importFromJSON(await file.text()); }
      } catch (err) {
        setPopover({ isOpen: true, type: 'alert', title: 'Import Failed',
          message: err instanceof Error ? err.message : 'Unknown error', kind: 'error',
          triggerRef: { current: null } });
      }
    };
    input.click();
  };

  const importFromToolsFile = async (file: File) => {
    const { BlobReader, ZipReader, TextWriter } = await import('@zip.js/zip.js');
    const reader = new ZipReader(new BlobReader(file));
    const entries = await reader.getEntries();
    const jsonEntry = entries.find(e => e.filename.endsWith('.json') || e.filename.endsWith('.tools'));
    if (!jsonEntry || !('getData' in jsonEntry)) { importFromJSON(await file.text()); return; }
    const text = await (jsonEntry as any).getData(new TextWriter());
    await reader.close();
    importFromJSON(text);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ tools }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gtaurus_tool_library.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleScanFusion = async () => {
    try {
      const { invoke, convertFileSrc } = await import('@tauri-apps/api/core');
      const autoPaths: string[] = await invoke('find_fusion_tools');
      if (settings.toolLibrary.fusionLibraryPath && !autoPaths.includes(settings.toolLibrary.fusionLibraryPath))
        autoPaths.push(settings.toolLibrary.fusionLibraryPath);
      if (autoPaths.length > 0) {
        setPopover({ isOpen: true, type: 'confirm', title: 'Fusion Sync Found',
          message: `Auto-detected ${autoPaths.length} Fusion 360 librar${autoPaths.length !== 1 ? 'ies' : 'y'}. Sync now?`,
          kind: 'info', okLabel: 'Sync & Import',
          onConfirm: async () => {
            for (const p of autoPaths) { const r = await fetch(convertFileSrc(p)); if (r.ok) importFromJSON(await r.text()); }
          }, triggerRef: { current: null } });
        return;
      }
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({ multiple: true, filters: [{ name: 'Fusion Tool Library', extensions: ['json', 'tools'] }] });
      if (!selected) return;
      for (const p of Array.isArray(selected) ? selected : [selected]) {
        const r = await fetch(convertFileSrc(p)); if (r.ok) importFromJSON(await r.text());
      }
    } catch (err) {
      setPopover({ isOpen: true, type: 'alert', title: 'Fusion Scan Failed',
        message: err instanceof Error ? err.message : 'Unknown error', kind: 'error', triggerRef: { current: null } });
    }
  };

  const showingForm = isAdding || !!editingId;

  return (
    <div className="h-full flex bg-[var(--bg-primary)] overflow-hidden">

      {/* ── LEFT SIDEBAR ────────────────────────────────────────────────── */}
      <div className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border-color)] bg-[var(--bg-secondary)]">

        {/* Sidebar header */}
        <div className="p-3 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Tool Library</span>
            <span className="ml-auto text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded-full">{tools.length}</span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            <input type="text" placeholder="Search tools…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors" />
          </div>

          {/* Type filter tabs */}
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={clsx('px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-tight transition-colors',
                  filter === f ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]')}>
                {f === 'all' ? `All (${tools.length})` : f}
              </button>
            ))}
          </div>
        </div>

        {/* Tool list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filtered.length === 0 && (
            <div className="text-center py-10 px-4">
              <Wrench className="w-8 h-8 text-[var(--text-tertiary)] opacity-20 mx-auto mb-2" />
              <p className="text-[11px] text-[var(--text-tertiary)]">{tools.length === 0 ? 'No tools yet' : 'No matches'}</p>
            </div>
          )}
          {filtered.map(tool => (
            <div key={tool.id}
              onClick={() => { setSelectedId(tool.id); if (editingId !== tool.id) { setEditingId(null); setIsAdding(false); } }}
              className={clsx(
                'group relative flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all',
                selectedId === tool.id && !showingForm
                  ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/40'
                  : editingId === tool.id
                  ? 'bg-[var(--bg-tertiary)] border-[var(--accent-primary)]/30'
                  : 'bg-[var(--bg-primary)] border-transparent hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-color)]'
              )}>
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center flex-shrink-0">
                <BitVisualizer type={tool.type} diameter={tool.diameter} fluteLength={tool.fluteLength}
                  overallLength={tool.overallLength} angle={tool.angle} size={32}
                  isActive={activeToolId === tool.id} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-[var(--text-primary)] truncate leading-tight">{tool.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase', TYPE_COLORS[tool.type])}>{tool.type}</span>
                  <span className="text-[9px] font-mono text-[var(--text-tertiary)]">Ø{tool.diameter}mm</span>
                  {activeToolId === tool.id && <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar footer actions */}
        <div className="p-3 border-t border-[var(--border-color)] space-y-2">
          <button onClick={startAdd}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
            <Plus className="w-3.5 h-3.5" /> New Tool
          </button>
          <div className="flex gap-1.5">
            {isTauriApp() && (
              <>
                <Tooltip content="Sync Fusion 360 Library" position="top">
                  <button onClick={handleScanFusion}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-purple-500/30 text-purple-400 text-[10px] font-bold rounded-lg hover:bg-purple-500/10 transition-colors">
                    <FolderSearch className="w-3 h-3" /> Fusion
                  </button>
                </Tooltip>
                <Tooltip content="Set Fusion library path" position="top">
                  <button onClick={async () => {
                    const { open } = await import('@tauri-apps/plugin-dialog');
                    const selected = await open({ multiple: false, filters: [{ name: 'Fusion Tool Library', extensions: ['json', 'tools'] }] });
                    if (selected && typeof selected === 'string') {
                      setToolLibrarySettings({ fusionLibraryPath: selected });
                      setPopover({ isOpen: true, type: 'alert', title: 'Path Saved',
                        message: 'Fusion library path saved.', kind: 'success', triggerRef: { current: null } });
                    }
                  }} className="p-1.5 border border-purple-500/30 text-purple-400 text-[10px] rounded-lg hover:bg-purple-500/10 transition-colors">
                    <Settings className="w-3 h-3" />
                  </button>
                </Tooltip>
              </>
            )}
            <Tooltip content="Import (.json / .csv / .tools)" position="top">
              <button onClick={handleImport}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-[var(--border-color)] text-[var(--text-tertiary)] text-[10px] font-bold rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
                <Upload className="w-3 h-3" /> Import
              </button>
            </Tooltip>
            <Tooltip content="Export as JSON" position="top">
              <button onClick={handleExport}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 border border-[var(--border-color)] text-[var(--text-tertiary)] text-[10px] font-bold rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] transition-colors">
                <Download className="w-3 h-3" /> Export
              </button>
            </Tooltip>
          </div>
          <p className="text-[9px] text-[var(--text-tertiary)] text-center flex items-center justify-center gap-1">
            <History className="w-3 h-3" /> Changes persist across sessions
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showingForm ? (
          <ToolForm form={form} onChange={setForm} isEditing={!!editingId}
            onSave={handleSave} onCancel={handleCancel} />
        ) : selectedTool ? (
          <ToolDetail tool={selectedTool} isActive={activeToolId === selectedTool.id}
            onSetActive={() => setActiveTool(selectedTool.id)}
            onEdit={() => startEdit(selectedTool)}
            onDelete={() => handleDelete(selectedTool)}
            deleteRef={el => { deleteRefs.current[selectedTool.id] = el; }}
          />
        ) : (
          <EmptyRight onNew={startAdd} />
        )}
      </div>

      {/* ── Popovers ─────────────────────────────────────────────────────── */}
      {popover?.isOpen && (
        popover.type === 'confirm' ? (
          <ConfirmPopover isOpen onClose={() => setPopover(null)} onConfirm={popover.onConfirm || (() => {})}
            title={popover.title} message={popover.message} kind={popover.kind}
            okLabel={popover.okLabel} triggerRef={popover.triggerRef} position="left" />
        ) : (
          <AlertPopover isOpen onClose={() => setPopover(null)} title={popover.title}
            message={popover.message} kind={popover.kind} triggerRef={popover.triggerRef} position="bottom" />
        )
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyRight({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
        <Wrench className="w-8 h-8 text-[var(--text-tertiary)] opacity-30" />
      </div>
      <div>
        <p className="text-sm font-bold text-[var(--text-secondary)]">No tool selected</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">Select a tool from the list or add a new one</p>
      </div>
      <button onClick={onNew}
        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity">
        <Plus className="w-3.5 h-3.5" /> New Tool
      </button>
      <ReferenceLinks />
    </div>
  );
}

// ─── Tool Detail (read-only) ───────────────────────────────────────────────────

function ToolDetail({ tool, isActive, onSetActive, onEdit, onDelete, deleteRef }: {
  tool: Bit; isActive: boolean;
  onSetActive: () => void; onEdit: () => void; onDelete: () => void;
  deleteRef: (el: HTMLButtonElement | null) => void;
}) {
  const fields: [string, string][] = [
    ['Type', tool.type], ['Diameter', `${tool.diameter} mm`], ['Tool #', `T${tool.number}`],
    ['Flutes', String(tool.fluteCount)], ['Material', tool.material],
    ...(tool.fluteLength != null ? [['Flute Length', `${tool.fluteLength} mm`] as [string,string]] : []),
    ...(tool.overallLength != null ? [['Overall Length', `${tool.overallLength} mm`] as [string,string]] : []),
    ...(tool.angle != null ? [['Tip Angle', `${tool.angle}°`] as [string,string]] : []),
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Detail header */}
      <div className="flex items-start justify-between p-5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center">
            <BitVisualizer type={tool.type} diameter={tool.diameter} fluteLength={tool.fluteLength}
              overallLength={tool.overallLength} angle={tool.angle} size={56} isActive={isActive} />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">{tool.name}</h2>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase', TYPE_COLORS[tool.type])}>{tool.type}</span>
              <span className="text-[11px] font-mono text-[var(--text-secondary)]">Ø{tool.diameter}mm · T{tool.number}</span>
              {isActive && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Active
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isActive && (
            <button onClick={onSetActive}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)] hover:text-white hover:border-[var(--accent-primary)] transition-all">
              Set Active
            </button>
          )}
          <button onClick={onEdit}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button ref={deleteRef} onClick={onDelete}
            className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-400 hover:border-red-500/30 transition-colors">
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Detail body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
        {/* Specs grid */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-3">Specifications</p>
          <div className="grid grid-cols-2 gap-px bg-[var(--border-color)] rounded-xl overflow-hidden border border-[var(--border-color)]">
            {fields.map(([label, value]) => (
              <div key={label} className="flex justify-between items-center px-3 py-2.5 bg-[var(--bg-secondary)]">
                <span className="text-[11px] text-[var(--text-tertiary)]">{label}</span>
                <span className="text-[11px] font-mono font-bold text-[var(--text-primary)]">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Usage stats */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-3">Usage Statistics</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
              <Clock className="w-4 h-4 text-[var(--text-tertiary)]" />
              <div>
                <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-tight">Run Time</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{(tool.usageTimeSec / 3600).toFixed(1)} hrs</p>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-3">
              <Navigation className="w-4 h-4 text-[var(--text-tertiary)]" />
              <div>
                <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-tight">Cut Distance</p>
                <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{(tool.usageDistanceMm / 1000).toFixed(1)} m</p>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {tool.notes && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2">Notes</p>
            <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 leading-relaxed">{tool.notes}</p>
          </div>
        )}

        {/* Fusion GUID */}
        {tool.fusionGuid && (
          <p className="text-[9px] font-mono text-[var(--text-tertiary)] opacity-50">Fusion GUID: {tool.fusionGuid}</p>
        )}
      </div>
    </div>
  );
}

// ─── Tool Form (add / edit) ────────────────────────────────────────────────────

type FormState = Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>;

function ToolForm({ form, onChange, isEditing, onSave, onCancel }: {
  form: FormState; onChange: (f: FormState) => void;
  isEditing: boolean; onSave: () => void; onCancel: () => void;
}) {
  const set = (patch: Partial<FormState>) => onChange({ ...form, ...patch });
  const inputCls = "w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors";
  const labelCls = "block text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wide mb-1.5";
  const canSave = form.name.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Form header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">{isEditing ? 'Edit Tool' : 'Add New Tool'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5 flex gap-6">
          {/* Left: BitVisualizer preview */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <div className="w-24 h-36 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
              <BitVisualizer type={form.type} diameter={form.diameter} fluteLength={form.fluteLength}
                overallLength={form.overallLength} angle={form.angle} size={80} />
            </div>
            <p className="text-[9px] font-bold uppercase text-[var(--text-tertiary)] tracking-widest">Preview</p>
          </div>

          {/* Right: fields */}
          <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 content-start">
            <div className="col-span-2">
              <label className={labelCls}>Name *</label>
              <input className={inputCls} value={form.name} onChange={e => set({ name: e.target.value })} placeholder="e.g. 1/4&quot; Upcut Endmill" />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => set({ type: e.target.value as ToolType })}>
                <option value="endmill">Endmill</option>
                <option value="v-bit">V-Bit</option>
                <option value="ballnose">Ballnose</option>
                <option value="surfacing">Surfacing</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Tool # (T#)</label>
              <input type="number" className={inputCls} value={form.number} onChange={e => set({ number: +e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Diameter (mm)</label>
              <input type="number" step="0.001" className={inputCls} value={form.diameter} onChange={e => set({ diameter: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className={labelCls}>Flutes</label>
              <input type="number" className={inputCls} value={form.fluteCount} onChange={e => set({ fluteCount: +e.target.value })} />
            </div>
            <div>
              <label className={labelCls}>Flute Length (mm)</label>
              <input type="number" step="0.5" className={inputCls} value={form.fluteLength ?? ''} placeholder="optional"
                onChange={e => set({ fluteLength: e.target.value ? parseFloat(e.target.value) : undefined })} />
            </div>
            <div>
              <label className={labelCls}>Overall Length (mm)</label>
              <input type="number" step="0.5" className={inputCls} value={form.overallLength ?? ''} placeholder="optional"
                onChange={e => set({ overallLength: e.target.value ? parseFloat(e.target.value) : undefined })} />
            </div>
            <div>
              <label className={labelCls}>Material</label>
              <input className={inputCls} value={form.material} onChange={e => set({ material: e.target.value })} placeholder="Carbide / HSS" />
            </div>
            {form.type === 'v-bit' && (
              <div>
                <label className={labelCls}>Tip Angle (°)</label>
                <input type="number" step="5" className={inputCls} value={form.angle ?? 60} onChange={e => set({ angle: parseFloat(e.target.value) })} />
              </div>
            )}
            <div className="col-span-2">
              <label className={labelCls}>Notes</label>
              <textarea className={inputCls + ' h-16 resize-none'} value={form.notes ?? ''} onChange={e => set({ notes: e.target.value })} />
            </div>
          </div>
        </div>
      </div>

      {/* Form footer */}
      <div className="flex gap-3 px-5 py-3.5 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <button onClick={onSave} disabled={!canSave}
          className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all',
            canSave ? 'bg-[var(--accent-primary)] text-white hover:opacity-90' : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed')}>
          <Check className="w-3.5 h-3.5" /> {isEditing ? 'Update Tool' : 'Save to Library'}
        </button>
        <button onClick={onCancel}
          className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Reference Links ──────────────────────────────────────────────────────────

const REFERENCE_LINKS = [
  { category: 'Visual Identification Guides', links: [
    { label: 'CNC Cookbook — Router Bit Guide', url: 'https://www.cnccookbook.com/cnc-router-bits/', desc: 'Photos of bit types with purposes and chip-clearance diagrams.' },
    { label: 'Amana Tool — Bit Search', url: 'https://www.amanatool.com/nsearch?q=bits', desc: 'Industry-standard profile drawings for matching physical bits.' },
    { label: 'Whiteside Router Bits', url: 'https://www.whitesiderouterbits.com/', desc: 'Comprehensive catalog with detailed specifications.' },
  ]},
  { category: 'Fusion Integration', links: [
    { label: 'Fusion Cloud Tool Library', url: 'https://cam.autodesk.com/hsmposts', desc: 'Free manufacturer libraries (.json / .hsmlib) for 3D bit preview.' },
    { label: 'Local Library Path', url: '#', desc: 'Windows: %AppData%/Autodesk/CAM360/libraries/Local — macOS: ~/Library/Application Support/Autodesk/CAM360/libraries/Local' },
  ]},
];

function ReferenceLinks() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="w-full border border-[var(--border-color)] rounded-xl overflow-hidden mt-2">
      <button onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] cursor-pointer transition-colors">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Reference & Identification</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`} />
      </button>
      {expanded && (
        <div className="px-4 py-3 bg-[var(--bg-primary)] space-y-4">
          {REFERENCE_LINKS.map(cat => (
            <div key={cat.category}>
              <p className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">{cat.category}</p>
              <div className="space-y-1">
                {cat.links.map(link => (
                  <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="group flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                    <ExternalLink className="w-3 h-3 text-[var(--accent-primary)] mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100" />
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">{link.label}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{link.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fusion Tool Parser ────────────────────────────────────────────────────────

type BitInput = Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>;

function parseFusionTool(item: any): BitInput | null {
  const geom = item.geometry || item;
  const post = item['post-process'] || item.post_process || item;
  const guid = item.guid || item.reference_guid || undefined;
  const diameter = geom.diameter ?? geom.dc ?? geom.DC ?? item.diameter ?? null;
  if (diameter === null || diameter === undefined) return null;
  const fusionType = (item.type || item.tool_type || '').toLowerCase();
  let type: ToolType = 'other';
  if (fusionType.includes('flat end') || fusionType.includes('endmill') || fusionType === 'mill') type = 'endmill';
  else if (fusionType.includes('chamfer') || fusionType.includes('v-bit') || fusionType.includes('engrav')) type = 'v-bit';
  else if (fusionType.includes('ball')) type = 'ballnose';
  else if (fusionType.includes('face') || fusionType.includes('surfac') || fusionType.includes('fly')) type = 'surfacing';
  const fluteCount = geom['number-of-flutes'] ?? geom.number_of_flutes ?? geom.fluteCount ?? 2;
  const fluteLength = geom['body-length'] ?? geom['flute-length'] ?? geom.body_length ?? geom.fluteLength ?? undefined;
  const overallLength = geom['overall-length'] ?? geom.overall_length ?? geom.overallLength ?? undefined;
  const angle = geom['tip-angle'] ?? geom['taper-angle'] ?? geom['included-angle'] ?? geom.angle ?? undefined;
  const toolNumber = post.number ?? post.tool_number ?? 1;
  const material = item.BMC ?? item.bmc ?? item.material ?? item['tool-material'] ?? 'Carbide';
  return {
    name: item.description || item.name || item['product-id'] || `Imported ${type}`,
    type, diameter: typeof diameter === 'number' ? diameter : parseFloat(diameter),
    number: typeof toolNumber === 'number' ? toolNumber : parseInt(toolNumber) || 1,
    fluteCount: typeof fluteCount === 'number' ? fluteCount : parseInt(fluteCount) || 2,
    fluteLength: fluteLength !== undefined ? (typeof fluteLength === 'number' ? fluteLength : parseFloat(fluteLength)) : undefined,
    overallLength: overallLength !== undefined ? (typeof overallLength === 'number' ? overallLength : parseFloat(overallLength)) : undefined,
    angle: angle !== undefined ? (typeof angle === 'number' ? angle : parseFloat(angle)) : undefined,
    material: typeof material === 'string' ? material : 'Carbide',
    notes: item.comment || item.notes || '',
    fusionGuid: guid,
  };
}
