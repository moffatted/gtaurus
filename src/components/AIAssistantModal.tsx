/**
 * @file AIAssistantModal.tsx
 * @purpose A non-modal, draggable, and resizable wrapper for the AIPanel.
 */
import { Bot } from "lucide-react";
import clsx from "clsx";
import { useUIStore } from "../stores/uiStore";
import { useSettingsStore } from "../stores/settingsStore";
import { AIPanel } from "./AIPanel";
import { FloatingWindow } from "./ui/FloatingWindow";

export function AIAssistantModal() {
  const { aiAssistantOpen, closeAIAssistant } = useUIStore();
  const legacyGrblMode = useSettingsStore((state) => state.settings.general.legacyGrblMode);
  const firmwareLabel = legacyGrblMode ? "GRBL 1.1" : "FluidNC";

  const firmwareBadge = (
    <span className={clsx(
      "text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap",
      legacyGrblMode
        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
        : "bg-teal-500/20 text-teal-400 border border-teal-500/30"
    )}>
      {firmwareLabel}
    </span>
  );

  return (
    <FloatingWindow
      title="AI Assistant"
      icon={<Bot className="w-5 h-5 text-blue-500" />}
      isOpen={aiAssistantOpen}
      onClose={closeAIAssistant}
      defaultPosition={{ x: 150, y: 100 }}
      defaultSize={{ width: 450, height: 680 }}
      minWidth={350}
      minHeight={500}
      zIndex={useUIStore.getState().zIndexMap.aiAssistant}
      onFocus={() => useUIStore.getState().bringToFront('aiAssistant')}
      helpTopicId="top-menu-panels"
      helpTooltip="AI Assistant Help"
      titleSuffix={firmwareBadge}
    >
      <AIPanel hideHeader={true} />
    </FloatingWindow>
  );
}
