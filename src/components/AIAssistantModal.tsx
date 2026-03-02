/**
 * @file AIAssistantModal.tsx
 * @purpose A modal wrapper for the AIPanel to allow it to be used as a standalone popup.
 */
import { X, Bot } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { AIPanel } from "./AIPanel";

export function AIAssistantModal() {
  const { aiAssistantOpen, closeAIAssistant } = useUIStore();

  if (!aiAssistantOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100] backdrop-blur-[2px] p-4 transition-all duration-300 animate-in fade-in"
      onClick={closeAIAssistant}
    >
      <div
        className="bg-[var(--bg-secondary)] rounded-2xl shadow-2xl w-full max-w-2xl border border-[var(--border-color)] overflow-hidden flex flex-col h-[70vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-header)] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Bot className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">AI Assistant</h2>
          </div>
          <button
            onClick={closeAIAssistant}
            className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors duration-200 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            aria-label="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 bg-[var(--bg-primary)]">
          <AIPanel hideHeader={true} />
        </div>
      </div>
    </div>
  );
}
