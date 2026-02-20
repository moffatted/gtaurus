import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Settings, Play, ShieldAlert, Crosshair, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStore } from '../stores/machineStore';

export function AutoLevelPanel() {
  const [minX, setMinX] = useState(0.0);
  const [minY, setMinY] = useState(0.0);
  const [maxX, setMaxX] = useState(100.0);
  const [maxY, setMaxY] = useState(100.0);
  const [spacing, setSpacing] = useState(10.0);
  const [isProbing, setIsProbing] = useState(false);
  const [probeStatus, setProbeStatus] = useState<string>("Ready");

  const { settings, setShowAutolevelMesh } = useSettingsStore();
  const { hasHomed, hasZeroed } = useMachineStore();

  const expectedCols = Math.ceil((maxX - minX) / spacing) + 1;
  const expectedRows = Math.ceil((maxY - minY) / spacing) + 1;
  const totalPoints = expectedCols * expectedRows;

  const handleStartProbing = async () => {
    setIsProbing(true);
    setProbeStatus("Initializing Probing Sequence...");
    try {
      const resp = await invoke<string>("start_probing", {
        minX,
        minY,
        maxX,
        maxY,
        spacing
      });
      setProbeStatus(resp);
    } catch (e: any) {
      setProbeStatus(`Error: ${e}`);
    } finally {
      // We don't turn off isProbing until the state machine finishes, 
      // but for this UI scaffold we toggle it here.
      setIsProbing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#1A1A1A]">
      <div className="flex items-center gap-2 p-3 border-b border-[#333]">
        <Crosshair size={18} className="text-[#00E5FF]" />
        <h2 className="font-semibold text-white tracking-wide">Auto-Leveling</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-6">
        
        {/* Grid Setup */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#333]/50">
            <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
              <Settings size={14} className="text-gray-400" />
              Grid Configuration
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Min X (mm)</label>
              <input
                type="number"
                value={minX}
                onChange={(e) => setMinX(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#252525] border border-[#333] rounded px-3 py-1.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Min Y (mm)</label>
              <input
                type="number"
                value={minY}
                onChange={(e) => setMinY(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#252525] border border-[#333] rounded px-3 py-1.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Max X (mm)</label>
              <input
                type="number"
                value={maxX}
                onChange={(e) => setMaxX(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#252525] border border-[#333] rounded px-3 py-1.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400 ml-1">Max Y (mm)</label>
              <input
                type="number"
                value={maxY}
                onChange={(e) => setMaxY(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#252525] border border-[#333] rounded px-3 py-1.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs text-gray-400 ml-1">Grid Spacing (mm)</label>
              <input
                type="number"
                value={spacing}
                onChange={(e) => setSpacing(parseFloat(e.target.value) || 10)}
                className="w-full bg-[#252525] border border-[#333] rounded px-3 py-1.5 text-sm outline-none focus:border-[#00E5FF] transition-colors"
              />
            </div>
          </div>
        </div>

         {/* Stats & Actions */}
        <div className="space-y-3 bg-[#222] p-4 rounded-lg border border-[#333]">
           <div className="flex justify-between items-center text-sm">
             <span className="text-gray-400">Total Probe Points:</span>
             <span className="text-[#00E5FF] font-mono">{totalPoints}</span>
           </div>

           <div className="flex justify-between items-center text-sm pt-2 border-t border-[#333]/50">
             <span className="text-gray-400">Show Mesh in Visualizer:</span>
             <button 
                onClick={() => setShowAutolevelMesh(!settings.showAutolevelMesh)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
                  settings.showAutolevelMesh ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-[#333] text-gray-400 hover:bg-[#444]'
                }`}
             >
                {settings.showAutolevelMesh ? <Eye size={14} /> : <EyeOff size={14} />}
                {settings.showAutolevelMesh ? 'Visible' : 'Hidden'}
             </button>
           </div>
           
           <button
            onClick={handleStartProbing}
            disabled={isProbing || !hasHomed || !hasZeroed}
            className={`w-full flex items-center justify-center gap-2 py-2 rounded font-medium transition-all ${
              (isProbing || !hasHomed || !hasZeroed)
                ? 'bg-[#333] text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.3)] hover:shadow-[0_0_20px_rgba(5,150,105,0.5)]'
            }`}
          >
            <Play size={16} />
            {isProbing ? 'Probing...' : 'Start Probing Routine'}
          </button>
        </div>

        {/* Prerequisites Warning */}
        {(!hasHomed || !hasZeroed) && (
          <div className="flex flex-col gap-2 p-3 bg-red-900/10 border border-red-900/30 rounded text-xs text-red-400">
             <div className="flex items-center gap-2 font-bold uppercase tracking-wider">
                <AlertCircle size={14} />
                Prerequisites Not Met
             </div>
             <p className="text-red-400/80">You must complete the following before auto-leveling:</p>
             <ul className="list-disc list-inside ml-1 text-red-500/70">
                {!hasHomed && <li>Home the machine ($H)</li>}
                {!hasZeroed && <li>Set a Zero Reference (e.g. Probe Z or Zero XYZ)</li>}
             </ul>
          </div>
        )}

        {/* Status Window */}
        <div className="space-y-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">Status</h3>
            <div className="w-full h-24 bg-[#111] border border-[#222] rounded overflow-y-auto p-2 font-mono text-xs text-gray-400">
               {probeStatus}
            </div>
        </div>
        
        {/* Warning */}
        <div className="flex items-start gap-3 p-3 bg-amber-900/10 border border-amber-900/30 rounded text-xs text-amber-500/80">
          <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p>Ensure your Endmill, Probe, and Alligator clip are properly grounded and tested before initiating the routine.</p>
        </div>

      </div>
    </div>
  );
}
