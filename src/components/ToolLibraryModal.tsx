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
      title="Bit Library"
      icon={<Wrench className="w-5 h-4 text-purple-400" />}
      isOpen={toolLibraryOpen}
      onClose={closeToolLibrary}
      defaultPosition={{ x: 250, y: 150 }}
      defaultSize={{ width: 500, height: 700 }}
      minWidth={350}
      minHeight={400}
      zIndex={115}
    >
      <ToolLibraryPanel />
    </FloatingWindow>
  );
}
