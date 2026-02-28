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
        setProgress(`Executing: ${cmd}`);
        console.log(`[BasicProbeUI] Sending: ${cmd}`);
        await transport.invoke('send_gcode', { cmd });
      }
      setProgress('Probe Complete!');
      onComplete?.();
      setTimeout(() => setProgress(null), 3000);
    } catch (err) {
      console.error("[BasicProbeUI] Probe failed:", err);
      setProgress('Error: Check Console');
    } finally {
      setIsProbing(false);
    }
  };

  const handleUnlock = () => {
    transport.invoke('send_gcode', { cmd: '$X' });
  };

  const CornerDot = ({ pos, active }: { pos: ProbeCorner, active: boolean }) => (
    <button
      onClick={() => setCorner(pos)}
      className={`absolute w-4 h-4 rounded-full border-2 transition-all ${
        active 
          ? 'bg-[var(--accent-primary)] border-white scale-125 shadow-lg' 
          : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] hover:border-[var(--text-tertiary)]'
      }`}
      style={{
        top: pos.startsWith('back') ? '-8px' : 'auto',
        bottom: pos.startsWith('front') ? '-8px' : 'auto',
        left: pos.endsWith('left') ? '-8px' : 'auto',
        right: pos.endsWith('right') ? '-8px' : 'auto',
      }}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Probe Method Selection */}
      <div className="flex gap-2 p-1 bg-[var(--bg-tertiary)] rounded-lg">
        <button
          onClick={() => setMethod('z-only')}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
            method === 'z-only' 
              ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          Z-ONLY TOUCH PLATE
        </button>
        <button
          onClick={() => setMethod('3-axis')}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-bold transition-all ${
            method === '3-axis' 
              ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
          }`}
        >
          3-AXIS CORNER
        </button>
      </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Visual for 3-Axis or Z-Only */}
          <div className="flex justify-center p-4">
            {method === 'z-only' ? (
              <div className="relative w-24 h-24 border-b-4 border-[var(--text-tertiary)] flex items-center justify-center">
                <div className="w-16 h-4 bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-sm absolute bottom-0 shadow-inner" />
                <div className="w-2 h-16 bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-full transform translate-y-[-10px] animate-pulse-slow" />
              </div>
            ) : (
              <div className="relative w-24 h-24 bg-[var(--bg-tertiary)] border-2 border-[var(--border-color)] rounded-lg shadow-inner">
                 <div className="absolute inset-4 border border-[var(--border-color)] border-dashed rounded opacity-30" />
                 <CornerDot pos="back-left" active={corner === 'back-left'} />
                 <CornerDot pos="back-right" active={corner === 'back-right'} />
                 <CornerDot pos="front-left" active={corner === 'front-left'} />
                 <CornerDot pos="front-right" active={corner === 'front-right'} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Max Travel</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={prb.maxTravel}
                  onChange={(e) => setProbeSettings({ maxTravel: Number(e.target.value) })}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[var(--accent-primary)]"
                />
                <span className="text-xs text-[var(--text-tertiary)]">mm</span>
              </div>
            </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Plate Offset</label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={prb.zOffset}
                onChange={(e) => setProbeSettings({ zOffset: Number(e.target.value) })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="text-xs text-[var(--text-tertiary)]">mm</span>
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Search Feed</label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={prb.fastFeedrate}
                onChange={(e) => setProbeSettings({ fastFeedrate: Number(e.target.value) })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">F</span>
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Probe Feed</label>
            <div className="flex items-center gap-2">
              <input 
                type="number"
                value={prb.slowFeedrate}
                onChange={(e) => setProbeSettings({ slowFeedrate: Number(e.target.value) })}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded px-2 py-1 text-sm font-mono focus:outline-none focus:border-[var(--accent-primary)]"
              />
              <span className="text-[10px] text-[var(--text-tertiary)]">F</span>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-lg border border-[var(--border-color)] flex gap-3">
        <HelpCircle className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />
        <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
          {method === 'z-only' 
            ? "Place the touch plate flat on the workpiece. Position the bit directly above the plate before starting."
            : "Place the corner finder over the workpiece corner. Position the bit inside the hole/over the marked center."}
        </p>
      </div>

      {/* Status / Error */}
      {isAlarm ? (
        <div className="flex flex-col gap-2 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Machine is Locked (Alarm)</span>
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] text-left mb-1">
            An alarm was triggered (likely a limit switch or soft reset). You must unlock before probing.
          </p>
          <button 
            onClick={handleUnlock}
            className="w-full py-2 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-red-500/10"
          >
            UNLOCK MACHINE ($X)
          </button>
        </div>
      ) : !canProbe && (
        <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
          <AlertCircle className="w-4 h-4" />
          <span className="text-xs font-bold uppercase">Ready the machine (Status: {machine.status})</span>
        </div>
      )}

      {progress && (
        <div className="bg-[var(--bg-secondary)] p-2 rounded border border-[var(--accent-primary)]/30 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-[var(--accent-primary)] uppercase">Status</span>
            <div className="w-1.5 h-1.5 bg-[var(--accent-primary)] rounded-full animate-pulse" />
          </div>
          <div className="text-[10px] font-mono text-[var(--text-secondary)] truncate">
            {progress}
          </div>
        </div>
      )}

      {/* Action Button */}
      <button
        disabled={!canProbe || isProbing}
        onClick={handleProbe}
        className={`w-full py-4 rounded-xl font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:cursor-not-allowed ${
          isProbing 
            ? 'bg-[var(--bg-tertiary)] text-[var(--accent-primary)] cursor-wait' 
            : 'bg-[var(--accent-primary)] text-white hover:brightness-110 shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]'
        }`}
      >
        <Crosshair className={`w-5 h-5 ${isProbing ? 'animate-spin' : ''}`} />
        {isProbing ? 'PROBING...' : 'START PROBE'}
      </button>

      <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <span className="text-[10px] text-[var(--text-tertiary)]">Bit: {prb.stylusDiameter}mm</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Feed: F{prb.fastFeedrate} / F{prb.slowFeedrate}</span>
      </div>
    </div>
  );
}
