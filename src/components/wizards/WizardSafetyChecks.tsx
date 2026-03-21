import { CheckCircle2 } from 'lucide-react';

interface SafetyChecksState {
  eyeProtection: boolean;
  secureWorkpiece: boolean;
  clearPath: boolean;
  vacuumOn: boolean;
}

interface WizardSafetyChecksProps {
  checks: SafetyChecksState;
  setChecks: React.Dispatch<React.SetStateAction<SafetyChecksState>>;
}

const CHECKLIST: Array<{ id: keyof SafetyChecksState; label: string }> = [
  { id: 'eyeProtection', label: 'I am wearing eye protection' },
  { id: 'secureWorkpiece', label: 'Workpiece is securely clamped' },
  { id: 'clearPath', label: 'The tool path is clear of obstructions' },
  { id: 'vacuumOn', label: 'Dust collection/Coolant is ready' },
];

export function WizardSafetyChecks({ checks, setChecks }: WizardSafetyChecksProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold text-[var(--text-primary)] mb-4">Final Safety Confirmation</h4>

      {CHECKLIST.map((check) => (
        <div
          key={check.id}
          onClick={() => setChecks((prev) => ({ ...prev, [check.id]: !prev[check.id] }))}
          className={`
            flex items-center gap-4 p-4 rounded-2xl border flex-1 cursor-pointer transition-all
            ${checks[check.id]
              ? 'bg-blue-500/10 border-blue-500/40 text-[var(--text-primary)] shadow-inner'
              : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'}
          `}
        >
          <div
            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
              checks[check.id] ? 'bg-blue-600 border-blue-600' : 'border-[var(--border-color)]'
            }`}
          >
            {checks[check.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
          <span className="font-bold tracking-tight">{check.label}</span>
        </div>
      ))}
    </div>
  );
}
