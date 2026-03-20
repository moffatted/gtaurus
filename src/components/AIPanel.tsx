/**
 * @file AIPanel.tsx
 * @purpose Provides a chat interface for AI-assisted G-code generation and machine troubleshooting.
 */
import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Trash2, Code, Command, Sparkles, Search, Activity, ExternalLink } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useMachineStatusStore } from "../stores/machineStatusStore";
import { useUIStore } from "../stores/uiStore";
import { useHelpStore } from "../stores/helpStore";
import { transport } from '../services/transportService';
import { getCommandSuggestions, parseSlashCommand, resolveSlashCommand, type CommandCard } from '../utils/aiCommandRouter';

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  isError?: boolean;
  includeInAiHistory?: boolean;
  aiContent?: string;
  commandCard?: CommandCard;
}

interface AIPanelProps {
  hideHeader?: boolean;
}

const COMMAND_CHIPS = [
  { label: "/help", value: "/help ", icon: Search },
  { label: "/status", value: "/status", icon: Activity },
  { label: "/settings", value: "/settings probe", icon: Command },
  { label: "/open", value: "/open tool library", icon: ExternalLink },
  { label: "/diagnose", value: "/diagnose probe fails after connect", icon: Sparkles },
];

export function AIPanel({ hideHeader }: AIPanelProps) {
  const { settings } = useSettingsStore();
  const { machine } = useMachineStatusStore();
  const openHelp = useHelpStore((state) => state.open);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "model",
      content:
        "Hello! I'm your AI CNC companion. Use /commands to see local and grounded slash commands, or ask a normal question.",
      includeInAiHistory: false,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const liveParsedCommand = parseSlashCommand(input);
  const liveCommandResult = liveParsedCommand
    ? resolveSlashCommand(liveParsedCommand, { settings, machine })
    : null;
  const commandSuggestions = getCommandSuggestions(input);

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

    const trimmedInput = input.trim();
    const parsedCommand = parseSlashCommand(trimmedInput);
    const commandResult = parsedCommand
      ? resolveSlashCommand(parsedCommand, { settings, machine })
      : null;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
      includeInAiHistory: commandResult?.kind === 'hybrid' || !commandResult,
      aiContent: commandResult?.kind === 'hybrid' ? commandResult.userPrompt : trimmedInput,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    if (commandResult?.kind === 'local') {
      if (commandResult.action) {
        runCommandAction(commandResult.action);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-local`,
          role: 'model',
          content: commandResult.card ? '' : commandResult.response,
          includeInAiHistory: false,
          commandCard: commandResult.card,
        },
      ]);
      return;
    }

    if (commandResult?.kind === 'unknown') {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-unknown`,
          role: 'model',
          content: commandResult.response,
          isError: true,
          includeInAiHistory: false,
        },
      ]);
      return;
    }

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
        .filter((m) => m.includeInAiHistory !== false)
        .map(m => ({
          role: m.role,
          parts: [{ text: m.aiContent ?? m.content }]
        }));

      const reply = await transport.invoke<string>("ask_ai", {
        messages: history.length > 0 ? history : [{ role: "user", parts: [{ text: userMsg.aiContent ?? userMsg.content }] }],
        machineContext,
        aiTier: settings.ai.tier,
        apiKey: settings.ai.apiKey,
        freeModel: settings.ai.freeModel,
        proModel: settings.ai.proModel,
        localModel: settings.ai.localModel,
        localBaseUrl: settings.ai.localBaseUrl,
        localApiKey: settings.ai.localApiKey,
        conciseMode: settings.ai.conciseMode,
        localContext: commandResult?.kind === 'hybrid' ? commandResult.localContext : null,
      });


      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          content: reply,
          commandCard: commandResult?.kind === 'hybrid' ? commandResult.relatedCard : undefined,
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

  const activeModelName = settings.ai.tier === 'free' 
    ? settings.ai.freeModel
    : settings.ai.tier === 'pro'
      ? settings.ai.proModel
      : settings.ai.localModel;

  const commandModeLabel = !liveParsedCommand
    ? 'Chat'
    : liveCommandResult?.kind === 'local'
      ? 'Local'
      : liveCommandResult?.kind === 'hybrid'
        ? 'Grounded AI'
        : 'Unknown';

  const commandSummary = !liveParsedCommand
    ? 'Use slash commands for local help, settings, status, and grounded AI flows.'
    : liveCommandResult?.kind === 'local'
      ? `/${liveParsedCommand.name} will run locally without an LLM call.`
      : liveCommandResult?.kind === 'hybrid'
        ? `/${liveParsedCommand.name} will search local product context, then send a grounded request to the AI.`
        : `/${liveParsedCommand.name} is not recognized. Try /commands.`;

  const insertCommand = (value: string) => {
    setInput(value);
  };

  const runCommandAction = (action: NonNullable<CommandCard['items']>[number]['action']) => {
    if (!action) return;
    if (action.type === 'openSettings') {
      useUIStore.getState().openSettings(action.tab, action.section);
      return;
    }
    if (action.type === 'openHelp') {
      openHelp(action.topicId);
      return;
    }
    if (action.type === 'openWindow') {
      const ui = useUIStore.getState();
      if (action.windowId === 'aiAssistant') ui.openAIAssistant();
      if (action.windowId === 'fluidNCManager') ui.openFluidNCManager();
      if (action.windowId === 'machineStats') ui.openMachineStats();
      if (action.windowId === 'toolChanger') ui.openToolChanger();
      if (action.windowId === 'toolLibrary') ui.openToolLibrary();
      if (action.windowId === 'cameraViewer') ui.openCameraViewer();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-primary)] border-l border-[var(--border-color)]">
      {/* Header */}
      {!hideHeader && (
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center border border-[var(--accent-primary)]/20">
              <Code className="w-4 h-4 text-[var(--accent-primary)]" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-tight">AI Assistant</h2>
              <div className="flex items-center gap-1.5">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider">{settings.ai.tier} Model Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className={`p-1.5 rounded-md transition-colors ${showDebug ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]'}`}
              title="Toggle Debug Context"
            >
              <Bot className="w-3.5 h-3.5" />
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
                className={`px-3.5 py-2 rounded-xl text-sm leading-relaxed whitespace-pre-wrap break-words select-text ${
                  msg.role === "user"
                    ? "bg-[var(--accent-primary)] text-white rounded-tr-sm shadow-md"
                    : msg.isError
                    ? "bg-red-500/15 text-red-400 border border-red-500/30 rounded-tl-sm shadow-sm"
                    : "bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.commandCard ? (
                  <div className="space-y-3 min-w-[260px]">
                    {msg.content && (
                      <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    )}

                    <div>
                      {msg.commandCard.eyebrow && (
                        <div className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[var(--text-tertiary)] mb-1">
                          {msg.commandCard.eyebrow}
                        </div>
                      )}
                      <div className="text-sm font-semibold text-[var(--text-primary)]">
                        {msg.commandCard.title}
                      </div>
                      {msg.commandCard.summary && (
                        <div className="text-xs text-[var(--text-secondary)] mt-1">
                          {msg.commandCard.summary}
                        </div>
                      )}
                    </div>

                    {msg.commandCard.items && msg.commandCard.items.length > 0 && (
                      <div className="space-y-2">
                        {msg.commandCard.items.map((item) => (
                          <div
                            key={`${msg.id}-${item.label}`}
                            className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)]/55 px-3 py-2"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--text-primary)]">
                                  {item.label}
                                </div>
                                {item.detail && (
                                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 whitespace-normal">
                                    {item.detail}
                                  </div>
                                )}
                              </div>
                              {item.action && item.actionLabel && (
                                <button
                                  type="button"
                                  onClick={() => runCommandAction(item.action)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-[var(--accent-primary)]/25 bg-[var(--accent-primary)]/10 text-[11px] font-medium text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/15 transition-colors flex-shrink-0"
                                >
                                  {item.actionLabel}
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.commandCard.footer && (
                      <div className="text-[11px] text-[var(--text-tertiary)] border-t border-[var(--border-color)] pt-2 whitespace-normal">
                        {msg.commandCard.footer}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {msg.isError && <span className="font-bold mr-1.5">Error:</span>}
                    {msg.content}
                  </>
                )}
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
        <div className="mb-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-tertiary)]/80 px-2.5 py-2 shadow-inner">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                <Command className="w-3.5 h-3.5 text-[var(--accent-primary)]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-tertiary)]">Command Context</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-[0.14em] ${
                    commandModeLabel === 'Grounded AI'
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20'
                      : commandModeLabel === 'Local'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
                        : commandModeLabel === 'Unknown'
                          ? 'bg-red-500/15 text-red-300 border border-red-500/20'
                          : 'bg-[var(--bg-primary)] text-[var(--text-tertiary)] border border-[var(--border-color)]'
                  }`}>
                    {commandModeLabel}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] truncate mt-0.5">
                  {commandSummary}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => insertCommand('/commands')}
              className="px-2 py-1 text-[10px] font-semibold rounded-md border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-primary)] transition-colors flex-shrink-0"
            >
              /commands
            </button>
          </div>

          <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
            {COMMAND_CHIPS.map(({ label, value, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => insertCommand(value)}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-1 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[10px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--bg-primary)] transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {commandSuggestions.length > 0 && (
            <div className="mt-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-secondary)] overflow-hidden">
              {commandSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => insertCommand(suggestion.template)}
                  className="w-full px-2.5 py-2 text-left hover:bg-[var(--bg-primary)] transition-colors border-b last:border-b-0 border-[var(--border-color)]/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-semibold text-[var(--text-primary)]">
                      {suggestion.label}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] truncate">
                      {suggestion.template}
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                    {suggestion.summary}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

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
            placeholder={machine.status === 'Disconnected' ? "Machine disconnected. AI context will be limited..." : "Ask the AI about feeds, speeds, or G-Code..."}
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
        <div className="text-[9px] text-center text-[var(--text-tertiary)] mt-2 font-medium tracking-wide uppercase">
          {activeModelName}
        </div>
      </div>
    </div>
  );
}
