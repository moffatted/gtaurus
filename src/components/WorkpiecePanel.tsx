import { useSettingsStore } from '../stores/settingsStore';
import { Box, Layers, MousePointer2 } from 'lucide-react';

export function WorkpiecePanel() {
  const { settings, setStockSettings } = useSettingsStore();
  const { stock } = settings;

  const labelCls = 'block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5';
  const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
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
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <Box className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Dimensions</h3>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Width (X)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.width}
                  onChange={(e) => setStockSettings({ width: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                  min={1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Depth (Y)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.height}
                  onChange={(e) => setStockSettings({ height: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                  min={1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Thick (Z)</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.thickness}
                  onChange={(e) => setStockSettings({ thickness: parseFloat(e.target.value) || 0 })}
                  className={inputCls}
                  min={1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Position Offset */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <MousePointer2 className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Position Offset</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Offset X</label>
              <input
                type="number"
                value={stock.offsetX}
                onChange={(e) => setStockSettings({ offsetX: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Offset Y</label>
              <input
                type="number"
                value={stock.offsetY}
                onChange={(e) => setStockSettings({ offsetY: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] italic">
            Offsets represent the distance from Machine Origin (0,0) to the bottom-left of the stock.
          </p>
        </div>

        {/* 3. Appearance */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)] mb-1">
            <Layers className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-widest">Appearance</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                className={inputCls + " cursor-pointer uppercase text-[10px] font-bold tracking-widest"}
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
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={stock.opacity}
                onChange={(e) => setStockSettings({ opacity: parseFloat(e.target.value) })}
                className="w-full accent-[var(--accent-primary)] mt-1.5 h-1.5 bg-[var(--bg-tertiary)] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>
      
      {/* Footer Branding/Info */}
      <div className="px-4 py-3 border-t border-[var(--border-color)] bg-[var(--bg-secondary)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold tracking-tighter">Workpiece Controls</span>
        <div className="flex items-center gap-1.5">
           <div className={`w-1.5 h-1.5 rounded-full ${stock.enabled ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`} />
           <span className="text-[10px] text-[var(--text-secondary)] font-mono">{stock.enabled ? 'VISIBLE' : 'HIDDEN'}</span>
        </div>
      </div>
    </div>
  );
}
