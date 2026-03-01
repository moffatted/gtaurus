/**
 * @file WorkpiecePanel.tsx
 * @purpose UI panel for configuring workpiece dimensions, position offsets, and material appearance.
 */
import { useSettingsStore } from '../stores/settingsStore';
import { Box, Layers, MousePointer2 } from 'lucide-react';

export function WorkpiecePanel() {
  const { settings, setStockSettings } = useSettingsStore();
  const { stock } = settings;

  const labelCls = 'block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1';
  const inputCls =
    'w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all';

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] overflow-x-auto min-w-[320px]">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 0. Visibility Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stock.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--text-tertiary)]'}`} />
            <span className="text-xs font-semibold text-[var(--text-primary)]">Workpiece Visibility</span>
          </div>
          <button
            onClick={() => setStockSettings({ enabled: !stock.enabled })}
            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              stock.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                stock.enabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 1. Dimensions */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] group">
            <Box className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Dimensions</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Width (X)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.width || ''}
                  onChange={(e) => setStockSettings({ width: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls}
                  min={0}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Depth (Y)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.height || ''}
                  onChange={(e) => setStockSettings({ height: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls}
                  min={0}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Thick (Z)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.thickness || ''}
                  onChange={(e) => setStockSettings({ thickness: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls}
                  min={0}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Position Offset */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] group">
            <MousePointer2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Position Offset</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Offset X</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.offsetX || ''}
                  onChange={(e) => setStockSettings({ offsetX: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Offset Y</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.offsetY || ''}
                  onChange={(e) => setStockSettings({ offsetY: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">mm</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-4 bg-[var(--bg-tertiary)]/50 p-2 rounded-xl border border-[var(--border-color)]">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Zero Origin</label>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--accent-primary)]/20">
                  {stock.zeroPosition.replace('-', ' ')}
                </span>
                <p className="text-[8px] text-[var(--text-tertiary)] mt-1.5 font-medium leading-tight">Workpiece Zero (0,0) position</p>
              </div>
              
              <div className="grid grid-cols-3 gap-1.5 w-24 bg-[var(--bg-tertiary)] p-1.5 rounded-lg border border-[var(--border-color)]/50 shrink-0">
                {(['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'] as const).map((pos, idx) => {
                  const isSelectable = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(pos);
                  const isActive = stock.zeroPosition === pos;
                  
                  if (!isSelectable) return <div key={idx} />;
                  
                  return (
                    <button
                      key={pos}
                      onClick={() => setStockSettings({ zeroPosition: pos as any })}
                      className={`w-full aspect-square rounded transition-all flex items-center justify-center ${
                        isActive 
                        ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-tertiary)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                      }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-current opacity-30'}`} />
                    </button>
                  );
                })}
              </div>
          </div>
        </div>

        {/* 3. Appearance */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)] group">
            <Layers className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Appearance</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Material</label>
              <select
                value={stock.material}
                onChange={(e) => {
                  const val = e.target.value as any;
                  if (val === 'pcb') {
                    setStockSettings({ material: val, thickness: 1.6 });
                  } else {
                    setStockSettings({ material: val });
                  }
                }}
                className={inputCls + " cursor-pointer !text-[9px] font-bold tracking-widest uppercase"}
              >
                <option value="pine">Pine Wood</option>
                <option value="mdf">MDF Board</option>
                <option value="aluminum">Aluminum</option>
                <option value="pvc">PVC / Plastic</option>
                <option value="pcb">PCB (Copper Clad)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Opacity ({Math.round(stock.opacity * 100)}%)</label>
              <div className="flex items-center h-8">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={stock.opacity}
                  onChange={(e) => setStockSettings({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] h-1 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {/* Footer Branding/Info */}
      <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-tighter">Settings Synced</span>
        </div>
        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${stock.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
           <span className="text-[10px] text-[var(--text-secondary)] font-mono">{stock.enabled ? 'VISIBLE' : 'HIDDEN'}</span>
        </div>
      </div>
    </div>
  );
}
