import {
  ArrowDown,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  XOctagon,
} from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface WizardJogPadProps {
  isIdle: boolean;
  onJog: (x: number, y: number, z: number) => void;
  onHalt: () => void;
}

const jogBtnClass =
  'w-full h-full hover:bg-[var(--accent-primary)]/20 active:bg-[var(--accent-primary)]/40 hover:text-[var(--accent-primary)] transition-all duration-100 flex items-center justify-center p-3 rounded-xl';

export function WizardJogPad({ isIdle, onJog, onHalt }: WizardJogPadProps) {
  return (
    <div className="flex items-center justify-center gap-8 bg-[var(--bg-tertiary)]/50 p-6 rounded-2xl border border-[var(--border-color)]">
      <div className="grid grid-cols-3 gap-2 w-48 h-48">
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(-1, 1, 0)}><ArrowUpLeft className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(0, 1, 0)}><ArrowUp className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(1, 1, 0)}><ArrowUpRight className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(-1, 0, 0)}><ArrowLeft className="w-6 h-6" /></button>
        <Tooltip content="HALT JOGGING (0x85)" position="top">
          <button
            onClick={onHalt}
            className="w-full h-full bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-[0_4px_12px_rgba(220,38,38,0.3)] hover:shadow-[0_4px_15px_rgba(220,38,38,0.5)] active:scale-90 rounded-xl transition-all duration-150 flex items-center justify-center p-3 border-none group"
          >
            <XOctagon className="w-6 h-6 drop-shadow-sm group-hover:scale-110 transition-transform" strokeWidth={2.5} />
          </button>
        </Tooltip>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(1, 0, 0)}><ArrowRight className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(-1, -1, 0)}><ArrowDownLeft className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(0, -1, 0)}><ArrowDown className="w-6 h-6" /></button>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)]`} onClick={() => onJog(1, -1, 0)}><ArrowDownRight className="w-6 h-6" /></button>
      </div>

      <div className="flex flex-col gap-2 w-16 h-48 justify-between p-2 rounded-xl">
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)] flex-1`} onClick={() => onJog(0, 0, 1)}><ArrowUp className="w-6 h-6 cursor-pointer" /></button>
        <div className="text-xs font-bold text-center text-[var(--accent-primary)] uppercase py-1">Z</div>
        <button disabled={!isIdle} className={`${jogBtnClass} border border-[var(--border-color)] bg-[var(--bg-secondary)] flex-1`} onClick={() => onJog(0, 0, -1)}><ArrowDown className="w-6 h-6 cursor-pointer" /></button>
      </div>
    </div>
  );
}
