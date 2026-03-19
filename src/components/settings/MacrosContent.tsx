import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { Plus, Save, Edit, Trash, FileCode, Settings } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export default function MacrosContent() {
  const { settings, addMacro, updateMacro, deleteMacro } = useSettingsStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const subHeaderCls = 'text-xs font-bold text-[var(--accent-primary)] mb-3 uppercase tracking-wider';
  const labelCls = 'block text-[10px] font-bold text-[var(--text-tertiary)] uppercase mb-1.5';
  const inputCls = 'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]';

  const handleAdd = () => {
    if (!newName.trim() || !newContent.trim()) return;
    addMacro({ name: newName, content: newContent });
    setNewName('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    if (!newName.trim() || !newContent.trim()) return;
    updateMacro(id, { name: newName, content: newContent });
    setEditingId(null);
    setNewName('');
    setNewContent('');
  };

  const startEdit = (macro: any) => {
    setEditingId(macro.id);
    setNewName(macro.name);
    setNewContent(macro.content);
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h4 className={subHeaderCls} style={{ marginBottom: 0 }}>Stored Macros</h4>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-white text-[10px] font-bold rounded-md hover:opacity-90 transition-opacity cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Add New
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-xl space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <h5 className="text-[11px] font-bold text-[var(--text-primary)] uppercase">
            {isAdding ? 'Create New Macro' : 'Edit Macro'}
          </h5>
          <div>
            <label className={labelCls}>Macro Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Probe Z"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>G-code Content</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="G0 X10..."
              className={`${inputCls} min-h-[100px] font-mono text-xs`}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                if (isAdding) handleAdd();
                else if (editingId) handleUpdate(editingId);
              }}
              className="flex-1 py-2 bg-[var(--accent-primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isAdding ? 'Save Macro' : 'Update Macro'}
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-color)] text-xs font-bold rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {settings.macros.map((macro) => (
          <div
            key={macro.id}
            className={`group p-3 rounded-xl border transition-all ${
              editingId === macro.id
                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5 opacity-50'
                : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-[var(--accent-primary)]/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-white transition-colors">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-[var(--text-primary)]">{macro.name}</h5>
                  <p className="text-[10px] text-[var(--text-tertiary)] font-mono truncate max-w-[200px]">
                    {macro.content.split('\n')[0]}
                    {macro.content.includes('\n') ? '...' : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Tooltip content="Edit Macro" position="top">
                  <button
                    onClick={() => startEdit(macro)}
                    disabled={!!editingId}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] rounded-md transition-all disabled:opacity-30 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
                <Tooltip content="Delete Macro" position="top">
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete "${macro.name}"?`)) {
                        deleteMacro(macro.id);
                      }
                    }}
                    disabled={!!editingId}
                    className="p-1.5 text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all disabled:opacity-30 cursor-pointer"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        ))}

        {settings.macros.length === 0 && !isAdding && (
          <div className="text-center py-8 bg-[var(--bg-tertiary)]/30 rounded-2xl border border-dashed border-[var(--border-color)]">
            <Settings className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2 opacity-20" />
            <p className="text-xs text-[var(--text-tertiary)] italic">No macros saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}