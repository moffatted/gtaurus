/**
 * @file StepSizeSelector.tsx
 * @purpose Reusable component for selecting jogging step sizes (used in Controls, CarveWizard Probe, etc.)
 */

interface StepSizeSelectorProps {
  /** Current selected step size */
  value: number;
  /** Array of available step sizes to choose from */
  options: number[];
  /** Callback when step size is changed */
  onChange: (size: number) => void;
  /** Unit label (e.g., 'mm', 'in') */
  unitLabel: string;
  /** Optional CSS class for the container */
  className?: string;
}

export function StepSizeSelector({
  value,
  options,
  onChange,
  unitLabel,
  className = ''
}: StepSizeSelectorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
        Step Size ({unitLabel})
      </label>
      <div className="flex gap-1.5">
        {options.map(size => (
          <button
            key={size}
            onClick={() => onChange(size)}
            className={`flex-1 py-1.5 text-xs font-mono rounded border transition-all cursor-pointer ${
              value === size 
                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)] text-[var(--accent-primary)] font-bold' 
                : 'bg-[var(--bg-tertiary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
            }`}
            title={`Set step size to ${size} ${unitLabel}`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}
