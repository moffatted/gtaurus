/**
 * @file SurfacingWizard.tsx
 * @purpose A guided 4-step wizard for configuring and generating raster surfacing G-code.
 */
import { useState, useEffect, useRef } from 'react';
import { Wizard, WizardStep } from '../ui/Wizard';
import { useWizardStore } from '../../stores/wizardStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useToolStore } from '../../stores/toolStore';
import { useVisualizerStore } from '../../stores/visualizerStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { transport } from '../../services/transportService';
import {
  CheckCircle2, Drill, SlidersHorizontal, FileCode2,
  Loader2, AlertCircle, RotateCcw, ArrowLeftRight, ArrowRight,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function rotate2d(x: number, y: number, rad: number): [number, number] {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return [c * x - s * y, s * x + c * y];
}

function clipLine(
  x0: number, y0: number, x1: number, y1: number,
  xMin: number, xMax: number, yMin: number, yMax: number,
): [[number, number], [number, number]] | null {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let t0 = 0, t1 = 1;
  for (const [p, q] of [[-dx, x0 - xMin], [dx, xMax - x0], [-dy, y0 - yMin], [dy, yMax - y0]] as [number, number][]) {
    if (p === 0) { if (q < 0) return null; }
    else {
      const r = q / p;
      if (p < 0) { if (r > t1) return null; if (r > t0) t0 = r; }
      else        { if (r < t0) return null; if (r < t1) t1 = r; }
    }
  }
  return [
    [x0 + t0 * dx, y0 + t0 * dy],
    [x0 + t1 * dx, y0 + t1 * dy],
  ];
}

type OriginCorner = 'front_left' | 'front_right' | 'back_left' | 'back_right' | 'center';

function originOffset(origin: OriginCorner, width: number, height: number): [number, number] {
  switch (origin) {
    case 'front_right': return [-width, 0];
    case 'back_left':   return [0, -height];
    case 'back_right':  return [-width, -height];
    case 'center':      return [-width / 2, -height / 2];
    default:            return [0, 0];
  }
}

function zeroPositionToOrigin(zp: string): OriginCorner {
  switch (zp) {
    case 'bottom-right': return 'front_right';
    case 'top-left':     return 'back_left';
    case 'top-right':    return 'back_right';
    case 'center':       return 'center';
    default:             return 'front_left';
  }
}

function computeRasterPreview(
  width: number,
  height: number,
  stepover: number,
  angleDeg: number,
  overtravel: number,
  origin: OriginCorner,
): Array<[[number, number], [number, number]]> {
  const lines: Array<[[number, number], [number, number]]> = [];
  const rad = (angleDeg * Math.PI) / 180;
  const inv = -rad;
  const [xOff, yOff] = originOffset(origin, width, height);

  const clipXMin = xOff - overtravel;
  const clipXMax = xOff + width + overtravel;
  const clipYMin = yOff - overtravel;
  const clipYMax = yOff + height + overtravel;

  const corners: [number, number][] = [
    [clipXMin, clipYMin],
    [clipXMax, clipYMin],
    [clipXMax, clipYMax],
    [clipXMin, clipYMax],
  ];
  const rotated = corners.map(([x, y]) => rotate2d(x, y, inv));
  const scanXMin = Math.min(...rotated.map(([x]) => x));
  const scanXMax = Math.max(...rotated.map(([x]) => x));
  const scanYMin = Math.min(...rotated.map(([, y]) => y));
  const scanYMax = Math.max(...rotated.map(([, y]) => y));

  const span = scanYMax - scanYMin;
  const numLines = Math.floor(span / stepover);
  const startOffset = (span - numLines * stepover) / 2;
  let y = scanYMin + startOffset;
  while (y <= scanYMax + 1e-4) {
    const [sx, sy] = rotate2d(scanXMin, y, rad);
    const [ex, ey] = rotate2d(scanXMax, y, rad);
    const clipped = clipLine(sx, sy, ex, ey, clipXMin, clipXMax, clipYMin, clipYMax);
    if (clipped) lines.push(clipped);
    y += stepover;
  }
  return lines;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const labelCls = 'block text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1';
const inputCls =
  'w-full px-2 py-1.5 text-xs font-mono rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] ' +
  'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] ' +
  'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all';

interface NumFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  min?: number;
  step?: number;
}
function NumField({ label, value, onChange, unit, min = 0 }: NumFieldProps) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    setRaw(String(value));
  }, [value]);

  const commit = () => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n >= min) onChange(n);
    else setRaw(String(value));
  };

  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') { commit(); (e.target as HTMLInputElement).blur(); } }}
          className={inputCls + ' !py-1 pr-8'}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-[var(--text-tertiary)] pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Toolpath Preview Canvas ─────────────────────────────────────────────────

interface PreviewCanvasProps {
  width: number;
  height: number;
  stepover: number;
  angleDeg: number;
  overtravel: number;
  origin: OriginCorner;
}
function PreviewCanvas({ width, height, stepover, angleDeg, overtravel, origin }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    const pad = 28;

    const [xOff, yOff] = originOffset(origin, width, height);

    // World bounding box that must fit in the canvas (stock + overtravel on all sides)
    const worldXMin = xOff - overtravel;
    const worldXMax = xOff + width + overtravel;
    const worldYMin = yOff - overtravel;
    const worldYMax = yOff + height + overtravel;
    const worldW = worldXMax - worldXMin;
    const worldH = worldYMax - worldYMin;

    const scaleX = (cw - pad * 2) / worldW;
    const scaleY = (ch - pad * 2) / worldH;
    const scale = Math.min(scaleX, scaleY);

    const ox = pad + ((cw - pad * 2) - worldW * scale) / 2;
    const oy = pad + ((ch - pad * 2) - worldH * scale) / 2;

    // World-to-canvas (Y flipped so +Y is up)
    const wx = (x: number) => ox + (x - worldXMin) * scale;
    const wy = (y: number) => oy + (worldYMax - y) * scale;

    ctx.clearRect(0, 0, cw, ch);

    // Stock boundary (in world coords)
    const sxPx = wx(xOff);
    const syPx = wy(yOff + height);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sxPx, syPx, width * scale, height * scale);
    ctx.fillStyle = 'rgba(30,41,59,0.4)';
    ctx.fillRect(sxPx, syPx, width * scale, height * scale);

    // WCS origin marker
    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(wx(0), wy(0), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText('X0 Y0', wx(0) + 6, wy(0) + 4);

    // Toolpath lines
    const lines = computeRasterPreview(width, height, stepover, angleDeg, overtravel, origin);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.5;

    lines.forEach(([[sx, sy], [ex, ey]], i) => {
      ctx.beginPath();
      ctx.moveTo(wx(sx), wy(sy));
      ctx.lineTo(wx(ex), wy(ey));
      ctx.globalAlpha = 0.95;
      ctx.stroke();

      if (i % 3 === 0) {
        const mx = (sx + ex) / 2;
        const my = (sy + ey) / 2;
        const dx = ex - sx;
        const dy = ey - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = (dx / len) * 5;
        const ny = (dy / len) * 5;
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = '#3b82f6';
        ctx.beginPath();
        ctx.moveTo(wx(mx), wy(my));
        ctx.lineTo(wx(mx + nx), wy(my + ny));
        ctx.stroke();
        ctx.strokeStyle = '#1d4ed8';
      }
      ctx.globalAlpha = 1;
    });

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText(`${width} × ${height}`, sxPx + 4, syPx - 6);
    ctx.fillText(`${lines.length} lines`, sxPx + 4, syPx + height * scale + 14);
  }, [width, height, stepover, angleDeg, overtravel, origin]);

  return (
    <canvas
      ref={canvasRef}
      width={420}
      height={280}
      className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)]"
    />
  );
}

// ─── Wizard ──────────────────────────────────────────────────────────────────

export function SurfacingWizard() {
  const { isSurfacingWizardOpen, closeSurfacingWizard } = useWizardStore();
  const { settings } = useSettingsStore();
  const { tools, activeToolId } = useToolStore();
  const isInches = settings.general.carvingUnits === 'inches';
  const unitLabel = isInches ? 'in' : 'mm';

  // ── Step 1: Tool ─────────────────────────────────────────────────────────
  const surfacingTools = tools.filter((t) => t.type === 'surfacing');
  const displayTools = surfacingTools.length > 0 ? surfacingTools : tools;
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);

  const activeTool = tools.find((t) => t.id === selectedToolId);
  const toolDiam = activeTool?.diameter ?? 25.4;

  // ── Step 2: Parameters ───────────────────────────────────────────────────
  const [surfW, setSurfW] = useState(settings.stock.width || 200);
  const [surfH, setSurfH] = useState(settings.stock.height || 150);
  const [surfZ, setSurfZ] = useState(settings.stock.thickness || 20);
  const [totalDepth, setTotalDepth] = useState(1.0);
  const [depthPerPass, setDepthPerPass] = useState(0.5);
  const [stepoverPct, setStepoverPct] = useState(50);
  const [angleDeg, setAngleDeg] = useState(0);
  const [bidirectional, setBidirectional] = useState(true);
  const [overtravel, setOvertravel] = useState(toolDiam / 2 + 2);
  const [safeZ, setSafeZ] = useState((settings.stock.thickness || 20) + 5);
  const [feedrate, setFeedrate] = useState(settings.general.feedRate || 2000);
  const [plungeRate, setPlungeRate] = useState(Math.round((settings.general.feedRate || 2000) * 0.3));
  const [spindleRpm, setSpindleRpm] = useState(18000);
  const [finishPass, setFinishPass] = useState(false);

  // Derived from machine settings — keeps G-code aligned with what the visualizer expects
  const origin = zeroPositionToOrigin(settings.stock.zeroPosition);

  // Warnings derived from stock height (Z)
  const safeZTooLow = safeZ <= surfZ;
  const depthExceedsStock = totalDepth > surfZ;

  // Sync overtravel when tool changes
  useEffect(() => {
    setOvertravel(parseFloat((toolDiam / 2 + 2).toFixed(2)));
  }, [toolDiam]);

  // Sync dimensions and safe Z when stock settings change while wizard is open
  useEffect(() => {
    if (isSurfacingWizardOpen) {
      setSurfW(settings.stock.width || 200);
      setSurfH(settings.stock.height || 150);
      setSurfZ(settings.stock.thickness || 20);
      setSafeZ((settings.stock.thickness || 20) + 5);
    }
  }, [isSurfacingWizardOpen, settings.stock.width, settings.stock.height, settings.stock.thickness]);

  // ── Step 4: Generation ───────────────────────────────────────────────────
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedGcode, setGeneratedGcode] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const stepover = parseFloat(((stepoverPct / 100) * toolDiam).toFixed(4));
  const numPasses = depthPerPass > 0 ? Math.ceil(totalDepth / depthPerPass) : 0;
  const lines = computeRasterPreview(surfW, surfH, stepover, angleDeg, overtravel, origin);
  const numLines = lines.length;

  const paramsValid =
    surfW > 0 && surfH > 0 && totalDepth > 0 && depthPerPass > 0 &&
    stepover > 0 && feedrate > 0 && plungeRate > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenError(null);
    setGeneratedGcode(null);
    try {
      const gcode = await transport.invoke<string>('generate_surfacing_toolpath', {
        width: surfW,
        height: surfH,
        totalDepth,
        depthPerPass,
        stepover,
        angleDeg,
        overtravel,
        bidirectional,
        safeZ,
        feedrate,
        plungeRate,
        spindleRpm,
        finishPass,
        useInches: isInches,
        origin,
      });
      setGeneratedGcode(gcode);
    } catch (e: any) {
      setGenError(String(e));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAndPreview = async () => {
    if (!generatedGcode) return;
    const filename = `surfacing_${Date.now()}.nc`;
    const storagePath = settings.gcodeStoragePath;
    try {
      await transport.invoke('save_local_file', {
        path: storagePath,
        filename,
        content: generatedGcode,
      });
      const fullPath = `${storagePath}/${filename}`.replace(/\\/g, '/');
      useGcodeStore.getState().setGcode(generatedGcode, filename, fullPath);
      await useVisualizerStore.getState().openVisualizer(fullPath);
      closeSurfacingWizard();
    } catch (e: any) {
      setGenError(String(e));
    }
  };

  // Reset generation state each time wizard opens
  useEffect(() => {
    if (isSurfacingWizardOpen) {
      setGeneratedGcode(null);
      setGenError(null);
      setIsGenerating(false);
      // Pre-select the active tool or first surfacing tool
      const preferred = tools.find((t) => t.id === activeToolId && t.type === 'surfacing')
        ?? surfacingTools[0]
        ?? null;
      setSelectedToolId(preferred?.id ?? null);
    }
  }, [isSurfacingWizardOpen]);

  // ── Steps ────────────────────────────────────────────────────────────────

  const steps: WizardStep[] = [
    // ── Step 1: Tool Selection ───────────────────────────────────────────
    {
      id: 'tool',
      title: 'Select Surfacing Bit',
      canProceed: selectedToolId !== null,
      component: (
        <div className="space-y-4">
          {surfacingTools.length === 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              No surfacing bits in your library. Showing all tools. Add a bit with type "Surfacing" for best results.
            </div>
          )}
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {displayTools.map((tool) => {
              const selected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedToolId(tool.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)]/50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'}`}>
                    <Drill className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] truncate">{tool.name}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)]">
                      Ø {tool.diameter}mm · T{tool.number} · {tool.type}
                    </p>
                  </div>
                  {selected && <CheckCircle2 className="w-5 h-5 text-[var(--accent-primary)] shrink-0" />}
                </button>
              );
            })}
          </div>
          {activeTool && (
            <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
              <span className="font-bold text-[var(--text-primary)]">Selected:</span>{' '}
              {activeTool.name} — Ø{activeTool.diameter}mm
              {activeTool.notes && <span className="block mt-1 opacity-60">{activeTool.notes}</span>}
            </div>
          )}
        </div>
      ),
    },

    // ── Step 2: Parameters ───────────────────────────────────────────────
    {
      id: 'parameters',
      title: 'Configure Pass',
      canProceed: paramsValid,
      component: (
        <div className="space-y-4">
          {/* Dimensions */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3" /> Stock Dimensions
            </p>
            <div className="grid grid-cols-3 gap-2">
              <NumField label={`Width (X) [${unitLabel}]`} value={surfW} onChange={setSurfW} unit={unitLabel} />
              <NumField label={`Length (Y) [${unitLabel}]`} value={surfH} onChange={setSurfH} unit={unitLabel} />
              <NumField label={`Height (Z) [${unitLabel}]`} value={surfZ} onChange={(v) => { setSurfZ(v); setSafeZ(v + 5); }} unit={unitLabel} step={0.5} />
            </div>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">Auto-filled from Settings → Stock. Edit here to override for this operation.</p>
          </div>

          {/* Work Origin */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">Work Origin:</span>
            <span className="font-mono text-[var(--accent-primary)]">{origin.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
            <span className="opacity-60">— auto-matched from Settings → Stock zero position</span>
          </div>

          {/* Removal Depth */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2">Removal Depth</p>
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[10px] font-mono text-[var(--text-secondary)] mb-2 flex items-center justify-between">
              <span>Stock height: <span className="text-[var(--text-primary)] font-bold">{surfZ}{unitLabel}</span></span>
              <span>Passes: <span className="text-[var(--text-primary)] font-bold">{numPasses}</span></span>
              <span>Removes: <span className="text-[var(--text-primary)] font-bold">{surfZ > 0 ? ((totalDepth / surfZ) * 100).toFixed(1) : '0'}%</span> of stock</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <NumField label={`Total Removal [${unitLabel}]`} value={totalDepth} onChange={setTotalDepth} unit={unitLabel} step={0.1} />
              <NumField label={`Removal / Pass [${unitLabel}]`} value={depthPerPass} onChange={setDepthPerPass} unit={unitLabel} step={0.1} />
            </div>
            {depthExceedsStock && (
              <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px]">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Total removal ({totalDepth}{unitLabel}) exceeds stock height ({surfZ}{unitLabel}). This will cut through the spoilboard.
              </div>
            )}
          </div>

          {/* Toolpath */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2">Toolpath</p>
            <div className="grid grid-cols-3 gap-2">
              <NumField label="Step-over (%)" value={stepoverPct} onChange={setStepoverPct} unit="%" step={5} min={10} />
              <NumField label="Angle (°)" value={angleDeg} onChange={setAngleDeg} unit="°" min={0} step={5} />
              <NumField label={`Over-travel [${unitLabel}]`} value={overtravel} onChange={setOvertravel} unit={unitLabel} step={0.5} />
            </div>
            {/* Angle presets */}
            <div className="flex gap-2 mt-2">
              {[0, 45, 90].map(a => (
                <button
                  key={a}
                  onClick={() => setAngleDeg(a)}
                  className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all ${angleDeg === a ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'}`}
                >
                  {a}°
                </button>
              ))}
            </div>
            {/* Computed stepover display */}
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">
              Effective step-over: <span className="text-[var(--text-primary)]">{stepover.toFixed(3)}{unitLabel}</span>
              {' '}({stepoverPct}% of Ø{toolDiam}mm)
            </p>
          </div>

          {/* Motion */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent-primary)] mb-2">Motion</p>
            <div className="grid grid-cols-3 gap-2">
              <NumField label={`Safe Z [${unitLabel}]`} value={safeZ} onChange={setSafeZ} unit={unitLabel} step={1} />
              <NumField label="Feedrate (mm/min)" value={feedrate} onChange={setFeedrate} unit="mm/m" step={100} />
              <NumField label="Plunge Rate (mm/min)" value={plungeRate} onChange={setPlungeRate} unit="mm/m" step={50} />
            </div>
            {safeZTooLow && (
              <div className="flex items-center gap-1.5 mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px]">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Safe Z ({safeZ}{unitLabel}) is at or below stock height ({surfZ}{unitLabel}). Rapid moves will collide with the stock. Recommended: {surfZ + 5}{unitLabel}.
              </div>
            )}
          </div>

          {/* Spindle + direction */}
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Spindle RPM" value={spindleRpm} onChange={setSpindleRpm} unit="RPM" step={500} />
            <div>
              <label className={labelCls}>Cut Direction</label>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => setBidirectional(true)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${bidirectional ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'}`}
                >
                  <ArrowLeftRight className="w-3 h-3" /> Zig-zag
                </button>
                <button
                  onClick={() => setBidirectional(false)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${!bidirectional ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'}`}
                >
                  <ArrowRight className="w-3 h-3" /> One-way
                </button>
              </div>
            </div>
          </div>

          {/* Finish pass toggle */}
          <div
            onClick={() => setFinishPass(!finishPass)}
            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${finishPass ? 'border-green-500/50 bg-green-500/5' : 'border-[var(--border-color)] bg-[var(--bg-tertiary)]'}`}
          >
            <div>
              <p className="text-xs font-bold text-[var(--text-primary)]">Finish Pass</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">Extra 0.05{unitLabel} cleanup layer for better surface quality</p>
            </div>
            <div className={`w-8 h-4.5 rounded-full border-2 border-transparent transition-colors ${finishPass ? 'bg-green-500' : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'}`}>
              <span className={`pointer-events-none block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${finishPass ? 'translate-x-3.5' : 'translate-x-0'}`} />
            </div>
          </div>

          {/* Summary */}
          <div className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Z Passes</p>
              <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{numPasses}{finishPass ? '+1' : ''}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Lines / Pass</p>
              <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{numLines}</p>
            </div>
            <div>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase font-bold">Total Lines</p>
              <p className="text-sm font-mono font-bold text-[var(--text-primary)]">{numLines * numPasses + (finishPass ? numLines : 0)}</p>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 3: Preview ──────────────────────────────────────────────────
    {
      id: 'preview',
      title: 'Toolpath Preview',
      canProceed: true,
      component: (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Live 2D preview of the raster toolpath at <span className="font-mono text-[var(--text-primary)]">{angleDeg}°</span> with{' '}
            <span className="font-mono text-[var(--text-primary)]">{stepover.toFixed(2)}{unitLabel}</span> step-over.
          </p>
          <PreviewCanvas
            width={surfW}
            height={surfH}
            stepover={stepover}
            angleDeg={angleDeg}
            overtravel={overtravel}
            origin={origin}
          />
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-tertiary)]">Area:</span>{' '}
              <span className="font-mono font-bold text-[var(--text-primary)]">{surfW} × {surfH}{unitLabel}</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-tertiary)]">Tool:</span>{' '}
              <span className="font-mono font-bold text-[var(--text-primary)]">Ø{toolDiam}mm</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-tertiary)]">Depth:</span>{' '}
              <span className="font-mono font-bold text-[var(--text-primary)]">{totalDepth}{unitLabel} in {numPasses} pass{numPasses !== 1 ? 'es' : ''}</span>
            </div>
            <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
              <span className="text-[var(--text-tertiary)]">Direction:</span>{' '}
              <span className="font-mono font-bold text-[var(--text-primary)]">{bidirectional ? 'Zig-zag' : 'One-way'}</span>
            </div>
          </div>
        </div>
      ),
    },

    // ── Step 4: Generate ─────────────────────────────────────────────────
    {
      id: 'generate',
      title: 'Generate G-code',
      canProceed: generatedGcode !== null,
      onEnter: () => {
        if (!generatedGcode && !isGenerating) handleGenerate();
      },
      component: (
        <div className="space-y-4">
          {isGenerating && (
            <div className="flex flex-col items-center gap-3 py-8">
              <Loader2 className="w-10 h-10 text-[var(--accent-primary)] animate-spin" />
              <p className="text-sm text-[var(--text-secondary)]">Generating surfacing toolpath…</p>
            </div>
          )}

          {genError && !isGenerating && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold">Generation Failed</p>
                <p className="text-xs mt-1 opacity-80">{genError}</p>
              </div>
              <button
                onClick={handleGenerate}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Retry
              </button>
            </div>
          )}

          {generatedGcode && !isGenerating && (
            <>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle2 className="w-8 h-8 text-green-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-400">G-code Ready</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                    {generatedGcode.split('\n').length} lines · {(generatedGcode.length / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-tertiary)]">Z Passes:</span>{' '}
                  <span className="font-bold font-mono text-[var(--text-primary)]">{numPasses}{finishPass ? ' + 1 finish' : ''}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-tertiary)]">Total removal:</span>{' '}
                  <span className="font-bold font-mono text-[var(--text-primary)]">{totalDepth}{unitLabel}</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-tertiary)]">Feedrate:</span>{' '}
                  <span className="font-bold font-mono text-[var(--text-primary)]">{feedrate} mm/min</span>
                </div>
                <div className="p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                  <span className="text-[var(--text-tertiary)]">Spindle:</span>{' '}
                  <span className="font-bold font-mono text-[var(--text-primary)]">{spindleRpm.toLocaleString()} RPM</span>
                </div>
              </div>

              <div className="mt-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5">G-code Preview (first 20 lines)</p>
                <pre className="text-[10px] font-mono bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-3 overflow-x-auto text-green-400 leading-relaxed max-h-36 overflow-y-auto custom-scrollbar">
                  {generatedGcode.split('\n').slice(0, 20).join('\n')}
                </pre>
              </div>

              <button
                onClick={handleSaveAndPreview}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/80 text-white font-bold transition-all btn-3d"
              >
                <FileCode2 className="w-4 h-4" />
                Save & Open in Visualizer
              </button>
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50 text-xs font-bold transition-all"
              >
                <RotateCcw className="w-3 h-3" /> Regenerate
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Wizard
      isOpen={isSurfacingWizardOpen}
      onClose={closeSurfacingWizard}
      steps={steps}
      title="Surface Workpiece"
      heroImage="/surfacing_hero.png"
      finalLabel="Done"
    />
  );
}
