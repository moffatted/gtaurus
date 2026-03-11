import { FloatingWindow } from '../ui/FloatingWindow';
import { Box, Clock, Ruler, Loader2, AlertCircle, RotateCcw, ArrowDown, Zap, Play, Pause } from 'lucide-react';
import { useVisualizerStore, type StockOrigin } from '../../stores/visualizerStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { VisualizerScene } from './VisualizerScene';
import { Tooltip } from '../ui/Tooltip';
import { useEffect, useRef } from 'react';

export function GCodeVisualizerPopup() {
  const {
    isOpen,
    isParsing,
    analysis,
    error,
    progress,
    currentLineIdx,
    stockOrigin,
    playbackMode,
    isPlaying,
    isToolChangePaused,
    setProgress,
    setIsPlaying,
    closeVisualizer,
    setStockOrigin,
    setPlaybackMode,
    clearToolChangePause,
    resumeFromToolChangePause,
  } = useVisualizerStore();
  const gcodeScrollRef = useRef<HTMLDivElement>(null);

  // 1-based line number for G-code panel highlighting and auto-scroll
  const currentLineNum = currentLineIdx + 1;

  // Auto-play logic — variable speed: fast through setup/rapids, slow on cutting moves
  useEffect(() => {
    if (!isPlaying) return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const state = useVisualizerStore.getState();
      if (!state.isPlaying) return; // store already stopped us

      // Read current line BEFORE advancing to decide how long to show it.
      const currentLine = state.analysis?.raw_lines[state.currentLineIdx] ?? '';
      const upper = currentLine.trim().toUpperCase();

      state.stepLine(); // advance one line (sets isPlaying:false on pause/finish internally)

      // Variable delay based on line content:
      //   Cutting moves (G1/G2/G3)  → 450 ms — slow enough to read
      //   Everything else (G0, comments, setup) → 40 ms — zip through
      const isCuttingMove = /\bG0?[123]\b/.test(upper);
      const delay = isCuttingMove ? 450 : 40;

      timeoutId = setTimeout(tick, delay);
    };

    timeoutId = setTimeout(tick, 40);
    return () => clearTimeout(timeoutId);
  }, [isPlaying]);

  // Auto-scroll G-code panel to the currently executing line
  useEffect(() => {
    if (!gcodeScrollRef.current || !analysis) return;
    const lineElements = gcodeScrollRef.current.querySelectorAll('[data-line]');
    const currentLineEl = Array.from(lineElements).find(el =>
      parseInt(el.getAttribute('data-line') || '0') === currentLineNum
    ) as HTMLElement;
    if (currentLineEl) {
      currentLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [analysis, currentLineNum]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? `${h}h ` : ''}${m}m ${s}s`;
  };

  return (
    <FloatingWindow
      title="Carve Preview"
      icon={<Box className="w-5 h-5" />}
      isOpen={isOpen}
      onClose={closeVisualizer}
      defaultSize={{ width: 1000, height: 750 }}
      zIndex={2000}
    >
      <div className="flex flex-col h-full bg-[#050505]">
        {/* Statistics Bar */}
        <div className="flex items-center gap-6 px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] shrink-0 shadow-lg z-10 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Est. Time</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                {isParsing ? '...' : analysis ? formatTime(analysis.estimated_time_s) : '0m 0s'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
            <Ruler className="w-4 h-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Distance</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                {isParsing ? '...' : analysis ? `${analysis.total_dist_cut.toFixed(0)}mm` : '0mm'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
            <ArrowDown className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Max Depth</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                {isParsing ? '...' : analysis ? `${analysis.min_z.toFixed(2)}mm` : '0.00mm'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
            <Zap className="w-4 h-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold tracking-wider">Feedrate</span>
              <span className="text-xs font-mono font-medium text-[var(--text-primary)]">
                {isParsing ? '...' : analysis ? 
                  (analysis.min_feedrate === analysis.max_feedrate ? 
                    `${analysis.max_feedrate.toFixed(0)}` : 
                    `${analysis.min_feedrate.toFixed(0)}-${analysis.max_feedrate.toFixed(0)}`
                  ) : '0'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Align Design</span>
              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-inner">
                {(['FrontLeft', 'FrontRight', 'Center', 'BackLeft', 'BackRight'] as const).map((origin: StockOrigin) => (
                  <button
                    key={origin}
                    onClick={() => {
                      const s = useSettingsStore.getState();
                      setStockOrigin(
                        origin,
                        s.settings.stock.width || 112,
                        s.settings.stock.height || 112,
                        s.setStockSettings
                      );
                    }}
                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-tighter ${
                      stockOrigin === origin
                        ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]' 
                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                    }`}
                  >
                    {origin === 'FrontLeft' ? 'F-L' : origin === 'FrontRight' ? 'F-R' : origin === 'BackLeft' ? 'B-L' : origin === 'BackRight' ? 'B-R' : 'Center'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-white/5 pl-6">
            <div className="flex flex-col">
              <span className="text-[9px] text-[var(--text-tertiary)] uppercase font-bold mb-1">Playback</span>
              <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/5 shadow-inner">
                <button
                  onClick={() => setPlaybackMode('continuous')}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-tighter ${
                    playbackMode === 'continuous'
                      ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  Continuous
                </button>
                <button
                  onClick={() => setPlaybackMode('operation-step')}
                  className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all uppercase tracking-tighter ${
                    playbackMode === 'operation-step'
                      ? 'bg-orange-500 text-white shadow-[0_0_10px_rgba(249,115,22,0.3)]'
                      : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  }`}
                >
                  Operation Step
                </button>
              </div>
            </div>
          </div>

          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            <Tooltip content="Reset View & Progress" position="bottom">
               <button 
                onClick={() => {
                  setProgress(0);
                  clearToolChangePause();
                  setIsPlaying(false);
                }}
                className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
               >
                  <RotateCcw className="w-4 h-4" />
               </button>
            </Tooltip>
          </div>
        </div>

        {/* Main Viewing Area */}
        <div className="flex-1 relative overflow-hidden bg-[#050505] cursor-crosshair">
          {isParsing ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
              <div className="bg-[var(--bg-secondary)] p-8 rounded-2xl border border-[var(--border-color)] shadow-2xl flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-[var(--accent-primary)] animate-spin" />
                <div className="text-center">
                   <p className="text-sm font-bold text-[var(--text-primary)]">Analyzing G-code</p>
                   <p className="text-xs text-[var(--text-tertiary)] mt-1">Calculate total distance and moves.</p>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <div className="bg-red-500/10 p-8 rounded-2xl border border-red-500/20 text-red-500 max-w-md text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold mb-2 uppercase tracking-widest text-xs">Parsing Error</p>
                <div className="bg-black/40 p-3 rounded-lg border border-red-500/10">
                   <p className="text-[10px] opacity-80 font-mono break-all">{error}</p>
                </div>
              </div>
            </div>
          ) : analysis ? (
            <>
              <VisualizerScene />
              
              {/* Scrubber Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-20">
                 <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (isPlaying) {
                          setIsPlaying(false);
                          return;
                        }
                        if (isToolChangePaused) {
                          resumeFromToolChangePause(); // sets isPlaying:true in store
                        } else {
                          setIsPlaying(true);
                        }
                      }}
                      className={`p-2 rounded-xl transition-all shadow-lg active:scale-95 group flex items-center justify-center ${
                        isPlaying 
                          ? 'bg-orange-500 hover:bg-orange-400 text-white' 
                          : 'bg-[var(--accent-primary)] hover:bg-cyan-400 text-black'
                      }`}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 fill-current" />
                      ) : (
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      )}
                    </button>

                    <span className="text-[10px] font-mono text-[var(--text-tertiary)] w-12 text-right">
                       {Math.round(progress * 100)}%
                    </span>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.001"
                      value={progress}
                      onChange={(e) => {
                        setProgress(parseFloat(e.target.value));
                        setIsPlaying(false);
                      }}
                      className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)] hover:accent-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                    />
                    <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                       {analysis.points.length.toLocaleString()} pts
                    </span>
                 </div>
                 {isToolChangePaused && (
                   <div className="absolute -top-12 left-0 right-0 bg-yellow-600/40 border border-yellow-500/50 backdrop-blur-sm p-3 rounded-lg text-center">
                     <p className="text-xs font-bold text-yellow-200">⏸ PAUSED AT TOOL CHANGE</p>
                     <p className="text-[9px] text-yellow-100/70 mt-1">Click Play to continue</p>
                   </div>
                 )}
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
               <Box className="w-24 h-24 mb-4" />
               <p className="font-bold tracking-widest uppercase text-xs">No Geometry Data</p>
            </div>
          )}
          
          {analysis && !isParsing && (
            <div className="absolute top-6 left-6 z-10 pointer-events-auto">
               <div 
                 className="bg-black/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl w-96 max-h-96 flex flex-col gap-1 overflow-hidden"
                 onWheel={(e) => e.stopPropagation()}
                 onScroll={(e) => e.stopPropagation()}
               >
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <p className="text-xs text-[var(--accent-primary)] font-bold uppercase tracking-widest">G-Code Info</p>
                    <span className="px-1 py-0.5 bg-cyan-500/20 text-[var(--accent-primary)] rounded text-[10px] font-mono border border-cyan-400/30">{analysis.wcs}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs overflow-y-auto overflow-x-auto select-text">
                    {/* Size Context */}
                    <div>
                      <p className="text-[var(--accent-primary)] font-bold mb-0.5 tracking-tighter">Footprint</p>
                      <div className="grid grid-cols-3 gap-x-1 font-mono text-xs">
                        <span className="text-[var(--text-secondary)]">X:</span>
                        <span className="text-[var(--text-primary)] col-span-2">{(analysis.bbox_max[0] - analysis.bbox_min[0]).toFixed(1)}</span>
                        <span className="text-[var(--text-secondary)]">Y:</span>
                        <span className="text-[var(--text-primary)] col-span-2">{(analysis.bbox_max[1] - analysis.bbox_min[1]).toFixed(1)}</span>
                        <span className="text-[var(--text-secondary)]">Z:</span>
                        <span className="text-orange-400 col-span-2">{(analysis.bbox_max[2] - analysis.bbox_min[2]).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="pt-1 border-t border-white/5">
                      <p className="text-[var(--accent-primary)] font-bold mb-0.5 tracking-tighter">Workpiece</p>
                      <div className="grid grid-cols-3 gap-x-1 font-mono text-xs">
                        <span className="text-[var(--text-secondary)]">W:</span>
                        <span className="text-[var(--text-primary)] col-span-2">{useSettingsStore.getState().settings.stock.width}</span>
                        <span className="text-[var(--text-secondary)]">D:</span>
                        <span className="text-[var(--text-primary)] col-span-2">{useSettingsStore.getState().settings.stock.height}</span>
                      </div>
                    </div>

                    {/* G-Code Execution Display */}
                    {analysis && analysis.raw_lines.length > 0 && (
                      <div className="pt-1 border-t border-white/5">
                        <p className="text-[var(--accent-primary)] font-bold mb-0.5 tracking-tighter text-xs">▶ G-Code</p>
                        <div 
                          ref={gcodeScrollRef}
                          className="bg-black/40 rounded p-1 border border-white/5 max-h-48 overflow-y-auto overflow-x-auto select-text"
                          style={{ scrollBehavior: 'smooth' }}
                        >
                          <div className="font-mono text-xs space-y-0 whitespace-nowrap">
                            {analysis.raw_lines.map((line, idx) => {
                              const lineNum = idx + 1;
                              const isExecuting = lineNum === currentLineNum;
                              const isExecuted = lineNum < currentLineNum;
                              
                              return (
                                <div
                                  key={idx}
                                  data-line={lineNum}
                                  className={`px-1 py-0.5 transition-colors ${
                                    isExecuting
                                      ? 'bg-yellow-600/40 text-yellow-200 border-l border-yellow-500'
                                      : isExecuted
                                      ? 'text-[var(--text-secondary)]'
                                      : 'text-[var(--text-tertiary)]'
                                  }`}
                                >
                                  <span className="inline-block w-8 text-[var(--text-tertiary)] text-right mr-1 text-[10px]">{lineNum}</span>
                                  <span className="break-all">{line || '(empty)'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* Footer info/controls */}
        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] shrink-0">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-cyan-500" /> Cutting
             </span>
             <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500" /> Rapid
             </span>
          </div>
          <div className="font-mono opacity-50 uppercase tracking-tighter">
            gtaurus v2 visualizer engine
          </div>
        </div>
      </div>
    </FloatingWindow>
  );
}
