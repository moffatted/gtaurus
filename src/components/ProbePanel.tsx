import { useState } from 'react';
import { Crosshair } from 'lucide-react';
import { useSettingsStore } from '../stores/settingsStore';
import { transport } from '../services/transportService';

type ProbeAxis = 'Z' | 'XYZ' | 'XY' | 'X' | 'Y';

export function ProbePanel() {
  const { settings } = useSettingsStore();
  const prb = settings.probe;
  const [probeDistance, setProbeDistance] = useState<number>(10);
  const [isProbing, setIsProbing] = useState(false);
  const [selectedAxis, setSelectedAxis] = useState<ProbeAxis>('Z');

  const distances = [1, 5, 10, 50];
  const axes: ProbeAxis[] = ['Z', 'XYZ', 'XY', 'X', 'Y'];

  const handleProbe = async () => {
    if (isProbing) return;
    setIsProbing(true);
    
    try {
      const feed = prb.fastFeedrate || 100;
      let cmd = `G91 G38.2 F${feed} `;
      
      // Default to probing in the negative direction for simplicity, 
      // or this could trigger specific macros per axis choice.
      if (selectedAxis === 'Z') {
         cmd += `Z-${probeDistance.toFixed(3)}`;
      } else if (selectedAxis === 'X') {
         cmd += `X-${probeDistance.toFixed(3)}`;
      } else if (selectedAxis === 'Y') {
         cmd += `Y-${probeDistance.toFixed(3)}`;
      } else if (selectedAxis === 'XY') {
         cmd += `X-${probeDistance.toFixed(3)} Y-${probeDistance.toFixed(3)}`;
      } else if (selectedAxis === 'XYZ') {
         cmd += `X-${probeDistance.toFixed(3)} Y-${probeDistance.toFixed(3)} Z-${probeDistance.toFixed(3)}`;
      }

      console.log(`[ProbePanel] Emitting probe macro for ${selectedAxis}: ${cmd}`);
      await transport.invoke('send_gcode', { cmd });

      if (prb.wcoUpdate) {
         console.warn("WCO Auto-Update requested but full macro evaluation is not deployed yet.");
      }
      
    } catch (e) {
      console.error("[ProbePanel] Probe failed:", e);
    } finally {
      setIsProbing(false);
    }
  };

  const activeStepClass = "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)] shadow-md transform scale-105";
  const inactiveStepClass = "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] border-[var(--border-color)]";

  return (
    <div className="h-full flex flex-col p-4 gap-6 select-none overflow-y-auto min-w-[280px]">
      
      {/* Probe Settings Overview */}
      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex-shrink-0">
        <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-[var(--accent-primary)]" />
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-[var(--text-primary)]">Active Profile</span>
                <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-[150px]">{prb.probeType}</span>
            </div>
        </div>
        <div className="text-[10px] text-right text-[var(--text-tertiary)] font-mono">
            <div>F{prb.fastFeedrate}</div>
            <div>D{prb.stylusDiameter}mm</div>
        </div>
      </div>

      {/* Target Distance Selector */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
           <span>Max Travel (mm)</span>
           <span className="text-[var(--text-primary)]">{probeDistance} mm</span>
        </label>
        <div className="flex gap-2">
          {distances.map(size => (
            <button
              key={size}
              onClick={() => setProbeDistance(size)}
              className={`flex-1 py-1.5 px-2 rounded-md text-sm font-medium border transition-all ${
                probeDistance === size ? activeStepClass : inactiveStepClass
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Axis Selection */}
      <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
           Probe Operation
        </label>
        <div className="flex gap-2">
          {axes.map(axis => (
            <button
              key={axis}
              onClick={() => setSelectedAxis(axis)}
              className={`flex-1 py-2.5 px-1 rounded-md text-sm font-bold border transition-all ${
                selectedAxis === axis ? activeStepClass : inactiveStepClass
              }`}
            >
              {axis}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Probe Action */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[200px] mt-4 pb-4">
         <button 
           disabled={isProbing}
           onClick={handleProbe}
           className="w-48 h-48 rounded-full bg-[var(--bg-secondary)] border-4 border-[var(--border-color)] hover:border-[var(--accent-primary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--accent-primary)] active:border-[var(--accent-primary)] active:scale-95 transition-all duration-200 flex flex-col items-center justify-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 group"
         >
            <Crosshair className="w-12 h-12 text-[var(--accent-primary)] group-active:text-white mb-2 transition-colors" />
            <span className="text-xl font-bold tracking-widest text-[var(--text-primary)] group-active:text-white">PROBE</span>
            <span className="text-xs font-medium text-[var(--text-tertiary)] group-active:text-white/80 mt-1">{selectedAxis} Axis</span>
         </button>
      </div>

    </div>
  );
}
