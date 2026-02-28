/**
 * @file Tooltip.tsx
 * @purpose Lightweight tooltip component using Portals for consistent overlay positioning without z-index conflicts.
 */
import { ReactNode, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: string;
  children: ReactNode;
  delay?: number;
  className?: string; // wrapper class
  position?: TooltipPosition;
}

export function Tooltip({ content, children, delay = 300, className = "", position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef<number | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
       if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          let x = 0;
          let y = 0;

          switch (position) {
            case 'top':
              x = rect.left + rect.width / 2;
              y = rect.top - 8;
              break;
            case 'bottom':
              x = rect.left + rect.width / 2;
              y = rect.bottom + 8;
              break;
            case 'left':
              x = rect.left - 8;
              y = rect.top + rect.height / 2;
              break;
            case 'right':
              x = rect.right + 8;
              y = rect.top + rect.height / 2;
              break;
          }

          setCoords({ x, y });
          setVisible(true);
       }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setVisible(false);
    }, 100);
  };

  // Close on scroll only if the scrolling element is a parent of the trigger
  useEffect(() => {
      const handleScroll = (e: Event) => { 
          if(visible && triggerRef.current) {
              const target = e.target as Node;
              // If the element that scrolled contains our trigger, it means our trigger is moving.
              // Otherwise, it's some other unrelated container (like the console log) scrolling.
              if (target.contains && target.contains(triggerRef.current)) {
                  setVisible(false); 
              }
          }
      };
      window.addEventListener('scroll', handleScroll, true);
      return () => {
          window.removeEventListener('scroll', handleScroll, true);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
      }
  }, [visible]);

  // Dynamic classes based on position
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
          case 'top': return 'left-1/2 -translate-x-1/2 top-full border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent';
          case 'bottom': return 'left-1/2 -translate-x-1/2 bottom-full border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent';
          case 'left': return 'top-1/2 -translate-y-1/2 left-full border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent';
          case 'right': return 'top-1/2 -translate-y-1/2 right-full border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent';
      }
  };

  return (
    <div 
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
    >
      {children}
      {visible && createPortal(
        <div 
            className={`
                fixed z-[9999] px-2.5 py-1.5 text-xs font-medium text-white bg-gray-900 rounded shadow-lg pointer-events-none 
                whitespace-nowrap animate-in fade-in zoom-in-95 duration-150
                ${getTransformClass()}
            `}
            style={{ 
                left: coords.x, 
                top: coords.y,
            }}
        >
          {content}
          {/* Arrow */}
          <div 
            className={`
                absolute border-4 border-transparent
                ${getArrowClass()}
            `} 
          />
        </div>,
        document.body
      )}
    </div>
  );
}
