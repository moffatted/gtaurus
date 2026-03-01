/**
 * @file HelpMenu.tsx
 * @purpose Dropdown menu for accessing documentation, keyboard shortcuts, and relative help resources.
 */
import { useState, useRef, useEffect } from 'react';
import { HelpCircle, FileText, Keyboard, AlertCircle, Info, ExternalLink, ScrollText } from 'lucide-react';
import { useHelpStore } from '../../stores/helpStore';
import { Tooltip } from '../ui/Tooltip';

export function HelpMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { open, setTopic } = useHelpStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Tooltip content="Help & Resources" position="bottom">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer shadow-sm ${
            isOpen 
              ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] ring-2 ring-[var(--accent-primary)]/20' 
              : 'bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-primary)]/90 hover:shadow-md active:scale-95'
          }`}
          aria-label="Help menu"
          aria-expanded={isOpen}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
      </Tooltip>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
            <div className="px-3 py-2 border-b border-[var(--border-color)]">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Help & Support</p>
            </div>
          
          <button
            onClick={() => handleAction(() => { setTopic('getting-started'); open(); })}
            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors"
          >
            <FileText className="w-4 h-4 text-[var(--accent-primary)]" />
            Help Center
          </button>

          <button
            onClick={() => handleAction(() => { setTopic('gcode-ref'); open(); })}
            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors"
          >
            <ScrollText className="w-4 h-4 text-[var(--text-secondary)]" />
            Cheat Sheets
          </button>

          <button
            onClick={() => handleAction(() => { setTopic('shortcuts'); open(); })}
            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors"
          >
            <Keyboard className="w-4 h-4 text-[var(--text-secondary)]" />
            Keyboard Shortcuts
          </button>

          <a
            href="https://github.com/fluidnc/fluidnc/issues" 
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsOpen(false)}
            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-[var(--text-secondary)]" />
            Report Issue
            <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
          </a>

          <div className="my-1 border-t border-[var(--border-color)]" />

          <button
            onClick={() => handleAction(() => { setTopic('about'); open(); })}
            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] flex items-center gap-3 transition-colors"
          >
            <Info className="w-4 h-4 text-[var(--text-secondary)]" />
            About Gtaurus
          </button>
        </div>
      )}
    </div>
  );
}
