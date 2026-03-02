/**
 * @file AIAssistantModal.tsx
 * @purpose A non-modal, draggable, and resizable wrapper for the AIPanel.
 */
import { Bot } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { AIPanel } from "./AIPanel";
import { FloatingWindow } from "./ui/FloatingWindow";

export function AIAssistantModal() {
  const { aiAssistantOpen, closeAIAssistant } = useUIStore();

  return (
    <FloatingWindow
      title="AI Assistant"
      icon={<Bot className="w-5 h-5 text-blue-500" />}
      isOpen={aiAssistantOpen}
      onClose={closeAIAssistant}
      defaultPosition={{ x: 150, y: 100 }}
      defaultSize={{ width: 450, height: 600 }}
      minWidth={350}
      minHeight={400}
      zIndex={100}
    >
      <AIPanel hideHeader={true} />
    </FloatingWindow>
  );
}
