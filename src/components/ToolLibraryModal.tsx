/**
 * @file ToolLibraryModal.tsx
 * @purpose A non-modal, draggable, and resizable window wrapper for the ToolLibraryPanel.
 */
import { Wrench } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { ToolLibraryPanel } from "./ToolLibraryPanel";
import { FloatingWindow } from "./ui/FloatingWindow";

export function ToolLibraryModal() {
  const { toolLibraryOpen, closeToolLibrary } = useUIStore();

  return (
    <FloatingWindow
      title="Tool Library"
      icon={<Wrench className="w-5 h-4 text-purple-400" />}
      isOpen={toolLibraryOpen}
      onClose={closeToolLibrary}
      defaultPosition={{ x: 150, y: 80 }}
      defaultSize={{ width: 820, height: 620 }}
      minWidth={600}
      minHeight={420}
      zIndex={115}
    >
      <ToolLibraryPanel />
    </FloatingWindow>
  );
}
