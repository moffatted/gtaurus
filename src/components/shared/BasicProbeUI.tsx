/**
 * @file BasicProbeUI.tsx
 * @purpose Shared UI component for executing Z-axis and corner probing routines.
 */
import { useState } from 'react';
import { Crosshair, HelpCircle, AlertCircle } from 'lucide-react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { transport } from '../../services/transportService';
import { ProbeService, ProbeCorner } from '../../services/ProbeService';
import { Tooltip } from '../ui/Tooltip';

type ProbeMethod = 'z-only' | '3-axis';
interface BasicProbeUIProps {
  onComplete?: () => void;
}

export function BasicProbeUI({ onComplete }: BasicProbeUIProps) {
  const { settings, setProbeSettings } = useSettingsStore();
  const { machine } = useMachineStatusStore();
  const prb = settings.probe;
  const safeHeight = settings.general.safeHeight || 10;
  
  const [method, setMethod] = useState<ProbeMethod>('z-only');
  const [corner, setCorner] = useState<ProbeCorner>('front-left');
  const [isProbing, setIsProbing] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  const canProbe = machine.status === 'Idle';
  const isAlarm = machine.status === 'Alarm';

  const handleProbe = async () => {
    if (!canProbe || isProbing) return;
    
    setIsProbing(true);
    setProgress('Initializing...');
    
    try {
      const result = method === 'z-only' 
        ? ProbeService.generateZProbe(prb)
        : ProbeService.generateCornerProbe(prb, corner, safeHeight);

      for (const cmd of result.gcode) {
        setProgress(`${cmd}`);
        console.log(`[BasicProbeUI] Sending: ${cmd}`);
        await transport.invoke('send_gcode', { cmd });
      }
      setProgress('Probe Complete!');
      onComplete?.();
      setTimeout(() => setProgress(null), 3000);
    } catch (err) {
      console.error("[BasicProbeUI] Probe failed:", err);
      setProgress('Error: See Logs');
    } finally {
      setIsProbing(false);
    }
  };

  const handleUnlock = () => {
    transport.invoke('send_gcode', { cmd: '$X' });
  };  const CornerDot = ({ pos, active }: { pos: ProbeCorner; active: boolean }) => {
    const label = pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + " Corner";
    
    return (
      <div 
        className="absolute"
        style={{
          top: pos.startsWith('back') ? '-6px' : 'auto',
          bottom: pos.startsWith('front') ? '-6px' : 'auto',
          left: pos.endsWith('left') ? '-6px' : 'auto',
          right: pos.endsWith('right') ? '-6px' : 'auto',
        }}
      >
        <Tooltip 
          content={label} 
          delay={0}
          position={pos.startsWith('back') ? 'top' : 'bottom'}
        >
          <button
            onClick={() => setCorner(pos)}
            className={`relative w-3.5 h-3.5 rounded-full border-2 transition-all z-20 ${
              active
                ? 'bg-[var(--accent-primary)] border-white scale-125 shadow-[0_0_12px_rgba(var(--accent-rgb),0.8)]'
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)]'
            }`}
          />
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Method Toggle - Compacted */}
      <div className="flex p-1 bg-[var(--bg-tertiary)] rounded-lg">
        <button
          onClick={() => setMethod('z-only')}
          className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
            method === 'z-only' 
              ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Touch Plate
        </button>
        <button
          onClick={() => setMethod('3-axis')}
          className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
            method === '3-axis' 
              ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          3-Axis Corner
        </button>
      </div>

      <div className="flex items-center gap-3 bg-[var(--bg-tertiary)]/30 p-2 rounded-xl border border-[var(--border-color)]">
        {/* Visual for 3-Axis or Z-Only */}
        <div className="relative flex justify-center p-1 shrink-0 bg-[var(--bg-secondary)]/50 rounded-lg border border-[var(--border-color)]/20 shadow-inner">
          <img 
            src={method === 'z-only' ? "/probe_z.png" : "/probe_corner.png"} 
            alt="Probe Visual" 
            className="w-16 h-16 object-contain mix-blend-screen opacity-90 brightness-110 transition-all duration-300"
          />
          {method === '3-axis' && (
            <div className="absolute inset-1">
               <CornerDot pos="back-left" active={corner === 'back-left'} />
               <CornerDot pos="back-right" active={corner === 'back-right'} />
               <CornerDot pos="front-left" active={corner === 'front-left'} />
               <CornerDot pos="front-right" active={corner === 'front-right'} />
            </div>
          )}
        </div>

        {/* Input Controls - Slimmed */}
        <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1.5">
          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight mb-0.5">Max Travel</label>
            <div className="relative">
              <input 
                type="number"
                value={prb.maxTravel}
                onChange={(e) => setProbeSettings({ maxTravel: Number(e.target.value) })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] font-mono pointer-events-none">mm</span>
            </div>
          </div>
        
          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight mb-0.5">Plate Thick</label>
            <div className="relative">
              <input 
                type="number"
                value={prb.zOffset}
                onChange={(e) => setProbeSettings({ zOffset: Number(e.target.value) })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] font-mono pointer-events-none">mm</span>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight mb-0.5">Fast Feed</label>
            <input 
              type="number"
              value={prb.fastFeedrate}
              onChange={(e) => setProbeSettings({ fastFeedrate: Number(e.target.value) })}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>
          
          <div className="flex flex-col">
            <label className="text-[8px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight mb-0.5">Slow Feed</label>
            <input 
              type="number"
              value={prb.slowFeedrate}
              onChange={(e) => setProbeSettings({ slowFeedrate: Number(e.target.value) })}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
            />
          </div>

          {method === '3-axis' && (
            <>
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-[var(--accent-primary)] uppercase tracking-tight mb-0.5">X Wall Thick</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={prb.xWallThickness ?? ''}
                    onChange={(e) => setProbeSettings({ xWallThickness: e.target.value as any })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] font-mono pointer-events-none">mm</span>
                </div>
              </div>
              
              <div className="flex flex-col">
                <label className="text-[8px] font-bold text-[var(--accent-primary)] uppercase tracking-tight mb-0.5">Y Wall Thick</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={prb.yWallThickness ?? ''}
                    onChange={(e) => setProbeSettings({ yWallThickness: e.target.value as any })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] font-mono pointer-events-none">mm</span>
                </div>
              </div>
              
              <div className="flex flex-col col-span-2">
                <label className="text-[8px] font-bold text-[var(--accent-primary)] uppercase tracking-tight mb-0.5">Hole Diameter</label>
                <div className="relative">
                  <input 
                    type="number"
                    value={prb.holeDiameter ?? ''}
                    onChange={(e) => setProbeSettings({ holeDiameter: e.target.value as any })}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-1.5 py-0.5 text-[11px] font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                  <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] text-[var(--text-tertiary)] font-mono pointer-events-none">mm</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions - Tighter */}
      <div className="bg-[var(--bg-tertiary)]/20 p-2 rounded-lg border border-[var(--border-color)]/30">
        <div className="flex gap-2 items-start">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0 mt-0.5" />
          <p className="text-[10px] text-[var(--text-tertiary)] leading-tight italic">
            {method === 'z-only' 
              ? "Position bit directly above touch plate before starting."
              : "Position bit inside hole or over marked center point."}
          </p>
        </div>
      </div>

      {/* Status / Error - Integrated */}
      {isAlarm && (
        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
          <button 
            onClick={handleUnlock}
            className="w-full py-1.5 bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            UNLOCK MACHINE ($X)
          </button>
        </div>
      )}

      {progress && (
        <div className="bg-[var(--bg-secondary)] p-1.5 rounded border border-[var(--accent-primary)]/30">
          <div className="text-[9px] font-mono text-[var(--accent-primary)] uppercase font-bold truncate">
            {progress}
          </div>
        </div>
      )}

      {/* Action Button - Compacted */}
      <button
        disabled={!canProbe || isProbing}
        onClick={handleProbe}
        className={`w-full py-3 rounded-xl font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
          isProbing 
            ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)]' 
            : 'bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-[0_4px_12px_rgba(var(--accent-rgb),0.2)]'
        }`}
      >
        <Crosshair className={`w-4 h-4 ${isProbing ? 'animate-spin' : ''}`} />
        <span className="text-xs uppercase font-black">{isProbing ? 'PROBING...' : 'START PROBE'}</span>
      </button>

      <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity px-1">
        <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-tighter">Bit: {prb.stylusDiameter}mm</span>
        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">F{prb.fastFeedrate}/{prb.slowFeedrate}</span>
      </div>
    </div>
  );
}
