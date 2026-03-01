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
    <div className="flex flex-col bg-[var(--bg-primary)] h-full min-w-[320px] overflow-hidden">
      {/* 
          Main Scrollable Content 
          Removed 'flex-1' to prevent it from stretching and creating a gap before the footer.
          We wrap it in a container that allows the footer to 'tuck' up directly under the content.
      */}
      <div className="p-2.5 pb-0 space-y-3 overflow-y-auto">
        
        {/* 0. Visibility Toggle */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${stock.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--text-tertiary)]'}`} />
            <span className="text-xs font-bold text-[var(--text-primary)]">Workpiece Visibility</span>
          </div>
          <button
            onClick={() => setStockSettings({ enabled: !stock.enabled })}
            className={`relative inline-flex h-4.5 w-8 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              stock.enabled ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                stock.enabled ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* 1. Dimensions */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
            <Box className="w-3 h-3" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Dimensions</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className={labelCls}>Width (X)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.width || ''}
                  onChange={(e) => setStockSettings({ width: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
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
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
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
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Position Offset */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
            <MousePointer2 className="w-3 h-3" />
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
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">X</span>
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
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">Y</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-3 bg-[var(--bg-tertiary)]/50 p-1.5 rounded-xl border border-[var(--border-color)]">
              <div className="flex-1">
                <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-1">Zero Origin</label>
                <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase bg-[var(--accent-primary)]/10 px-1.5 py-0.5 rounded border border-[var(--accent-primary)]/20">
                  {stock.zeroPosition.replace('-', ' ')}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-16 bg-[var(--bg-tertiary)] p-1 rounded-lg border border-[var(--border-color)]/30 shrink-0">
                {(['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'] as const).map((pos, idx) => {
                  const isSelectable = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].includes(pos);
                  const isActive = stock.zeroPosition === pos;
                  if (!isSelectable) return <div key={idx} />;
                  return (
                    <button
                      key={pos}
                      onClick={() => setStockSettings({ zeroPosition: pos as any })}
                      className={`w-full aspect-square rounded-sm transition-all flex items-center justify-center ${
                        isActive 
                        ? 'bg-[var(--accent-primary)] text-white' 
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-color)]'
                      }`}
                    >
                      <div className={`w-0.5 h-0.5 rounded-full ${isActive ? 'bg-white' : 'bg-current opacity-30'}`} />
                    </button>
                  );
                })}
              </div>
          </div>
        </div>

        {/* 3. Appearance - Tightened significantly */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
            <Layers className="w-3 h-3" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Appearance</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-x-3 items-end">
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
                className={inputCls + " cursor-pointer !text-[10px] !py-0.5 h-7 uppercase font-bold tracking-tight"}
              >
                <option value="pine">Pine</option>
                <option value="mdf">MDF</option>
                <option value="aluminum">Aluminum</option>
                <option value="pvc">PVC</option>
                <option value="pcb">PCB</option>
              </select>
            </div>
            <div className="pb-1.5">
              <label className={labelCls}>Opacity ({Math.round(stock.opacity * 100)}%)</label>
              <div className="flex items-center h-5">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={stock.opacity}
                  onChange={(e) => setStockSettings({ opacity: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--accent-primary)] h-1 bg-[var(--bg-tertiary)] rounded-full appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 
            Footer Integrated as a simple row 
            This removes the separate 'footer' block that creates that large gap.
        */}
        <div className="py-2 border-t border-[var(--border-color)] flex items-center justify-between opacity-80">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-tight">Settings Synced</span>
          </div>
          <div className="flex items-center gap-1.5">
             <div className={`w-1 h-1 rounded-full ${stock.enabled ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
             <span className="text-[9px] text-[var(--text-secondary)] font-mono font-bold tracking-tighter">
               {stock.enabled ? 'VISIBLE' : 'HIDDEN'}
             </span>
          </div>
        </div>
      </div>

      {/* 
          This spacer div takes all the remaining height.
          Since the content ABOVE it is NOT flex-1, everything is pushed to the top,
          and the footer is right under the Appearance section.
      */}
      <div className="flex-1" />
    </div>
  );
}
