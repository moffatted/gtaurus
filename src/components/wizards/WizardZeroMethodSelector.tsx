import { AlignVerticalSpaceAround, Target } from 'lucide-react';

interface WizardZeroMethodSelectorProps {
  zeroMethod: 'manual' | 'probe';
  setZeroMethod: React.Dispatch<React.SetStateAction<'manual' | 'probe'>>;
}

export function WizardZeroMethodSelector({
  zeroMethod,
  setZeroMethod,
}: WizardZeroMethodSelectorProps) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-[var(--text-secondary)] mb-4">
        How would you like to set the Workspace Zero (origin) for this carve?
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setZeroMethod('manual')}
          className={`
            p-6 rounded-xl border-2 text-left transition-all flex flex-col gap-3
            ${zeroMethod === 'manual'
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]'}
          `}
        >
          <div className="flex items-center justify-between">
            <Target className={`w-8 h-8 ${zeroMethod === 'manual' ? 'text-blue-500' : 'text-[var(--text-tertiary)]'}`} />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${zeroMethod === 'manual' ? 'border-blue-500' : 'border-[var(--border-color)]'}`}>
              {zeroMethod === 'manual' && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
            </div>
          </div>
          <div>
            <h4 className={`font-bold ${zeroMethod === 'manual' ? 'text-blue-500' : 'text-[var(--text-primary)]'}`}>Manual Zero</h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Jog the tool to the visual zero point and set it manually.</p>
          </div>
        </button>

        <button
          onClick={() => setZeroMethod('probe')}
          className={`
            p-6 rounded-xl border-2 text-left transition-all flex flex-col gap-3
            ${zeroMethod === 'probe'
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--text-tertiary)]'}
          `}
        >
          <div className="flex items-center justify-between">
            <AlignVerticalSpaceAround className={`w-8 h-8 ${zeroMethod === 'probe' ? 'text-purple-500' : 'text-[var(--text-tertiary)]'}`} />
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${zeroMethod === 'probe' ? 'border-purple-500' : 'border-[var(--border-color)]'}`}>
              {zeroMethod === 'probe' && <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />}
            </div>
          </div>
          <div>
            <h4 className={`font-bold flex items-center gap-2 ${zeroMethod === 'probe' ? 'text-purple-500' : 'text-[var(--text-primary)]'}`}>
              Use Touch Probe
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1">Use a conductivity probe to precisely set the Z height.</p>
          </div>
        </button>
      </div>
    </div>
  );
}
