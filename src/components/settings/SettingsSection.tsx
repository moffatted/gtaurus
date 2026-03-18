import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface SettingsSectionProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
}

export function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)]/80 cursor-pointer transition-colors duration-150 gap-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-[var(--accent-primary)] flex-shrink-0">{icon}</span>
          <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>

      <div
        className="overflow-hidden transition-all duration-200"
        style={{ maxHeight: expanded ? '1000px' : '0px', opacity: expanded ? 1 : 0 }}
      >
        <div className="px-4 py-4 bg-[var(--bg-secondary)]">
          {children ?? (
            <p className="text-sm text-[var(--text-tertiary)] italic">
              No settings configured yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
