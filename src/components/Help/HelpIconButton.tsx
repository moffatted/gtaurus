import { HelpCircle } from 'lucide-react';
import { useHelpStore } from '../../stores/helpStore';
import { Tooltip } from '../ui/Tooltip';

interface HelpIconButtonProps {
  topicId: string;
  tooltip: string;
  className?: string;
  iconClassName?: string;
}

export function HelpIconButton({
  topicId,
  tooltip,
  className = 'p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors',
  iconClassName = 'w-4 h-4',
}: HelpIconButtonProps) {
  const openHelp = useHelpStore((state) => state.open);

  return (
    <Tooltip content={tooltip} position="bottom">
      <button
        type="button"
        onClick={() => openHelp(topicId)}
        className={className}
        aria-label={tooltip}
      >
        <HelpCircle className={iconClassName} />
      </button>
    </Tooltip>
  );
}
