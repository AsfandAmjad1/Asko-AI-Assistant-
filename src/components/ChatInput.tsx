import React, { useRef, useState, useEffect } from "react";
import { Attachment, AIMode } from "../types";
import { getModeConfig } from "../lib/modes";
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  X,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ChatInputProps {
  onSendMessage: (text: string, files: Attachment[]) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  currentMode: AIMode;
  disabled?: boolean;
}

export function ChatInput({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  currentMode,
  disabled = false,
}: ChatInputProps) {
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const modeConfig = getModeConfig(currentMode);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === "not-allowed") {
          setErrorMessage("Microphone permission was denied.");
          setTimeout(() => setErrorMessage(null), 4000);
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn("Speech recognition initialization failed", e);
      setSpeechSupported(false);
    }
  }, []);

  const toggleRecording = () => {
    if (!speechSupported) {
      setErrorMessage("Speech recognition is not supported in this browser.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Failed to start speech recognition", err);
        setIsRecording(false);
      }
    }
  };

  // Adjust textarea height dynamically
  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [inputText]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if ((inputText.trim() || attachments.length > 0) && !isGenerating && !disabled) {
      onSendMessage(inputText.trim(), attachments);
      setInputText("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  // Handle File Uploads (Images and Documents)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isImage = file.type.startsWith("image/");

      if (isImage) {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          base64,
        });
      } else {
        // Read as text for documents, code, logs, markdown, json, csv
        const textContent = await fileToText(file);
        newAttachments.push({
          id: `att-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type || "text/plain",
          textContent,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-2 sm:pb-4 pt-1 sm:pt-2">
      {/* Error message toast */}
      {errorMessage && (
        <div className="mb-2 p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="break-words">{errorMessage}</span>
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-2xl theme-bg-input border theme-border-input shadow-xl focus-within:border-amber-500/80 transition-all">
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2.5 sm:p-3 border-b theme-border-subtle max-h-32 overflow-y-auto">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 p-1.5 rounded-lg theme-bg-surface border theme-border text-xs theme-text-secondary max-w-[calc(100%-8px)] sm:max-w-xs"
              >
                {att.base64 ? (
                  <img
                    src={att.base64}
                    alt={att.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded theme-bg-input flex items-center justify-center text-amber-500 flex-shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1 truncate">
                  <p className="truncate font-medium theme-text-primary text-xs">{att.name}</p>
                  <p className="text-[10px] theme-text-subtle">
                    {(att.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center rounded-full theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors flex-shrink-0"
                  aria-label="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Textarea */}
        <div className="p-2 sm:p-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={modeConfig.promptPlaceholder}
            disabled={disabled}
            className="w-full bg-transparent theme-text-primary placeholder:theme-text-subtle text-sm sm:text-base focus:outline-none resize-none leading-relaxed max-h-[180px] min-h-[40px] sm:min-h-[44px]"
          />
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between px-2 sm:px-3 pb-2 pt-1 border-t theme-border-subtle">
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Attach button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors flex-shrink-0"
              title="Attach image or document"
              aria-label="Attach image or document"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Input (Microphone) button */}
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
                isRecording
                  ? "bg-rose-500 text-white animate-pulse"
                  : "theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover"
              }`}
              title={
                isRecording
                  ? "Listening... Click to stop"
                  : "Speak to Asko (Speech-to-text)"
              }
              aria-label="Voice input"
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Active Mode indicator badge */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md theme-bg-surface border theme-border text-[11px] theme-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>{modeConfig.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl theme-bg-surface hover:theme-bg-surface-hover text-amber-600 dark:text-amber-300 font-medium text-xs border border-amber-500/30 transition-all"
                title="Stop generation"
                aria-label="Stop generating response"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!inputText.trim() && attachments.length === 0}
                className={`p-2 sm:px-3.5 sm:py-1.5 min-h-[36px] rounded-xl flex items-center justify-center gap-1.5 font-semibold text-xs transition-all ${
                  inputText.trim() || attachments.length > 0
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95"
                    : "theme-bg-surface theme-text-subtle cursor-not-allowed border theme-border-subtle"
                }`}
                title="Send message (Enter)"
                aria-label="Send message"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-1 sm:mt-1.5 text-center">
        <span className="text-[10px] sm:text-[11px] theme-text-subtle">
          Asko may make mistakes. Verify critical facts and code.
        </span>
      </div>
    </div>
  );
}
