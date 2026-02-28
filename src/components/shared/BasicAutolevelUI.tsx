/**
 * @file BasicAutolevelUI.tsx
 * @purpose Shared UI component for configuring and executing auto-leveling mesh probes.
 */
import { useState, useEffect } from "react";
import { 
  Play, 
  AlertCircle, 
  Maximize, 
  Box, 
  RefreshCcw, 
  CheckCircle2, 
  XOctagon,
  Trash2,
  Zap
} from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { useMeshStore } from '../../stores/meshStore';
import { transport } from '../../services/transportService';

export function BasicAutolevelUI() {
  const { settings, setStockSettings } = useSettingsStore();
  const { machine } = useMachineStatusStore();
  const { bounds } = useGcodeStore();
  const { mapData, setMapData, isProbing, setIsProbing } = useMeshStore();

  const [minX, setMinX] = useState(0.0);
  const [minY, setMinY] = useState(0.0);
  const [maxX, setMaxX] = useState(100.0);
  const [maxY, setMaxY] = useState(100.0);
  const [spacing, setSpacing] = useState(10.0);
  const [applyToWorkpiece, setApplyToWorkpiece] = useState(true);
  const [status, setStatus] = useState<string>("Ready");

  const canProbe = (machine.status === 'Idle' || machine.status === 'Alarm');
  
  const expectedCols = Math.ceil((maxX - minX) / spacing) + 1;
  const expectedRows = Math.ceil((maxY - minY) / spacing) + 1;
  const totalPoints = expectedCols * expectedRows;
  const pointsProbed = mapData?.grid.filter(z => z !== 0).length || 0;
  const progressPercent = Math.min((pointsProbed / totalPoints) * 100, 100);

  // Sync with G-code Bounds
  const handleAutoBounds = () => {
    if (bounds) {
      setMinX(Math.floor(bounds.minX));
      setMinY(Math.floor(bounds.minY));
      setMaxX(Math.ceil(bounds.maxX));
      setMaxY(Math.ceil(bounds.maxY));
      setStatus("Bounds updated from G-code");
    } else {
      setStatus("No G-code loaded");
    }
  };

  // Sync with Workpiece
  const handleSyncWorkpiece = () => {
    const { stock } = settings;
    setMinX(stock.offsetX);
    setMinY(stock.offsetY);
    setMaxX(stock.offsetX + stock.width);
    setMaxY(stock.offsetY + stock.height);
    setStatus("Bounds synced with Workpiece");
  };

  const handleStartProbing = async () => {
    if (!canProbe) return;
    
    setIsProbing(true);
    setStatus("Initializing Sequence...");
    setMapData(null); // Clear previous mesh

    // Optionally apply to workpiece
    if (applyToWorkpiece) {
      setStockSettings({
        enabled: true,
        width: maxX - minX,
        height: maxY - minY,
        offsetX: minX,
        offsetY: minY,
      });
    }

    try {
      const resp = await transport.invoke<string>("start_probing", {
        minX,
        minY,
        maxX,
        maxY,
        spacing,
        safeZ: settings.general.safeHeight,
        maxDepth: -Math.abs(settings.probe.maxTravel), // Use max travel from settings
        feedrate: settings.probe.slowFeedrate // Use slow feedrate for probing
      });
      setStatus(resp);
    } catch (e: any) {
      setStatus(`Error: ${e}`);
      setIsProbing(false);
    }
  };

  // Listen for complete? The current backend doesn't emit a separate "done" event,
  // but we can infer it or we might need to add one.
  // For now, it stays in isProbing until pointsProbed === totalPoints or manual stop.
  useEffect(() => {
    if (isProbing && pointsProbed === totalPoints && totalPoints > 0) {
      setIsProbing(false);
      setStatus("Probing Complete!");
    }
  }, [pointsProbed, totalPoints, isProbing]);

  const handleAbort = async () => {
    // For now, we'll try to send a soft reset or just reset local state
    // Real abort needs backend support
    setIsProbing(false);
    setStatus("Probing Aborted Locally");
    await transport.invoke('send_realtime', { byte: 0x18 }); // Ctrl+X / Reset
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Bounds Configuration */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Target Area</label>
            <div className="flex gap-2">
              <button 
                onClick={handleAutoBounds}
                className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[10px] rounded transition-colors border border-[var(--border-color)]"
              >
                <Maximize size={12} />
                AUTO-BOUNDS
              </button>
              <button 
                onClick={handleSyncWorkpiece}
                className="flex items-center gap-1.5 px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-[10px] rounded transition-colors border border-[var(--border-color)]"
              >
                <Box size={12} />
                SYNC WORKPIECE
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Zap size={14} className="text-emerald-500 shrink-0" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Conductive Surface Required</span>
              <span className="text-[9px] text-emerald-400/80 leading-tight">Ensure your workpiece is copper-clad or metallic and probe clip is attached.</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--text-tertiary)] ml-1">MIN X</span>
            <input
              type="number"
              value={minX}
              onChange={(e) => setMinX(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--text-tertiary)] ml-1">MIN Y</span>
            <input
              type="number"
              value={minY}
              onChange={(e) => setMinY(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--text-tertiary)] ml-1">MAX X</span>
            <input
              type="number"
              value={maxX}
              onChange={(e) => setMaxX(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-[var(--text-tertiary)] ml-1">MAX Y</span>
            <input
              type="number"
              value={maxY}
              onChange={(e) => setMaxY(parseFloat(e.target.value) || 0)}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
          <div className="col-span-2 space-y-1">
             <div className="flex justify-between items-center">
                <span className="text-[9px] text-[var(--text-tertiary)] ml-1">GRID SPACING</span>
                <span className="text-[9px] font-bold text-[var(--accent-primary)]">{totalPoints} POINTS TOTAL</span>
             </div>
            <input
              type="number"
              value={spacing}
              onChange={(e) => setSpacing(Math.max(2, parseFloat(e.target.value) || 10))}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-3 py-1.5 text-sm font-mono focus:border-[var(--accent-primary)] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)]/30 rounded-lg border border-[var(--border-color)]">
        <input 
          type="checkbox" 
          id="apply-wp"
          checked={applyToWorkpiece}
          onChange={(e) => setApplyToWorkpiece(e.target.checked)}
          className="w-4 h-4 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--accent-primary)] focus:ring-[var(--accent-primary)]"
        />
        <label htmlFor="apply-wp" className="text-xs text-[var(--text-secondary)] cursor-pointer select-none font-medium">
          APPLY BOUNDS TO WORKPIECE VISUAL
        </label>
      </div>

      {/* Progress / Status */}
      {isProbing && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-end">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase tracking-wider block">Probing Machine...</span>
              <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{status}</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-primary)]">{Math.round(progressPercent)}%</span>
          </div>
          
          <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-color)]">
             <div 
               className="h-full bg-[var(--accent-primary)] shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] transition-all duration-500" 
               style={{ width: `${progressPercent}%` }}
             />
          </div>
        </div>
      )}

      {!isProbing && !canProbe && (
        <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="text-[11px] text-red-200/80 leading-relaxed font-medium">
            Machine must be <span className="text-red-400 font-bold underline">IDLE</span> and <span className="text-red-400 font-bold underline">ZEROED</span> before auto-leveling.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        {isProbing ? (
          <button
            onClick={handleAbort}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-600/20 hover:bg-red-600/30 text-red-500 border border-red-500/30 rounded-xl font-bold tracking-widest transition-all active:scale-95"
          >
            <XOctagon size={18} />
            ABORT
          </button>
        ) : (
          <button
            onClick={handleStartProbing}
            disabled={!canProbe}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
              canProbe 
                ? 'bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]' 
                : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
            }`}
          >
            <Play size={18} />
            START PROBING
          </button>
        )}
      </div>

      {/* Visualizer Link / Metadata */}
      <div className="flex flex-col gap-2">
         <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
               <RefreshCcw size={12} className="text-[var(--text-tertiary)]" />
               <span className="text-[10px] text-[var(--text-tertiary)] font-mono uppercase">Safe Height: {settings.general.safeHeight}mm</span>
            </div>
            {pointsProbed > 0 && (
               <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setMapData(null)}
                    className="flex items-center gap-1 text-red-500/60 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                    <span className="text-[9px] font-bold uppercase">Reset</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    <span className="text-[10px] text-emerald-500/80 font-bold uppercase">{pointsProbed} Recorded</span>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
