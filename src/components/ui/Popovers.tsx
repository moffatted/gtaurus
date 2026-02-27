import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info, AlertTriangle, AlertCircle, CheckCircle, X } from 'lucide-react';

export type PopoverKind = 'info' | 'warning' | 'error' | 'success';

interface ConfirmPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  kind?: PopoverKind;
  okLabel?: string;
  cancelLabel?: string;
  triggerRef: React.RefObject<HTMLElement | null>;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function ConfirmPopover({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  kind = 'warning',
  okLabel = 'Confirm',
  cancelLabel = 'Cancel',
  triggerRef,
  position = 'top'
}: ConfirmPopoverProps) {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let x = 0;
      let y = 0;

      switch (position) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - 12;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + 12;
          break;
        case 'left':
          x = rect.left - 12;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + 12;
          y = rect.top + rect.height / 2;
          break;
      }

      setCoords({ x, y });
    }
  }, [isOpen, triggerRef, position]);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Use a small timeout to avoid the trigger click closing it immediately
    const t = setTimeout(() => {
        window.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(t);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getKindStyles = () => {
    switch (kind) {
      case 'warning': return { icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, border: 'border-amber-500/30', bg: 'bg-amber-500/5', btn: 'bg-amber-500 hover:bg-amber-600' };
      case 'error':   return { icon: <AlertCircle className="w-5 h-5 text-red-500" />, border: 'border-red-500/30', bg: 'bg-red-500/5', btn: 'bg-red-500 hover:bg-red-600' };
      case 'success': return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', btn: 'bg-emerald-500 hover:bg-emerald-600' };
      default:        return { icon: <Info className="w-5 h-5 text-blue-500" />, border: 'border-blue-500/30', bg: 'bg-blue-500/5', btn: 'bg-blue-500 hover:bg-blue-600' };
    }
  };

  const styles = getKindStyles();

  const getTransformClass = () => {
    switch (position) {
      case 'top': return '-translate-x-1/2 -translate-y-full';
      case 'bottom': return '-translate-x-1/2';
      case 'left': return '-translate-x-full -translate-y-1/2';
      case 'right': return '-translate-y-1/2';
    }
  };

  const getArrowClass = () => {
    switch (position) {
      case 'top': return 'left-1/2 -translate-x-1/2 top-full border-t-[var(--bg-secondary)] border-l-transparent border-r-transparent border-b-transparent';
      case 'bottom': return 'left-1/2 -translate-x-1/2 bottom-full border-b-[var(--bg-secondary)] border-l-transparent border-r-transparent border-t-transparent';
      case 'left': return 'top-1/2 -translate-y-1/2 left-full border-l-[var(--bg-secondary)] border-t-transparent border-b-transparent border-r-transparent';
      case 'right': return 'top-1/2 -translate-y-1/2 right-full border-r-[var(--bg-secondary)] border-t-transparent border-b-transparent border-l-transparent';
    }
  };

  return createPortal(
    <div 
      ref={popoverRef}
      className={`
        fixed z-[10000] min-w-[300px] max-w-[400px] 
        bg-[var(--bg-secondary)] border border-[var(--border-color)] ${styles.border}
        rounded-xl shadow-2xl p-4 flex flex-col gap-3
        animate-in fade-in zoom-in-95 duration-200
        ${getTransformClass()}
      `}
      style={{ 
        left: coords.x, 
        top: coords.y,
      }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${styles.bg}`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{title}</h3>
            <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-1">
        <button 
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors border border-transparent hover:border-[var(--border-color)] rounded-lg"
        >
          {cancelLabel}
        </button>
        <button 
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-1.5 text-xs font-bold text-white ${styles.btn} rounded-lg shadow-sm transition-all active:scale-95`}
        >
          {okLabel}
        </button>
      </div>

      {/* Arrow */}
      <div 
        className={`
          absolute border-[6px] border-transparent
          ${getArrowClass()}
        `} 
      />
    </div>,
    document.body
  );
}

interface AlertPopoverProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    kind?: PopoverKind;
    okLabel?: string;
    triggerRef: React.RefObject<HTMLElement | null>;
    position?: 'top' | 'bottom' | 'left' | 'right';
  }
  
  export function AlertPopover({
    isOpen,
    onClose,
    title,
    message,
    kind = 'info',
    okLabel = 'Got it',
    triggerRef,
    position = 'top'
  }: AlertPopoverProps) {
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const popoverRef = useRef<HTMLDivElement>(null);
  
    useEffect(() => {
      if (isOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let x = 0;
        let y = 0;
  
        switch (position) {
          case 'top':
            x = rect.left + rect.width / 2;
            y = rect.top - 12;
            break;
          case 'bottom':
            x = rect.left + rect.width / 2;
            y = rect.bottom + 12;
            break;
          case 'left':
            x = rect.left - 12;
            y = rect.top + rect.height / 2;
            break;
          case 'right':
            x = rect.right + 12;
            y = rect.top + rect.height / 2;
            break;
        }
  
        setCoords({ x, y });
      }
    }, [isOpen, triggerRef, position]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape' || e.key === 'Enter') onClose();
        };
        const handleClickOutside = (e: MouseEvent) => {
          if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        const t = setTimeout(() => {
            window.addEventListener('mousedown', handleClickOutside);
        }, 10);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('mousedown', handleClickOutside);
          clearTimeout(t);
        };
      }, [isOpen, onClose]);
  
    if (!isOpen) return null;
  
    const getKindStyles = () => {
      switch (kind) {
        case 'warning': return { icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, border: 'border-amber-500/30', bg: 'bg-amber-500/5', btn: 'bg-amber-500 hover:bg-amber-600' };
        case 'error':   return { icon: <AlertCircle className="w-5 h-5 text-red-500" />, border: 'border-red-500/30', bg: 'bg-red-500/5', btn: 'bg-red-500 hover:bg-red-600' };
        case 'success': return { icon: <CheckCircle className="w-5 h-5 text-emerald-500" />, border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', btn: 'bg-emerald-500 hover:bg-emerald-600' };
        default:        return { icon: <Info className="w-5 h-5 text-blue-500" />, border: 'border-blue-500/30', bg: 'bg-blue-500/5', btn: 'bg-blue-500 hover:bg-blue-600' };
      }
    };
  
    const styles = getKindStyles();

    const getTransformClass = () => {
        switch (position) {
          case 'top': return '-translate-x-1/2 -translate-y-full';
          case 'bottom': return '-translate-x-1/2';
          case 'left': return '-translate-x-full -translate-y-1/2';
          case 'right': return '-translate-y-1/2';
        }
      };
    
      const getArrowClass = () => {
        switch (position) {
          case 'top': return 'left-1/2 -translate-x-1/2 top-full border-t-[var(--bg-secondary)] border-l-transparent border-r-transparent border-b-transparent';
          case 'bottom': return 'left-1/2 -translate-x-1/2 bottom-full border-b-[var(--bg-secondary)] border-l-transparent border-r-transparent border-t-transparent';
          case 'left': return 'top-1/2 -translate-y-1/2 left-full border-l-[var(--bg-secondary)] border-t-transparent border-b-transparent border-r-transparent';
          case 'right': return 'top-1/2 -translate-y-1/2 right-full border-r-[var(--bg-secondary)] border-t-transparent border-b-transparent border-l-transparent';
        }
      };
  
    return createPortal(
      <div 
        ref={popoverRef}
        className={`
          fixed z-[10000] min-w-[300px] max-w-[400px] 
          bg-[var(--bg-secondary)] border border-[var(--border-color)] ${styles.border}
          rounded-xl shadow-2xl p-4 flex flex-col gap-3
          animate-in fade-in zoom-in-95 duration-200
          ${getTransformClass()}
        `}
        style={{ 
          left: coords.x, 
          top: coords.y,
        }}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${styles.bg}`}>
            {styles.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)] leading-tight">{title}</h3>
              <button onClick={onClose} className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{message}</p>
          </div>
        </div>
  
        <div className="flex justify-end mt-1">
          <button 
            onClick={onClose}
            className={`px-4 py-1.5 text-xs font-bold text-white ${styles.btn} rounded-lg shadow-sm transition-all active:scale-95`}
          >
            {okLabel}
          </button>
        </div>

        {/* Arrow */}
        <div 
            className={`
            absolute border-[6px] border-transparent
            ${getArrowClass()}
            `} 
        />
      </div>,
      document.body
    );
  }
