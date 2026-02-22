import { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Trash, 
  Edit, 
  History, 
  Activity, 
  CheckCircle2, 
  Info,
  Clock,
  Navigation,
  Box
} from 'lucide-react';
import { useToolStore, Bit, ToolType } from '../stores/toolStore';
import { Tooltip } from './ui/Tooltip';
import clsx from 'clsx';

const TYPE_ICONS: Record<ToolType, any> = {
  endmill: Wrench,
  'v-bit': Navigation,
  ballnose: Activity,
  surfacing: Box,
  other: Info
};

const TYPE_COLORS: Record<ToolType, string> = {
  endmill: 'text-blue-400',
  'v-bit': 'text-purple-400',
  ballnose: 'text-emerald-400',
  surfacing: 'text-amber-400',
  other: 'text-gray-400'
};

export function ToolLibraryPanel() {
  const { tools, activeToolId, addTool, updateTool, deleteTool, setActiveTool } = useToolStore();
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<Bit, 'id' | 'usageTimeSec' | 'usageDistanceMm' | 'lastMaintenanceDate'>>({
    name: '',
    type: 'endmill',
    diameter: 3.175,
    number: 1,
    fluteCount: 2,
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
      material: tool.material,
      notes: tool.notes
    });
    setEditingId(tool.id);
    setIsAdding(false);
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[var(--accent-primary)]" />
            <h2 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Tool Library</h2>
          </div>
          <button 
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Bit
          </button>
        </div>

        {/* Active Tool Badge */}
        {activeTool && (
          <div className="mb-4 p-3 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent-primary)]/20">
                {(() => {
                  const Icon = TYPE_ICONS[activeTool.type] || Wrench;
                  return <Icon className="w-6 h-6" />;
                })()}
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
                      ? "bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20" 
                      : "bg-[var(--bg-tertiary)] " + TYPE_COLORS[tool.type]
                  )}>
                    {(() => {
                      const Icon = TYPE_ICONS[tool.type] || Wrench;
                      return <Icon className="w-6 h-6" />;
                    })()}
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
                    onClick={() => {
                      if (confirm(`Delete "${tool.name}" from your library?`)) {
                        deleteTool(tool.id);
                      }
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
      </div>

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
    </div>
  );
}
