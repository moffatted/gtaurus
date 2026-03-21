/**
 * @file FloatingWindow.tsx
 * @purpose A non-modal, draggable, and resizable window container for utility panels.
 */
import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, GripHorizontal } from "lucide-react";
import { HelpIconButton } from "../Help/HelpIconButton";

interface FloatingWindowProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number | string; height: number | string };
  minWidth?: number;
  minHeight?: number;
  zIndex?: number;
  onFocus?: () => void;
  helpTopicId?: string;
  helpTooltip?: string;
  titleSuffix?: React.ReactNode;
}

export function FloatingWindow({
  title,
  icon,
  isOpen,
  onClose,
  children,
  defaultPosition = { x: 100, y: 100 },
  defaultSize = { width: 600, height: 500 },
  minWidth = 300,
  minHeight = 200,
  zIndex = 1000,
  onFocus,
  helpTopicId,
  helpTooltip = 'Open Help',
  titleSuffix,
}: FloatingWindowProps) {
  const [pos, setPos] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; initialWidth: number; initialHeight: number } | null>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".window-action-btn")) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y,
    };
    e.preventDefault();
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    const rect = windowRef.current?.getBoundingClientRect();
    if (!rect) return;
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialWidth: rect.width,
      initialHeight: rect.height,
    };
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setPos({
          x: dragRef.current.initialX + deltaX,
          y: dragRef.current.initialY + deltaY,
        });
      }
      if (isResizing && resizeRef.current) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        setSize({
          width: Math.max(minWidth, resizeRef.current.initialWidth + deltaX),
          height: Math.max(minHeight, resizeRef.current.initialHeight + deltaY),
        });
      }
    },
    [isDragging, isResizing, minWidth, minHeight]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      ref={windowRef}
      onMouseDown={() => onFocus?.()}
      className="fixed flex flex-col bg-[var(--bg-secondary)] rounded-xl shadow-2xl border border-[var(--border-color)] overflow-hidden select-none"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: typeof size.width === "number" ? `${size.width}px` : size.width,
        height: typeof size.height === "number" ? `${size.height}px` : size.height,
        zIndex,
      }}
    >
      {/* Title Bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-header)] cursor-move h-11 shrink-0 group"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-[var(--accent-primary)] group-hover:scale-110 transition-transform">{icon}</div>}
          <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight">{title}</span>
          {titleSuffix && <div className="flex items-center gap-1">{titleSuffix}</div>}
        </div>
        <div className="flex items-center gap-1">
            {helpTopicId && (
              <div className="window-action-btn">
                <HelpIconButton
                  topicId={helpTopicId}
                  tooltip={helpTooltip}
                  className="window-action-btn p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors cursor-pointer"
                />
              </div>
            )}
            <button
              onClick={onClose}
              className="window-action-btn close-btn p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[var(--text-tertiary)] transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 bg-[var(--bg-primary)] overflow-hidden relative">
        {children}
      </div>

      {/* Resize Handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center group z-10"
        onMouseDown={handleResizeMouseDown}
      >
        <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-[var(--text-tertiary)] group-hover:border-[var(--accent-primary)] mb-1 mr-1 rotate-45 transition-colors" />
      </div>

      {/* Grip indicator at top */}
      <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-20 group-hover:opacity-40 pointer-events-none transition-opacity">
        <GripHorizontal className="w-4 h-2" />
      </div>
    </div>
  );
}
