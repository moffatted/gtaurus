/**
 * @file WorkpiecePanel.tsx
 * @purpose UI panel for configuring workpiece dimensions, position offsets, and material appearance.
 */
import { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { useVisualizerStore } from '../stores/visualizerStore';
import { Box, Layers, MousePointer2, Route, Target } from 'lucide-react';
import { HelpIconButton } from './Help/HelpIconButton';

export function WorkpiecePanel() {
  const { settings, setStockSettings } = useSettingsStore();
  const { stock } = settings;

  const [rawW, setRawW] = useState(String(stock.width ?? ''));
  const [rawL, setRawL] = useState(String(stock.height ?? ''));
  const [rawH, setRawH] = useState(String(stock.thickness ?? ''));

  useEffect(() => { setRawW(String(stock.width ?? '')); }, [stock.width]);
  useEffect(() => { setRawL(String(stock.height ?? '')); }, [stock.height]);
  useEffect(() => { setRawH(String(stock.thickness ?? '')); }, [stock.thickness]);

  const { analysis, setStockOrigin } = useVisualizerStore();

  const originMap = {
    'bottom-left': 'FrontLeft',
    'bottom-right': 'FrontRight',
    'top-left': 'BackLeft',
    'top-right': 'BackRight',
    'center': 'Center'
  } as const;

  const selectedOrigin = originMap[stock.zeroPosition];

  const labelCls = 'block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1';
  const inputCls =
    'w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
    'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
    'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all';

  // Helper to get formatted origin name
  const getOriginLabel = (origin: string) => {
    return origin.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="flex flex-col bg-[var(--bg-primary)] h-full min-w-0 overflow-hidden">
      <div className="p-2.5 pb-0 space-y-3 overflow-y-auto flex-1">
        <div className="flex justify-end">
          <HelpIconButton
            topicId="probing"
            tooltip="Workpiece Help"
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            iconClassName="w-3.5 h-3.5"
          />
        </div>
        
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
                  type="text"
                  inputMode="decimal"
                  value={rawW}
                  onChange={(e) => setRawW(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => {
                    const n = parseFloat(rawW);
                    if (!isNaN(n) && n >= 0) setStockSettings({ width: n });
                    else setRawW(String(stock.width ?? ''));
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className={inputCls + " !py-1 pr-8"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Length (Y)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rawL}
                  onChange={(e) => setRawL(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => {
                    const n = parseFloat(rawL);
                    if (!isNaN(n) && n >= 0) setStockSettings({ height: n });
                    else setRawL(String(stock.height ?? ''));
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className={inputCls + " !py-1 pr-8"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Height (Z)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rawH}
                  onChange={(e) => setRawH(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onBlur={() => {
                    const n = parseFloat(rawH);
                    if (!isNaN(n) && n >= 0) setStockSettings({ thickness: n });
                    else setRawH(String(stock.thickness ?? ''));
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  className={inputCls + " !py-1 pr-8"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">mm</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. WCS Zero Position */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
            <MousePointer2 className="w-3 h-3" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">WCS Zero Position</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Zero X</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.zeroX ?? ''}
                  onChange={(e) => setStockSettings({ zeroX: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">X</span>
              </div>
            </div>
            <div>
              <label className={labelCls}>Zero Y</label>
              <div className="relative">
                <input
                  type="number"
                  value={stock.zeroY ?? ''}
                  onChange={(e) => setStockSettings({ zeroY: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                  onFocus={(e) => e.target.select()}
                  className={inputCls + " !py-1"}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none font-mono">Y</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Toolpath Origin */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[var(--accent-primary)]">
              <Route className="w-3 h-3" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest">Toolpath Origin</h3>
            </div>
            {analysis && (
              <button
                onClick={() => setStockOrigin(selectedOrigin, stock.width, stock.height, setStockSettings)}
                className="text-[9px] px-1.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 rounded hover:bg-[var(--accent-primary)]/20 transition-colors font-bold uppercase flex items-center gap-1"
              >
                <Target className="w-2.5 h-2.5" />
                Fit Job to Zero
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between gap-3 bg-[var(--bg-tertiary)]/50 p-2 rounded-xl border border-[var(--border-color)]">
              <div className="flex-1 space-y-2">
                <div>
                  <label className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider block mb-0.5">Selected Zero</label>
                  <span className="text-[10px] font-mono font-bold text-[var(--accent-primary)] uppercase bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded border border-[var(--accent-primary)]/20">
                    {getOriginLabel(selectedOrigin)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      value={stock.workOffsetX ?? ''}
                      onChange={(e) => setStockSettings({ workOffsetX: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className={inputCls + " !py-0.5 !text-[10px]"}
                    />
                    <span className="absolute right-1 text-[8px] top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">JOB X</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={stock.workOffsetY ?? ''}
                      onChange={(e) => setStockSettings({ workOffsetY: e.target.value === '' ? 0 : parseFloat(e.target.value) })}
                      className={inputCls + " !py-0.5 !text-[10px]"}
                    />
                    <span className="absolute right-1 text-[8px] top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">JOB Y</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-1 w-20 bg-[var(--bg-tertiary)] p-1.5 rounded-lg border border-[var(--border-color)]/30 shrink-0">
                {(['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'] as const).map((pos) => {
                  const mappedOrigin = pos in originMap ? originMap[pos as keyof typeof originMap] : undefined;
                  const isClickable = !!mappedOrigin;
                  const isActive = isClickable && stock.zeroPosition === pos;

                  return (
                    <button
                      key={pos}
                      disabled={!isClickable}
                      onClick={() => {
                        if (mappedOrigin) {
                          setStockSettings({ zeroPosition: pos as any });
                        }
                      }}
                      className={`w-full aspect-square rounded-sm transition-all flex items-center justify-center ${
                        !isClickable ? 'opacity-10 cursor-default' :
                        isActive 
                        ? 'bg-[var(--accent-primary)] text-white ring-1 ring-[var(--accent-primary)] shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.4)]' 
                        : 'bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]/50'
                      }`}
                    >
                      <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-white' : 'bg-current opacity-30'}`} />
                    </button>
                  );
                })}
              </div>
          </div>
        </div>

        {/* 4. Appearance */}
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
                <option value="darkoak">Dark Oak</option>
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

        <div className="py-2 border-t border-[var(--border-color)] flex items-center justify-between opacity-80">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-tight">Settings Synced</span>
          </div>
          <div className="flex items-center gap-1.5">
             <div className={`w-1 h-1 rounded-full ${stock.enabled ? 'bg-green-500' : 'bg-red-500'}`} />
             <span className="text-[9px] text-[var(--text-secondary)] font-mono font-bold tracking-tighter">
               {stock.enabled ? 'VISIBLE' : 'HIDDEN'}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
}
