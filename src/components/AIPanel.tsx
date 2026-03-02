/**
 * @file AIPanel.tsx
 * @purpose Provides a chat interface for AI-assisted G-code generation and machine troubleshooting.
 */
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, Code } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useMachineStatusStore } from "../stores/machineStatusStore";
import { transport } from '../services/transportService';

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  isError?: boolean;
}

interface AIPanelProps {
  hideHeader?: boolean;
}

export function AIPanel({ hideHeader }: AIPanelProps) {
  const { settings } = useSettingsStore();
  const { machine } = useMachineStatusStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content:
        "Hello! I'm your AI CNC companion. How can I help you with your machining tasks today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Create simplified machine context
      const machineContext = JSON.stringify({
        settings: {
          general: settings.general,
          spindle: settings.spindle,
          probe: settings.probe,
        },
        machine: machine,
      }, null, 2);

      // Translate history
      const history = [...messages, userMsg]
        // Filter out initial greeting if needed, or translate directly
        .filter(m => m.id !== "1") // filter greeting for token savings if desired, optional
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }));

      const reply = await transport.invoke<string>("ask_gemini", {
        messages: history.length > 0 ? history : [{ role: "user", parts: [{ text: userMsg.content }] }],
        machineContext,
        aiTier: settings.ai.tier,
        apiKey: settings.ai.apiKey,
        freeModel: settings.ai.freeModel,
        proModel: settings.ai.proModel,
        conciseMode: settings.ai.conciseMode,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          content: reply,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          content: `${err}`,
          isError: true,
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {

    if (window.confirm("Are you sure you want to clear the chat history?")) {
      setMessages([
        {
          id: Date.now().toString(),
          role: "model",
          content: "Chat cleared. What's next?",
        },
      ]);
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-[var(--bg-primary)] ${!hideHeader ? 'border border-[var(--border-color)] rounded-lg' : ''} overflow-hidden`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-[var(--accent-primary)]" />
            <span className="text-xs font-semibold text-[var(--text-primary)]">
              AI Assistant
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-1.5 rounded-md transition-colors ${showDebug ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
              title="Toggle Debug Context"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={clearChat}
              className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger-color)] hover:bg-[var(--danger-color)]/10 rounded-md transition-colors"
              title="Clear Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {msg.role === "user" ? (
                  <div className="w-6 h-6 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center border border-[var(--border-color)]">
                    <User className="w-3 h-3 text-[var(--text-secondary)]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20 shadow-sm shadow-[var(--accent-primary)]/10">
                    <Bot className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div
                className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)] text-white rounded-tr-sm shadow-md"
                    : msg.isError
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 rounded-tl-sm shadow-sm"
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.isError && <span className="font-bold mr-1.5">Error:</span>}
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="flex-shrink-0 mt-1">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
                  <Bot className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
                </div>
              </div>
              <div className="px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl rounded-tl-sm flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="w-1.5 h-1.5 bg-[var(--text-tertiary)] rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Debug Context Viewer */}
      {showDebug && (
        <div className="mx-3 mb-3 p-3 bg-black/40 rounded-lg border border-[var(--border-color)] overflow-hidden flex flex-col max-h-[200px]">
          <div className="flex justify-between items-center mb-2">
             <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Outgoing Machine Context</span>
             <span className="text-[9px] text-[var(--accent-primary)] font-mono">JSON Snapshot</span>
          </div>
          <pre className="text-[10px] font-mono text-blue-300 overflow-auto custom-scrollbar p-2 bg-black/20 rounded">
            {JSON.stringify({
              settings: {
                general: settings.general,
                spindle: settings.spindle,
                probe: settings.probe,
              },
              machine: machine,
            }, null, 2)}
          </pre>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] flex-shrink-0">
        <form
          onSubmit={handleSubmit}
          className={`flex items-end gap-2 bg-[var(--bg-tertiary)] border transition-all rounded-lg p-1.5 shadow-inner ${
            machine.status === 'Disconnected' 
              ? 'border-yellow-500/30' 
              : 'border-[var(--border-color)] focus-within:border-[var(--accent-primary)] focus-within:ring-1 focus-within:ring-[var(--accent-primary)]'
          }`}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={machine.status === 'Disconnected' ? "Machine disconnected. AI context will be limited..." : "Ask Gemini about feeds, speeds, or G-Code..."}
            className={`flex-1 max-h-32 min-h-[40px] bg-transparent resize-none outline-none text-sm px-2 py-2 ${
                machine.status === 'Disconnected' ? 'text-yellow-200/50 placeholder:text-yellow-500/40' : 'text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]'
            }`}
            rows={1}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`flex-shrink-0 p-2 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-0.5 mr-0.5 ${
                machine.status === 'Disconnected' ? 'bg-yellow-600/50 hover:bg-yellow-600/70' : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[9px] text-center text-[var(--text-tertiary)] mt-2 font-medium tracking-wide">
          Powered by Google Gemini API
        </div>
      </div>
    </div>
  );
}
