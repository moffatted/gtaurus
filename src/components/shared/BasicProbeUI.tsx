/**
 * @file BasicProbeUI.tsx
 * @purpose Shared UI component for executing Z-axis and corner probing routines.
 */
import { useEffect, useState } from 'react';
import { Crosshair, HelpCircle, AlertCircle, Zap, ZapOff } from 'lucide-react';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { transport } from '../../services/transportService';
import { ProbeService, ProbeCorner } from '../../services/ProbeService';
import { parseStatusReport } from '../../utils/parser';
import { Tooltip } from '../ui/Tooltip';

type ProbeMethod = 'z-only' | '3-axis';
type ContinuityStep = 'await-open' | 'await-close' | 'verified';

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
  const [awaitingCircuit, setAwaitingCircuit] = useState(false);
  const [continuityStep, setContinuityStep] = useState<ContinuityStep>('await-close');
  const [liveProbeCircuitClosed, setLiveProbeCircuitClosed] = useState<boolean | null>(null);

  const isAlarm = machine.status.startsWith('Alarm');
  const alarmCode = isAlarm ? machine.status : null; // e.g. 'Alarm:9'
  const canProbe = machine.status === 'Idle' && !isAlarm;
  const probeCircuitClosed = liveProbeCircuitClosed ?? (machine.pins?.includes('P') ?? false);
  const continuityVerified = continuityStep === 'verified' && probeCircuitClosed;

  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    transport.listen<string>('fluidnc://rx', (event: any) => {
      if (!mounted) return;
      const line = event?.payload;
      if (typeof line !== 'string') return;
      if (!line.startsWith('<') || !line.endsWith('>')) return;

      const report = parseStatusReport(line);
      if (report.pins !== undefined) {
        setLiveProbeCircuitClosed(report.pins.includes('P'));
      } else {
        setLiveProbeCircuitClosed(false);
      }
    }).then((unlisten) => {
      cleanup = unlisten;
    });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  useEffect(() => {
    if (!awaitingCircuit) return;

    // Drive explicit polling while continuity test is active, even if ControlsPanel isn't mounted.
    const poll = () => transport.invoke('send_realtime', { byte: 0x3F }).catch(() => {});
    poll();
    const interval = setInterval(poll, 200);
    return () => clearInterval(interval);
  }, [awaitingCircuit]);

  useEffect(() => {
    if (!awaitingCircuit) return;

    if (continuityStep === 'await-open' && !probeCircuitClosed) {
      setContinuityStep('await-close');
      return;
    }

    if (continuityStep === 'await-close' && probeCircuitClosed) {
      setContinuityStep('verified');
      return;
    }

    if (continuityStep === 'verified' && !probeCircuitClosed) {
      setContinuityStep('await-close');
    }
  }, [awaitingCircuit, continuityStep, probeCircuitClosed]);

  const startContinuityCheck = () => {
    if (!canProbe || isProbing) return;
    setProgress(null);
    setAwaitingCircuit(true);
    setContinuityStep(probeCircuitClosed ? 'await-open' : 'await-close');
    transport.invoke('send_realtime', { byte: 0x3F }).catch(() => {});
  };

  const resetContinuityCheck = () => {
    setAwaitingCircuit(false);
    setContinuityStep('await-close');
  };

  const handleProbe = async () => {
    if (!continuityVerified) return;
    resetContinuityCheck();
    runProbeSequence();
  };

  const runProbeSequence = async () => {
    if (!canProbe || isProbing) return;
    
    setIsProbing(true);
    setProgress('Initializing...');
    
    try {
      const result = method === 'z-only' 
        ? ProbeService.generateZProbe(prb)
        : ProbeService.generateCornerProbe(prb, corner, safeHeight);

      for (const cmd of result.gcode) {
        // Bail out immediately if machine entered alarm mid-cycle
        const liveStatus = useMachineStatusStore.getState().machine.status;
        if (liveStatus.startsWith('Alarm')) {
          console.warn(`[BasicProbeUI] Aborting probe — machine entered ${liveStatus} mid-sequence`);
          setProgress(`Aborted: ${liveStatus}`);
          setTimeout(() => setProgress(null), 5000);
          return;
        }
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
  };

  const CornerDot = ({ pos, active }: { pos: ProbeCorner; active: boolean }) => {
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
                    onChange={(e) => setProbeSettings({ xWallThickness: Number(e.target.value) })}
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
                    onChange={(e) => setProbeSettings({ yWallThickness: Number(e.target.value) })}
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
                    onChange={(e) => setProbeSettings({ holeDiameter: Number(e.target.value) })}
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

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[var(--accent-primary)] shrink-0" />
          <span className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wide">Required Continuity Check</span>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] leading-snug">
          {awaitingCircuit
            ? continuityStep === 'await-open'
              ? 'The probe circuit is already closed. Lift the bit off the plate until it opens, then touch it again to verify a real open-to-closed transition.'
              : 'Touch the bit to the touch plate now. Probe motion stays locked out until continuity is verified.'
            : 'Before probing, click Verify Continuity and touch the bit to the plate. Probe motion is disabled until this passes.'}
        </p>
        <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-[10px] font-bold transition-all ${
          continuityVerified
            ? 'bg-green-500/15 border-green-500/40 text-green-400'
            : probeCircuitClosed
              ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
              : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-tertiary)]'
        }`}>
          {continuityVerified
            ? <Zap className="w-3.5 h-3.5 shrink-0 animate-pulse" />
            : probeCircuitClosed
              ? <Zap className="w-3.5 h-3.5 shrink-0" />
              : <ZapOff className="w-3.5 h-3.5 shrink-0" />}
          <span>
            {continuityVerified
              ? 'Continuity VERIFIED ✓ — Probe motion enabled'
              : awaitingCircuit
                ? continuityStep === 'await-open'
                  ? 'Circuit CLOSED — Lift off plate until OPEN'
                  : probeCircuitClosed
                    ? 'Circuit CLOSED — Verification captured'
                    : 'Circuit OPEN — Waiting for contact...'
                : probeCircuitClosed
                  ? 'Circuit currently CLOSED — Start verification to confirm transition'
                  : 'Circuit OPEN — Verification not started'}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            disabled={!canProbe || isProbing}
            onClick={awaitingCircuit ? resetContinuityCheck : startContinuityCheck}
            className="flex-1 py-1.5 rounded-lg border border-[var(--border-color)] text-[10px] font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {awaitingCircuit ? 'Reset Check' : 'Verify Continuity'}
          </button>
          <button
            disabled={!continuityVerified || !canProbe || isProbing}
            onClick={handleProbe}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[var(--accent-primary)] text-white hover:brightness-110 disabled:hover:brightness-100"
          >
            {continuityVerified ? 'Start Probe' : 'Start Probe Locked'}
          </button>
        </div>
      </div>

      {isAlarm && (
        <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{alarmCode ?? 'Alarm'} — Machine locked</span>
          </div>
          <button 
            onClick={handleUnlock}
            className="w-full py-1.5 bg-red-500 hover:bg-red-400 text-white text-[10px] font-bold rounded flex items-center justify-center gap-2 transition-colors"
          >
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

      <button
        disabled
        className="w-full py-3 rounded-xl font-bold tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 opacity-40 cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
      >
        <Crosshair className="w-4 h-4" />
        <span className="text-xs uppercase font-black">Use Required Continuity Check Above</span>
      </button>

      <div className="flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity px-1">
        <span className="text-[9px] text-[var(--text-tertiary)] font-bold uppercase tracking-tighter">Bit: {prb.stylusDiameter}mm</span>
        <span className="text-[9px] text-[var(--text-tertiary)] font-mono">F{prb.fastFeedrate}/{prb.slowFeedrate}</span>
      </div>
    </div>
  );
}
