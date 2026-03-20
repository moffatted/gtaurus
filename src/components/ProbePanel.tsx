/**
 * @file ProbePanel.tsx
 * @purpose UI panel for managing probing operations and calibration.
 */
import { useEffect, useRef, useState } from 'react';
import { X, Info } from 'lucide-react';
import { BasicProbeUI } from './shared/BasicProbeUI';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { transport } from '../services/transportService';
import { useConsoleStore } from '../stores/consoleStore';
import { parseFluidNCProbeSettingLine } from '../utils/parser';
import { HelpIconButton } from './Help/HelpIconButton';

type ProbeConfigStatus = 'idle' | 'checking' | 'detected' | 'missing' | 'unsupported';

export function ProbePanel() {
  const [showHelp, setShowHelp] = useState(false);
  const { machine } = useMachineStatusStore();
  const [probeConfigStatus, setProbeConfigStatus] = useState<ProbeConfigStatus>('idle');
  const [probeConfigMessage, setProbeConfigMessage] = useState('');
  const hasCheckedProbeConfigRef = useRef(false);
  const probeQueryStateRef = useRef({
    active: false,
    sawProbeSetting: false,
    foundConfiguredPin: false,
    timeoutId: null as ReturnType<typeof setTimeout> | null,
  });

  const isConnected = machine.status !== 'Disconnected';
  const liveProbeActive = machine.pins.includes('P') || machine.pins.includes('T');
  const hasConfiguredProbe = probeConfigStatus === 'detected';
  const missingConfiguredProbe = probeConfigStatus === 'missing';
  const liveProbeLabel = !isConnected
    ? 'Controller disconnected'
    : machine.pins.includes('T') && !machine.pins.includes('P')
      ? 'Toolsetter input active'
      : liveProbeActive
        ? 'Probe input active'
        : hasConfiguredProbe
          ? 'Probe configured, input idle'
          : missingConfiguredProbe
            ? 'Warning: no probe configured'
            : probeConfigStatus === 'checking'
              ? 'Checking probe configuration...'
              : 'Probe input idle';
  const liveProbeCardClass = missingConfiguredProbe
    ? 'bg-yellow-500/12 border-yellow-500/35 text-yellow-700 dark:text-yellow-300'
    : (liveProbeActive || hasConfiguredProbe)
      ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
      : 'bg-[var(--bg-tertiary)]/60 border-[var(--border-color)] text-[var(--text-secondary)]';
  const liveProbeDotClass = missingConfiguredProbe
    ? 'bg-yellow-400'
    : liveProbeActive
      ? 'bg-emerald-400 animate-pulse'
      : hasConfiguredProbe
        ? 'bg-emerald-400'
        : 'bg-[var(--text-tertiary)]/50';

  useEffect(() => {
    const queryState = probeQueryStateRef.current;

    const clearPendingCheck = () => {
      queryState.active = false;
      queryState.sawProbeSetting = false;
      queryState.foundConfiguredPin = false;
      if (queryState.timeoutId) {
        clearTimeout(queryState.timeoutId);
        queryState.timeoutId = null;
      }
    };

    const finishCheck = (status: ProbeConfigStatus, message: string) => {
      clearPendingCheck();
      setProbeConfigStatus(status);
      setProbeConfigMessage(message);
      useConsoleStore.getState().appendLine(`[GTaurus] ${message}`, 'sys');
    };

    const unlistenPromise = transport.listen<string>('fluidnc://rx', (event: any) => {
      const rawLine = event?.payload;
      if (!probeQueryStateRef.current.active || typeof rawLine !== 'string') return;

      const line = rawLine.replace(/\r/g, '');
      const trimmed = line.trim();
      if (!trimmed || line.startsWith('<')) return;

      if (/^error:/i.test(trimmed) || /^\[err/i.test(trimmed)) {
        useConsoleStore.getState().appendLine(trimmed, 'error');
        finishCheck('unsupported', 'Probe configuration check is not available from the connected controller, likely because `$probe` is unsupported in the current firmware mode.');
        return;
      }

      if (/^\/?probe:\s*$/i.test(trimmed) || /^\$(?:\/)?probe\//i.test(trimmed) || /^(pin|toolsetter_pin):/i.test(trimmed)) {
        useConsoleStore.getState().appendLine(trimmed);
      }

      if (/^ok$/i.test(trimmed)) {
        useConsoleStore.getState().appendLine(trimmed);
        if (!probeQueryStateRef.current.sawProbeSetting) {
          finishCheck('unsupported', 'Probe configuration check returned no probe setting data.');
          return;
        }

        finishCheck(
          probeQueryStateRef.current.foundConfiguredPin ? 'detected' : 'missing',
          probeQueryStateRef.current.foundConfiguredPin
            ? 'FluidNC probe configuration detected.'
            : 'Warning: FluidNC reports no configured probe pin or toolsetter pin.'
        );
        return;
      }

      const probeSetting = parseFluidNCProbeSettingLine(trimmed);
      if (probeSetting) {
        probeQueryStateRef.current.sawProbeSetting = true;
        if (probeSetting.configured) {
          probeQueryStateRef.current.foundConfiguredPin = true;
        }
      }
    });

    return () => {
      clearPendingCheck();
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  useEffect(() => {
    const queryState = probeQueryStateRef.current;

    const clearTimeoutIfNeeded = () => {
      if (queryState.timeoutId) {
        clearTimeout(queryState.timeoutId);
        queryState.timeoutId = null;
      }
    };

    if (!isConnected) {
      hasCheckedProbeConfigRef.current = false;
      queryState.active = false;
      queryState.sawProbeSetting = false;
      queryState.foundConfiguredPin = false;
      clearTimeoutIfNeeded();
      setProbeConfigStatus('idle');
      setProbeConfigMessage('');
      return;
    }

    if (hasCheckedProbeConfigRef.current) {
      return;
    }

    hasCheckedProbeConfigRef.current = true;
    queryState.active = true;
    queryState.sawProbeSetting = false;
    queryState.foundConfiguredPin = false;
    clearTimeoutIfNeeded();

    setProbeConfigStatus('checking');
    setProbeConfigMessage('Checking FluidNC probe settings...');
    useConsoleStore.getState().appendLine('> $probe', 'cmd');

    queryState.timeoutId = setTimeout(() => {
      queryState.active = false;
      queryState.sawProbeSetting = false;
      queryState.foundConfiguredPin = false;
      queryState.timeoutId = null;
      setProbeConfigStatus('unsupported');
      setProbeConfigMessage('Probe configuration check timed out before FluidNC returned `$probe` data.');
      useConsoleStore.getState().appendLine('[GTaurus] Probe configuration check timed out waiting for `$probe` response.', 'sys');
    }, 5000);

    transport.invoke('send_gcode', { cmd: '$probe' }).catch(() => {
      queryState.active = false;
      queryState.sawProbeSetting = false;
      queryState.foundConfiguredPin = false;
      clearTimeoutIfNeeded();
      setProbeConfigStatus('unsupported');
      setProbeConfigMessage('Probe configuration check could not be started.');
      useConsoleStore.getState().appendLine('[GTaurus] Failed to send `$probe`.', 'error');
    });
  }, [isConnected]);

  return (
    <div className="relative h-full flex flex-col bg-[var(--bg-primary)] overflow-hidden">
      <div className="p-2 space-y-2 overflow-y-auto flex-1">
        <div className="flex justify-end">
          <HelpIconButton
            topicId="probing"
            tooltip="Probe Help"
            className="p-1 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors"
            iconClassName="w-3 h-3"
          />
        </div>

        <BasicProbeUI />

        <div className="pt-1.5 border-t border-[var(--border-color)] space-y-2">
          <div className="grid grid-cols-1 gap-2">
            <div
              className={`rounded-lg border px-2 py-1.5 ${liveProbeCardClass}`}
            >
              <div className="text-[8px] font-bold uppercase tracking-wide">Probe Status</div>
              <div className="mt-1 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${liveProbeDotClass}`} />
                <span className="text-[10px] font-semibold leading-tight">{liveProbeLabel}</span>
              </div>
              {probeConfigStatus !== 'idle' && (
                <div className="mt-1 text-[9px] leading-tight opacity-90">{probeConfigMessage}</div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Help Modal Overlay */}
      {showHelp && (
        <div className="absolute inset-0 z-50 bg-[var(--bg-primary)]/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="p-3 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-sm">
            <div className="flex items-center gap-2 text-[var(--text-primary)] font-bold">
              <Info className="w-4 h-4 text-[var(--accent-primary)]" />
              <span className="text-sm">Probe Calibration Guide</span>
            </div>
            <button 
              onClick={() => setShowHelp(false)}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs text-[var(--text-secondary)] leading-relaxed pb-8">
            <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-xl border border-[var(--border-color)]/50 shadow-sm">
              <h4 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                Z-Axis Touch Plate
              </h4>
              <p>
                <strong className="text-[var(--text-primary)]">Plate Thickness (Z-Offset):</strong> Measure from the bottom of the plate (where it rests on the wood) to the top flat surface where the bit touches.
              </p>
              <p className="mt-2">
                <strong className="text-[var(--text-primary)]">Plate Shape + Size:</strong> In the Probe Panel, choose whether the Z plate is round or square and enter its diameter or length/width so the Bed Visualizer matches the real plate.
              </p>
              <p className="mt-2 text-[10px] text-[var(--text-tertiary)] italic">
                Ex: If plate is 5mm thick, enter 5 in "Plate Thick".
              </p>
            </div>

            <div className="bg-[var(--bg-tertiary)]/50 p-3 rounded-xl border border-[var(--border-color)]/50 shadow-sm">
              <h4 className="font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]"></span>
                3-Axis Corner Probe (Triquetra)
              </h4>
              <p className="mb-2">Enter these values in <strong className="text-[var(--accent-primary)]">Settings → Probe</strong>. The offsets require distance to the hole center.</p>
              
              <ol className="list-decimal list-outside space-y-2 ml-4 marker:text-[var(--text-tertiary)] marker:font-bold">
                <li className="pl-1">
                  <span className="text-[var(--text-primary)]">Hole Radius</span> = Hole Diameter ÷ 2<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Ex: 14.86 / 2 = 7.43mm</span>
                </li>
                <li className="pl-1">
                  Measure the <span className="text-[var(--text-primary)]">Wall Thickness</span> (from inner plate edge touching wood to nearest edge of hole).<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Ex: 2.63mm</span>
                </li>
                <li className="pl-1">
                  Enter <span className="text-[var(--text-primary)]">X/Y Wall Thickness</span> only.<br/>
                  <span className="text-[10px] text-[var(--accent-primary)]/80 font-mono">Software computes edge offset as Wall Thickness + (Bit Radius).</span>
                </li>
              </ol>
            </div>
            
            <div className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-3 rounded-xl border border-yellow-500/20">
              <p className="text-[11px] font-medium leading-tight">
                <strong className="text-yellow-700 dark:text-yellow-300">Tip:</strong> After probing, command <code className="bg-yellow-500/20 px-1 py-0.5 rounded mr-0.5">X0 Y0</code>. The exact center of your bit should align perfectly over the corner of your stock to verify.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
