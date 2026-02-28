/**
 * @file ToolLibraryPanel.tsx
 * @purpose Management interface for the CNC bit library, including tool creation, editing, and selection.
 */
import { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash, 
  Edit, 
  History, 
  CheckCircle2, 
  Clock,
  Navigation,
  ExternalLink,
  BookOpen,
  ChevronDown,
  Upload,
  Download,
  FolderSearch,
} from 'lucide-react';
import { useToolStore, Bit, ToolType } from '../stores/toolStore';
import { Tooltip } from './ui/Tooltip';
import { BitVisualizer } from './ui/BitVisualizer';
import { ConfirmPopover, AlertPopover } from './ui/Popovers';
import { isTauriApp } from '../utils/platform';
import { useRef } from 'react';
import clsx from 'clsx';

export function ToolLibraryPanel() {
  const { tools, activeToolId, addTool, updateTool, deleteTool, setActiveTool } = useToolStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [popover, setPopover] = useState<{
    isOpen: boolean;
    type: 'confirm' | 'alert';
    title: string;
    message: string;
    kind: 'info' | 'warning' | 'error' | 'success';
    okLabel?: string;
    onConfirm?: () => void;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
  } | null>(null);

  const libraryHeaderRef = useRef<HTMLDivElement>(null);
  const deleteRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Form State
  const [formData, setFormData] = useState<Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>>({
    name: '',
    type: 'endmill',
    diameter: 3.175,
    number: 1,
    fluteCount: 2,
    fluteLength: 12,
    overallLength: 38,
    material: 'Carbide',
    notes: ''
  });

  const filteredTools = tools.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  const activeTool = tools.find(t => t.id === activeToolId);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'endmill',
      diameter: 3.175,
      number: 1,
      fluteCount: 2,
      fluteLength: 12,
      overallLength: 38,
      material: 'Carbide',
      notes: ''
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) return;
    if (editingId) {
      updateTool(editingId, formData);
    } else {
      addTool(formData);
    }
    resetForm();
  };

  const handleEdit = (tool: Bit) => {
    setFormData({
      name: tool.name,
      type: tool.type,
      diameter: tool.diameter,
      number: tool.number,
      fluteCount: tool.fluteCount,
      fluteLength: tool.fluteLength,
      overallLength: tool.overallLength,
      angle: tool.angle,
      material: tool.material,
      notes: tool.notes
    });
    setEditingId(tool.id);
    setIsAdding(false);
  };

  // ── Import / Export ─────────────────────────────────────────────────────
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.csv,.tools';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        if (file.name.endsWith('.csv')) {
          const text = await file.text();
          importFromCSV(text);
        } else if (file.name.endsWith('.tools')) {
          // Fusion .tools files are zipped JSON
          await importFromToolsFile(file);
        } else {
          const text = await file.text();
          importFromJSON(text);
        }
      } catch (err) {
        setPopover({
            isOpen: true,
            type: 'alert',
            title: "Import Failed",
            message: err instanceof Error ? err.message : 'Unknown error',
            kind: 'error',
            triggerRef: { current: null } // Will fallback to default in renderer
        });
      }
    };
    input.click();
  };

  const importFromToolsFile = async (file: File) => {
    // .tools files are ZIP archives containing a JSON tool library
    const { BlobReader, ZipReader, TextWriter } = await import('@zip.js/zip.js');
    const reader = new ZipReader(new BlobReader(file));
    const entries = await reader.getEntries();
    const jsonEntry = entries.find(e => e.filename.endsWith('.json') || e.filename.endsWith('.tools'));
    if (!jsonEntry || !('getData' in jsonEntry)) {
      // Might not be zipped — try parsing as raw JSON
      const text = await file.text();
      importFromJSON(text);
      return;
    }
    const text = await (jsonEntry as any).getData(new TextWriter());
    await reader.close();
    importFromJSON(text);
  };

  const importFromJSON = (text: string) => {
    const data = JSON.parse(text);
    let imported = 0;

    // Fusion tool library format: { data: [ { ... } ] } or [ { ... } ]
    const items: any[] = Array.isArray(data) ? data : (data.data || data.tools || []);

    for (const item of items) {
      const bit = parseFusionTool(item);
      if (bit) {
        addTool(bit);
        imported++;
      }
    }
    setPopover({
        isOpen: true,
        type: 'alert',
        title: "Import Successful",
        message: `Imported ${imported} tool${imported !== 1 ? 's' : ''} successfully.`,
        kind: 'success',
        triggerRef: { current: null }
    });
  };

  const importFromCSV = (text: string) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    let imported = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      const get = (key: string) => {
        const idx = headers.indexOf(key);
        return idx >= 0 ? cols[idx] : undefined;
      };

      const name = get('name') || get('description') || `Imported Tool ${i}`;
      const diameter = parseFloat(get('diameter') || '0');
      if (!diameter) continue;

      const rawType = (get('type') || 'other').toLowerCase();
      const type: ToolType = (['endmill', 'v-bit', 'ballnose', 'surfacing'].includes(rawType) ? rawType : 'other') as ToolType;

      addTool({
        name,
        type,
        diameter,
        number: parseInt(get('number') || get('tool_number') || String(tools.length + imported + 1)),
        fluteCount: parseInt(get('flutes') || get('flute_count') || '2'),
        fluteLength: parseFloat(get('flute_length') || '') || undefined,
        overallLength: parseFloat(get('overall_length') || '') || undefined,
        angle: parseFloat(get('angle') || '') || undefined,
        material: get('material') || 'Carbide',
        notes: get('notes') || '',
      });
      imported++;
    }
    setPopover({
        isOpen: true,
        type: 'alert',
        title: "CSV Import Successful",
        message: `Imported ${imported} tool${imported !== 1 ? 's' : ''} from CSV.`,
        kind: 'success',
        triggerRef: { current: null }
    });
  };

  const handleExport = () => {
    const payload = JSON.stringify({ tools }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gtaurus_tool_library.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Scan Fusion local library directory (Tauri only)
  const handleScanFusion = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: true,
        filters: [{
          name: 'Fusion Tool Library',
          extensions: ['json', 'tools'],
        }],
        title: 'Select Fusion Tool Library Files',
      });
      if (!selected) return;
      const paths = Array.isArray(selected) ? selected : [selected];
      let totalImported = 0;
      for (const filePath of paths) {
        // Read file via fetch (Tauri asset protocol)
        const resp = await fetch(`https://asset.localhost/${encodeURIComponent(filePath)}`);
        if (!resp.ok) {
          // Fallback: read as text via convertFileSrc
          const { convertFileSrc } = await import('@tauri-apps/api/core');
          const assetUrl = convertFileSrc(filePath);
          const fallbackResp = await fetch(assetUrl);
          const text = await fallbackResp.text();
          const before = tools.length;
          importFromJSON(text);
          totalImported += tools.length - before;
          continue;
        }
        const text = await resp.text();
        importFromJSON(text);
      }
      if (totalImported === 0) {
        // importFromJSON already shows its own alert
      }
    } catch (err) {
      setPopover({
          isOpen: true,
          type: 'alert',
          title: "Fusion Scan Failed",
          message: err instanceof Error ? err.message : 'Unknown error',
          kind: 'error',
          triggerRef: { current: null }
      });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-x-auto min-w-[320px]">
      {/* Header */}
      <div ref={libraryHeaderRef} className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Tool Library</h2>
          </div>
          <div className="flex items-center gap-2">
            {isTauriApp() && (
              <Tooltip content="Scan Fusion Library" position="bottom">
                <button
                  onClick={handleScanFusion}
                  className="flex items-center gap-1.5 px-2 py-1.5 border border-purple-500/30 text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-500/10 hover:border-purple-500/50 transition-all cursor-pointer"
                >
                  <FolderSearch className="w-3.5 h-3.5" />
                </button>
              </Tooltip>
            )}
            <Tooltip content="Import Tool Library (.json / .csv / .tools)" position="bottom">
              <button
                onClick={handleImport}
                className="flex items-center gap-1.5 px-2 py-1.5 border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Export Library as JSON" position="bottom">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-2 py-1.5 border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <button 
              onClick={() => { resetForm(); setIsAdding(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Bit
            </button>
          </div>
        </div>

        {/* Active Tool Badge */}
        {activeTool && (
          <div className="mb-4 p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center shadow-lg shadow-[var(--accent-primary)]/20">
                <BitVisualizer type={activeTool.type} diameter={activeTool.diameter} fluteLength={activeTool.fluteLength} overallLength={activeTool.overallLength} angle={activeTool.angle} size={36} isActive />
              </div>
              <div>
                <div className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-tighter opacity-70">Currently Loaded</div>
                <div className="text-sm font-bold text-[var(--text-primary)] leading-tight">{activeTool.name}</div>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-mono text-[var(--accent-primary)] font-bold">{activeTool.diameter}mm</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1" />
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
          <input 
            type="text"
            placeholder="Search bits by name or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="mb-6 p-4 bg-[var(--bg-secondary)] border border-[var(--accent-primary)]/30 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase mb-4 flex items-center gap-2">
              {editingId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? 'Edit Bit' : 'Add New Bit to Catalog'}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Bit Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. 1/8 Downcut carbide"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as ToolType})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] cursor-pointer"
                >
                  <option value="endmill">Endmill</option>
                  <option value="v-bit">V-Bit</option>
                  <option value="ballnose">Ballnose</option>
                  <option value="surfacing">Surfacing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Diameter (mm)</label>
                <input 
                  type="number"
                  step="0.001"
                  value={formData.diameter}
                  onChange={(e) => setFormData({...formData, diameter: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Flutes</label>
                <input 
                  type="number"
                  value={formData.fluteCount}
                  onChange={(e) => setFormData({...formData, fluteCount: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Material</label>
                <input 
                  type="text"
                  value={formData.material}
                  onChange={(e) => setFormData({...formData, material: e.target.value})}
                  placeholder="Carbide / HSS"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Tool Number (T#)</label>
                <input 
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>

              {/* Geometry Fields */}
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Flute Length (mm)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={formData.fluteLength ?? ''}
                  onChange={(e) => setFormData({...formData, fluteLength: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="Cutting edge"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Overall Length (mm)</label>
                <input 
                  type="number"
                  step="0.5"
                  value={formData.overallLength ?? ''}
                  onChange={(e) => setFormData({...formData, overallLength: e.target.value ? parseFloat(e.target.value) : undefined})}
                  placeholder="Total stick-out"
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                />
              </div>
              {formData.type === 'v-bit' && (
                <div>
                  <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Tip Angle (°)</label>
                  <input 
                    type="number"
                    step="5"
                    value={formData.angle ?? 60}
                    onChange={(e) => setFormData({...formData, angle: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
              )}

              {/* Live Preview */}
              <div className="col-span-2 flex flex-col items-center py-4 bg-[var(--bg-tertiary)] rounded-xl border border-[var(--border-color)]">
                <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Preview</div>
                <BitVisualizer
                  type={formData.type}
                  diameter={formData.diameter}
                  fluteLength={formData.fluteLength}
                  overallLength={formData.overallLength}
                  angle={formData.angle}
                  size={100}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5 ml-1">Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full px-3 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] min-h-[60px]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button 
                onClick={handleSubmit}
                className="flex-1 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90"
              >
                {editingId ? 'Update Bit' : 'Save to Catalog'}
              </button>
              <button 
                onClick={resetForm}
                className="px-4 py-2 border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Bit Grid */}
        <div className="grid grid-cols-1 gap-3">
          {filteredTools.map(tool => (
            <div 
              key={tool.id}
              className={clsx(
                "group relative p-4 rounded-2xl border transition-all duration-200",
                activeToolId === tool.id 
                  ? "bg-[var(--bg-secondary)] border-[var(--accent-primary)]" 
                  : "bg-[var(--bg-secondary)]/50 border-[var(--border-color)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-secondary)]"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className={clsx(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    activeToolId === tool.id 
                      ? "bg-[var(--accent-primary)]/15 shadow-lg shadow-[var(--accent-primary)]/20" 
                      : "bg-[var(--bg-tertiary)]"
                  )}>
                    <BitVisualizer type={tool.type} diameter={tool.diameter} fluteLength={tool.fluteLength} overallLength={tool.overallLength} angle={tool.angle} size={44} isActive={activeToolId === tool.id} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] leading-snug group-hover:text-[var(--accent-primary)] transition-colors">
                      {tool.name}
                    </h4>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-md">
                        {tool.diameter}mm
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-md">
                        T{tool.number}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">
                        {tool.fluteCount} Flute {tool.type}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                   {activeToolId === tool.id ? (
                     <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-[10px] font-bold uppercase tracking-tight border border-emerald-500/20 shadow-sm animate-in fade-in zoom-in duration-300">
                       <CheckCircle2 className="w-3 h-3" />
                       Active
                     </div>
                   ) : (
                     <button 
                       onClick={() => setActiveTool(tool.id)}
                       className="px-2 py-1 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:bg-[var(--accent-primary)] hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-tight border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all cursor-pointer"
                     >
                       Set Active
                     </button>
                   )}
                </div>
              </div>

              {/* Stats Footer */}
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[var(--border-color)]/50">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-tighter">Usage Time</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] font-bold">
                      {(tool.usageTimeSec / 3600).toFixed(1)} hrs
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                  <div>
                    <div className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-tighter">Cut Distance</div>
                    <div className="text-[11px] font-mono text-[var(--text-secondary)] font-bold">
                      {(tool.usageDistanceMm / 1000).toFixed(1)} m
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Overlay */}
              <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Edit Bit" position="top">
                  <button 
                    onClick={() => handleEdit(tool)}
                    className="p-1.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] rounded-lg transition-colors border border-[var(--border-color)]"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete from Library" position="top">
                  <button 
                    ref={el => { deleteRefs.current[tool.id] = el; }}
                    onClick={() => {
                      setPopover({
                          isOpen: true,
                          type: 'confirm',
                          title: "Delete Tool",
                          message: `Are you sure you want to delete "${tool.name}" from your library?`,
                          kind: 'error',
                          okLabel: "Delete",
                          onConfirm: () => deleteTool(tool.id),
                          triggerRef: { current: deleteRefs.current[tool.id] }
                      });
                    }}
                    className="p-1.5 bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-red-400 rounded-lg transition-colors border border-[var(--border-color)]"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          ))}

          {filteredTools.length === 0 && (
            <div className="text-center py-12 px-6">
              <Wrench className="w-12 h-12 text-[var(--text-tertiary)] opacity-20 mx-auto mb-4" />
              <p className="text-sm font-bold text-[var(--text-secondary)] uppercase">No bits found</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-2 italic leading-relaxed">
                Your tool catalog is empty or matches no search results. Add your first CNC bit to get started.
              </p>
            </div>
          )}
        </div>

        {/* ── Reference & Identification Links ─────────────────────── */}
        <ReferenceLinks />

        {/* Persistence Notice */}
        <div className="p-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-[9px] text-[var(--text-tertiary)] italic">
            <History className="w-3 h-3" />
            Changes persist across sessions
          </div>
          <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
            Gtaurus Tools
          </div>
        </div>

        {popover?.isOpen && (
          popover.type === 'confirm' ? (
            <ConfirmPopover
              isOpen={popover.isOpen}
              onClose={() => setPopover(null)}
              onConfirm={popover.onConfirm || (() => {})}
              title={popover.title}
              message={popover.message}
              kind={popover.kind}
              okLabel={popover.okLabel}
              triggerRef={popover.triggerRef}
              position="left"
            />
          ) : (
            <AlertPopover
              isOpen={popover.isOpen}
              onClose={() => setPopover(null)}
              title={popover.title}
              message={popover.message}
              kind={popover.kind}
              triggerRef={popover.triggerRef}
              position="bottom"
            />
          )
        )}
      </div>
    </div>
  );
}

// ─── Reference Links ──────────────────────────────────────────────────────────

const REFERENCE_LINKS = [
  {
    category: 'Visual Identification Guides',
    links: [
      { label: 'CNC Cookbook — Router Bit Guide', url: 'https://www.cnccookbook.com/cnc-router-bits/', desc: 'Photos of bit types with purposes and chip-clearance diagrams.' },
      { label: 'Popular Woodworking — CNC Bit Anatomy', url: 'https://www.popularwoodworking.com/', desc: 'Visual comparison of spiral, straight, and profile bits.' },
      { label: 'Amana Tool — Bit Search', url: 'https://www.amanatool.com/nsearch?q=bits', desc: 'Industry-standard profile drawings for matching physical bits.' },
      { label: 'Whiteside Router Bits', url: 'https://www.whitesiderouterbits.com/', desc: 'Comprehensive catalog with detailed specifications.' },
      { label: 'IDC Woodcraft', url: 'https://idcwoodcraft.com', desc: 'CNC bit identification and sourcing for hobbyists and professionals.' },
    ]
  },
  {
    category: 'Digital Twin & CAM Integration',
    links: [
      { label: 'Fusion Cloud Tool Library', url: 'https://cam.autodesk.com/hsmposts', desc: 'Free manufacturer libraries (.json / .hsmlib) for 3D bit preview.' },
      { label: 'SpeTool — Fusion Library', url: 'https://www.spetools.com/', desc: 'Downloadable tool definitions for Fusion.' },
      { label: 'Genmitsu / SainSmart Tools', url: 'https://www.sainsmart.com/collections/genmitsu-cnc', desc: 'Hobbyist-grade bits with matching digital libraries.' },
      { label: 'Bantam Tools', url: 'https://bantamtools.com/collections/end-mills-and-bits', desc: 'Free visual tool library with .json export.' },
    ]
  },
  {
    category: 'Fusion Integration',
    links: [
      { label: 'Fusion API — Tool Libraries', url: 'https://help.autodesk.com/view/fusion360/ENU/?guid=GUID-A92A4B10-3781-4925-94C6-47DA85A4F65A', desc: 'Official docs for the CAMManager.toolLibraries Python API.' },
      { label: 'Local Library Path', url: '#', desc: 'Windows: %AppData%/Autodesk/CAM360/libraries/Local — macOS: ~/Library/Application Support/Autodesk/CAM360/libraries/Local' },
      { label: 'Gtaurus Export Script', url: 'https://github.com/moffatted/gtaurus/blob/main/scripts/fusion360_export_library.py', desc: 'Python script to run inside Fusion that exports your library for Gtaurus.' },
    ]
  },
];

function ReferenceLinks() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mx-4 mb-4 border border-[var(--border-color)] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 cursor-pointer transition-colors duration-150"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--accent-primary)]" />
          <span className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Reference & Identification</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${expanded ? 'rotate-0' : '-rotate-90'}`} />
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? '600px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 py-3 bg-[var(--bg-secondary)] space-y-4">
          {REFERENCE_LINKS.map(cat => (
            <div key={cat.category}>
              <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest mb-2">{cat.category}</div>
              <div className="space-y-1.5">
                {cat.links.map(link => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2.5 p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors duration-150"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[var(--accent-primary)] mt-0.5 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors leading-snug">{link.label}</div>
                      <div className="text-[10px] text-[var(--text-tertiary)] leading-relaxed mt-0.5">{link.desc}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fusion Tool Parser ──────────────────────────────────────────────────────
// Supports both Fusion's hyphenated JSON keys (e.g. "body-length", "number-of-flutes")
// and camelCase / snake_case variants from third-party exporters.

type BitInput = Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>;

function parseFusionTool(item: any): BitInput | null {
  // Fusion nests geometry under "geometry" and post-processor data under "post-process"
  const geom = item.geometry || item;
  const post = item['post-process'] || item.post_process || item;

  // Diameter — try every known field name
  const diameter =
    geom.diameter ?? geom.dc ?? geom['diameter'] ??
    item.diameter ?? null;
  if (diameter === null || diameter === undefined) return null;

  // ── Type mapping ────────────────────────────────────────────────────────
  const fusionType = (item.type || item.tool_type || item['type'] || '').toLowerCase();
  let type: ToolType = 'other';
  if (fusionType.includes('flat end') || fusionType.includes('endmill') || fusionType === 'mill') type = 'endmill';
  else if (fusionType.includes('chamfer') || fusionType.includes('v-bit') || fusionType.includes('engrav') || fusionType.includes('dovetail')) type = 'v-bit';
  else if (fusionType.includes('ball')) type = 'ballnose';
  else if (fusionType.includes('face') || fusionType.includes('surfac') || fusionType.includes('fly')) type = 'surfacing';

  // ── Geometry extraction (hyphenated Fusion keys + fallbacks) ────────────
  const fluteCount =
    geom['number-of-flutes'] ?? geom.number_of_flutes ?? geom.flute_count ??
    geom.fluteCount ?? item.fluteCount ?? 2;

  const fluteLength =
    geom['body-length'] ?? geom['flute-length'] ?? geom.body_length ??
    geom.flute_length ?? geom.fluteLength ?? undefined;

  const overallLength =
    geom['overall-length'] ?? geom.overall_length ?? geom.overallLength ??
    geom['shoulder-length'] ?? geom.shoulder_length ?? undefined;

  const angle =
    geom['tip-angle'] ?? geom['taper-angle'] ?? geom['included-angle'] ??
    geom.tip_angle ?? geom.included_angle ?? geom.angle ?? undefined;

  // ── Post-process fields ─────────────────────────────────────────────────
  const toolNumber = post.number ?? post['number'] ?? post.tool_number ?? 1;

  // ── Material ────────────────────────────────────────────────────────────
  const material =
    item.BMC ?? item.bmc ?? item.material ??
    item['tool-material'] ?? item.tool_material ?? 'Carbide';

  return {
    name: item.description || item.name || item['product-id'] || item.product_id || `Imported ${type}`,
    type,
    diameter: typeof diameter === 'number' ? diameter : parseFloat(diameter),
    number: typeof toolNumber === 'number' ? toolNumber : parseInt(toolNumber) || 1,
    fluteCount: typeof fluteCount === 'number' ? fluteCount : parseInt(fluteCount) || 2,
    fluteLength: fluteLength !== undefined ? (typeof fluteLength === 'number' ? fluteLength : parseFloat(fluteLength)) : undefined,
    overallLength: overallLength !== undefined ? (typeof overallLength === 'number' ? overallLength : parseFloat(overallLength)) : undefined,
    angle: angle !== undefined ? (typeof angle === 'number' ? angle : parseFloat(angle)) : undefined,
    material: typeof material === 'string' ? material : 'Carbide',
    notes: item.comment || item.notes || '',
  };
}
