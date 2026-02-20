import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  ArrowUpLeft, ArrowUpRight, ArrowDownLeft, ArrowDownRight,
  Home, RotateCcw, Plus, Minus
} from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

export function JogPanel() {
  const [stepSize, setStepSize] = useState<number>(10);
  const [feedRate, setFeedRate] = useState<number>(1000);

  const stepSizes = [0.1, 1, 10, 100];

  const handleJog = (x: number, y: number, z: number) => {
    let cmd = `$J=G91 G21 F${feedRate}`;
    if (x !== 0) cmd += ` X${(x * stepSize).toFixed(3)}`;
    if (y !== 0) cmd += ` Y${(y * stepSize).toFixed(3)}`;
    if (z !== 0) cmd += ` Z${(z * stepSize).toFixed(3)}`;
    invoke('send_gcode', { cmd });
  };

  const handleHome = () => {
    invoke('send_gcode', { cmd: '$H' });
  };

  const handleResetFeed = () => setFeedRate(1000);
  const handleAdjustFeed = (percent: number) => {
    setFeedRate(prev => {
      const delta = Math.round(prev * percent);
      return Math.max(100, Math.min(5000, prev + delta));
    });
  };

  const btnClass = "p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:bg-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] active:bg-[var(--accent-primary)] active:text-white transition-all duration-150 flex items-center justify-center shadow-sm";
  const activeStepClass = "bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]";
  const inactiveStepClass = "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]";

  return (
    <div className="h-full flex flex-col p-4 gap-6 select-none overflow-y-auto">
      
      {/* Step Size Selector */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Step Size (mm)</label>
        <div className="flex gap-2">
          {stepSizes.map(size => (
            <button
              key={size}
              onClick={() => setStepSize(size)}
              className={`flex-1 py-1.5 px-2 rounded text-sm font-medium border transition-colors ${
                stepSize === size ? activeStepClass : inactiveStepClass
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Rate */}
      <div className="flex flex-col gap-2">
         <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between">
            <span>Feed Rate</span>
            <span className="text-[var(--text-primary)]">{feedRate} mm/min</span>
         </label>
         <div className="flex items-center gap-3">
            <Tooltip content="Reset to 1000 mm/min" position="top">
                <button 
                    onClick={handleResetFeed}
                    className="p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] rounded transition-colors"
                >
                    <RotateCcw className="w-3.5 h-3.5" />
                </button>
            </Tooltip>
            
            <div className="flex-1 flex items-center gap-2">
                <input 
                    type="range" 
                    min="100" 
                    max="5000" 
                    step="100" 
                    value={feedRate}
                    onChange={(e) => setFeedRate(parseInt(e.target.value))}
                    className="accent-[var(--accent-primary)] flex-1 h-1.5 bg-[var(--border-color)] rounded-lg appearance-none cursor-pointer"
                />
            </div>

            <div className="flex items-center gap-1.5">
                <Tooltip content="-5% Feed Rate" position="top">
                    <button 
                        onClick={() => handleAdjustFeed(-0.05)}
                        className="p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded transition-colors"
                    >
                        <Minus className="w-3.5 h-3.5" />
                    </button>
                </Tooltip>
                <Tooltip content="+5% Feed Rate" position="top">
                    <button 
                        onClick={() => handleAdjustFeed(0.05)}
                        className="p-1.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] rounded transition-colors"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </Tooltip>
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center min-h-[300px]">
          
          {/* XY Control Pad */}
          <div className="grid grid-cols-3 gap-3 w-48 h-48">
              <Tooltip content="North-West (X- Y+)" position="top"><button className={btnClass} onClick={() => handleJog(-1, 1, 0)}><ArrowUpLeft /></button></Tooltip>
              <Tooltip content="North (Y+)" position="top"><button className={btnClass} onClick={() => handleJog(0, 1, 0)}><ArrowUp /></button></Tooltip>
              <Tooltip content="North-East (X+ Y+)" position="top"><button className={btnClass} onClick={() => handleJog(1, 1, 0)}><ArrowUpRight /></button></Tooltip>
              
              <Tooltip content="West (X-)" position="left"><button className={btnClass} onClick={() => handleJog(-1, 0, 0)}><ArrowLeft /></button></Tooltip>
              <Tooltip content="Home ($H)" position="bottom"><button className="p-4 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)] hover:text-white transition-all shadow-md" onClick={handleHome}><Home /></button></Tooltip>
              <Tooltip content="East (X+)" position="right"><button className={btnClass} onClick={() => handleJog(1, 0, 0)}><ArrowRight /></button></Tooltip>
              
              <Tooltip content="South-West (X- Y-)" position="bottom"><button className={btnClass} onClick={() => handleJog(-1, -1, 0)}><ArrowDownLeft /></button></Tooltip>
              <Tooltip content="South (Y-)" position="bottom"><button className={btnClass} onClick={() => handleJog(0, -1, 0)}><ArrowDown /></button></Tooltip>
              <Tooltip content="South-East (X+ Y-)" position="bottom"><button className={btnClass} onClick={() => handleJog(1, -1, 0)}><ArrowDownRight /></button></Tooltip>
          </div>

          {/* Z Control Pad */}
          <div className="flex flex-col gap-3 w-16 h-48 justify-between">
              <Tooltip content="Z Axis Up (Z+)" position="left"><button className={`${btnClass} h-20 bg-[var(--bg-header)]`} onClick={() => handleJog(0, 0, 1)}><ArrowUp className="w-8 h-8" /></button></Tooltip>
              <div className="text-center text-xs font-bold text-[var(--text-tertiary)]">Z Axis</div>
              <Tooltip content="Z Axis Down (Z-)" position="left"><button className={`${btnClass} h-20 bg-[var(--bg-header)]`} onClick={() => handleJog(0, 0, -1)}><ArrowDown className="w-8 h-8" /></button></Tooltip>
          </div>
      </div>
    </div>
  );
}
