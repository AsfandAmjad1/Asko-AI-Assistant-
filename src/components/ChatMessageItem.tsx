import React, { useState } from "react";
import { ChatMessage, AIMode } from "../types";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { getActionsForIntentAndMode } from "../lib/intelligence";
import {
  Copy,
  Check,
  RotateCw,
  Volume2,
  VolumeX,
  FileText,
  Sparkles,
  User,
  Brain,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ChatMessageItemProps {
  message: ChatMessage;
  isLatestModelMessage: boolean;
  isGenerating: boolean;
  onRegenerate?: () => void;
  onActionClick: (action: string) => void;
  onSaveMemory?: (fact: string) => void;
  onAddToAskBoard?: (text: string) => void;
  pendingMemoryFact?: string | null;
  onDismissMemoryFact?: () => void;
}

export function ChatMessageItem({
  message,
  isLatestModelMessage,
  isGenerating,
  onRegenerate,
  onActionClick,
  onSaveMemory,
  onAddToAskBoard,
  pendingMemoryFact,
  onDismissMemoryFact,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const isUser = message.role === "user";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy message failed", err);
    }
  };

  const handleSpeak = () => {
    if (!("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in your browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Strip markdown characters for cleaner audio
    const plainText = message.text.replace(/[#*`_~[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Context-aware action buttons for this message
  const actions = message.suggestedActions || (message.intent
    ? getActionsForIntentAndMode(message.intent, message.mode || "general")
    : getActionsForIntentAndMode("question", message.mode || "general"));

  return (
    <div
      className={`py-4 sm:py-5 px-3 sm:px-6 transition-colors ${
        isUser
          ? "theme-bg-user-msg"
          : "theme-bg-model-msg border-y theme-border-subtle"
      }`}
    >
      <div className="max-w-4xl mx-auto flex gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-lg theme-bg-surface theme-text-secondary flex items-center justify-center border theme-border font-semibold text-xs shadow-sm">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-amber-500/20 select-none">
              <svg
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-slate-950 stroke-current"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7 25L16 6L25 25" />
                <path d="M10.5 19H21.5" />
                <circle cx="16" cy="14" r="1.8" fill="currentColor" stroke="none" />
              </svg>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row: Author + intent/mode badge + timestamp */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              <span className="font-semibold theme-text-primary">
                {isUser ? "You" : "Asko"}
              </span>

              {!isUser && message.mode && (
                <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono tracking-wider theme-bg-surface theme-text-accent border theme-border">
                  {message.mode}
                </span>
              )}

              {!isUser && message.intent && (
                <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                  {message.intent} intent
                </span>
              )}
            </div>

            <span className="text-[11px] theme-text-subtle font-mono flex-shrink-0">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Attached Files / Images if User Message */}
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              {message.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg theme-bg-surface border theme-border text-xs theme-text-secondary max-w-full sm:max-w-sm"
                >
                  {file.base64 ? (
                    <img
                      src={file.base64}
                      alt={file.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover border theme-border flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded theme-bg-input flex items-center justify-center text-amber-500 flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="truncate min-w-0 flex-1">
                    <p className="truncate font-medium theme-text-primary text-xs">
                      {file.name}
                    </p>
                    <p className="text-[10px] theme-text-subtle">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Text / Markdown */}
          {isUser ? (
            <div className="theme-text-primary text-[14px] sm:text-[15px] whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
              {message.text}
            </div>
          ) : (
            <div className="pt-0.5 max-w-full overflow-hidden">
              <MarkdownRenderer content={message.text} />
            </div>
          )}

          {/* AI Response Controls: Copy, Listen, Regenerate, Add to AskBoard */}
          {!isUser && !isGenerating && (
            <div className="pt-2 flex flex-wrap items-center gap-1.5 sm:gap-2 border-t theme-border-subtle text-xs theme-text-muted">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 min-h-[30px] rounded-lg hover:theme-bg-surface-hover hover:theme-text-primary transition-colors"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500 text-[11px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSpeak}
                className={`flex items-center gap-1 px-2.5 py-1 min-h-[30px] rounded-lg hover:theme-bg-surface-hover hover:theme-text-primary transition-colors ${
                  isSpeaking ? "text-amber-500 font-medium" : ""
                }`}
                title={isSpeaking ? "Stop listening" : "Listen to response"}
                aria-label={isSpeaking ? "Stop voice" : "Listen to response"}
              >
                {isSpeaking ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-[11px] text-amber-500">Stop Voice</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Listen</span>
                  </>
                )}
              </button>

              {isLatestModelMessage && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 px-2.5 py-1 min-h-[30px] rounded-lg hover:theme-bg-surface-hover hover:theme-text-primary transition-colors"
                  title="Regenerate this response"
                  aria-label="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Regenerate</span>
                </button>
              )}

              {onAddToAskBoard && (
                <button
                  onClick={() => onAddToAskBoard(message.text)}
                  className="flex items-center gap-1 px-2.5 py-1 min-h-[30px] rounded-lg hover:theme-bg-surface-hover theme-text-muted hover:theme-text-accent transition-colors"
                  title="Extract to AskBoard"
                  aria-label="Extract key points to AskBoard"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px]">To AskBoard</span>
                </button>
              )}
            </div>
          )}

          {/* Context-Aware Response Actions Row */}
          {!isUser && !isGenerating && actions.length > 0 && (
            <div className="pt-2">
              <div className="text-[11px] theme-text-muted font-medium mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Suggested Follow-up Actions:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {actions.map((act) => (
                  <button
                    key={act}
                    onClick={() => onActionClick(act)}
                    className="flex items-center gap-1 px-2.5 py-1.5 min-h-[32px] rounded-full text-xs theme-bg-surface hover:theme-bg-surface-hover theme-text-secondary hover:theme-text-primary border theme-border hover:border-amber-500/40 transition-all active:scale-95"
                  >
                    <span>{act}</span>
                    <ArrowRight className="w-3 h-3 theme-text-subtle" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* User-Controlled Memory Candidate Prompt Card */}
          {pendingMemoryFact && isLatestModelMessage && onSaveMemory && onDismissMemoryFact && (
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-300 font-medium text-xs">
                <Brain className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>Should Asko remember this?</span>
              </div>
              <p className="text-xs theme-text-secondary italic sm:pl-6 break-words [overflow-wrap:anywhere]">
                "{pendingMemoryFact}"
              </p>
              <div className="flex flex-wrap items-center gap-2 sm:pl-6 pt-1">
                <button
                  onClick={() => onSaveMemory(pendingMemoryFact)}
                  className="px-3 py-1.5 min-h-[32px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                >
                  Remember
                </button>
                <button
                  onClick={onDismissMemoryFact}
                  className="px-3 py-1.5 min-h-[32px] rounded-lg theme-bg-surface hover:theme-bg-surface-hover theme-text-secondary border theme-border text-xs transition-colors"
                >
                  Don't Remember
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
