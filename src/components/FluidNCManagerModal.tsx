/**
 * @file FluidNCManagerModal.tsx
 * @purpose A non-modal, draggable, and resizable wrapper for the FluidNCManager.
 */
import { SlidersHorizontal } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { FluidNCManager } from "./FluidNCManager";
import { FloatingWindow } from "./ui/FloatingWindow";

export function FluidNCManagerModal() {
  const { fluidNCManagerOpen, closeFluidNCManager } = useUIStore();

  return (
    <FloatingWindow
      title="FluidNC Manager"
      icon={<SlidersHorizontal className="w-5 h-5 text-[var(--accent-primary)]" />}
      isOpen={fluidNCManagerOpen}
      onClose={closeFluidNCManager}
      defaultPosition={{ x: 100, y: 150 }}
      defaultSize={{ width: 650, height: 650 }}
      minWidth={400}
      minHeight={300}
      zIndex={useUIStore.getState().zIndexMap.fluidNCManager}
      onFocus={() => useUIStore.getState().bringToFront('fluidNCManager')}
      helpTopicId="top-menu-panels"
      helpTooltip="FluidNC Manager Help"
    >
      <FluidNCManager />
    </FloatingWindow>
  );
}
