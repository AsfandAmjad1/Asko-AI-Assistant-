import React from "react";
import { AppSettings, AIMode } from "../types";
import { AI_MODES } from "../lib/modes";
import { AskoLogo } from "./AskoLogo";
import { useTheme } from "../context/ThemeContext";
import {
  X,
  Settings as SettingsIcon,
  Moon,
  Sun,
  Shield,
  Brain,
  Trash2,
  Download,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearAllConversations: () => void;
  onExportData: () => void;
  onOpenMemoryModal: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearAllConversations,
  onExportData,
  onOpenMemoryModal,
}: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  if (!isOpen) return null;

  const handleSelectTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl theme-bg-modal border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b theme-border flex items-center justify-between theme-bg-modal-header">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-base theme-text-primary">Settings</h2>
              <p className="text-xs theme-text-muted">Preferences, controls & about</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover flex-shrink-0"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto space-y-4 sm:space-y-5 text-xs">
          {/* Theme setting */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b theme-border-subtle">
            <div>
              <div className="font-semibold theme-text-primary text-sm">Theme</div>
              <div className="theme-text-muted mt-0.5">Interface color appearance</div>
            </div>
            <div className="flex gap-1 p-1 rounded-xl theme-bg-surface border theme-border">
              <button
                onClick={() => handleSelectTheme("dark")}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg transition-colors ${
                  theme === "dark"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "theme-text-muted hover:theme-text-primary"
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleSelectTheme("light")}
                className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-lg transition-colors ${
                  theme === "light"
                    ? "bg-amber-500 text-slate-950 font-semibold"
                    : "theme-text-muted hover:theme-text-primary"
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
            </div>
          </div>

          {/* Default Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b theme-border-subtle">
            <div>
              <div className="font-semibold theme-text-primary text-sm">Default AI Mode</div>
              <div className="theme-text-muted mt-0.5">Initial mode for new chats</div>
            </div>
            <select
              value={settings.defaultMode}
              onChange={(e) => onUpdateSettings({ defaultMode: e.target.value as AIMode })}
              className="px-3 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
            >
              {AI_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Private Mode Toggle */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b theme-border-subtle">
            <div className="pr-2">
              <div className="font-semibold theme-text-primary text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <span>Private Mode</span>
              </div>
              <div className="theme-text-muted mt-0.5">
                Do not persist conversation history or save long-term memories
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ privateMode: !settings.privateMode })}
              className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
                settings.privateMode ? "bg-rose-500" : "theme-bg-surface-active"
              }`}
              aria-label="Toggle private mode"
            >
              <span
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.privateMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Memory ON/OFF */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b theme-border-subtle">
            <div className="pr-2">
              <div className="font-semibold theme-text-primary text-sm flex items-center gap-1.5">
                <Brain className="w-4 h-4 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                <span>Memory Assistance</span>
              </div>
              <div className="theme-text-muted mt-0.5">
                Suggest and recall user-confirmed durable preferences
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onOpenMemoryModal}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-500 underline underline-offset-2 text-xs p-1"
              >
                Manage
              </button>
              <button
                onClick={() => onUpdateSettings({ memoryEnabled: !settings.memoryEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 ${
                  settings.memoryEnabled ? "bg-amber-500" : "theme-bg-surface-active"
                }`}
                aria-label="Toggle memory assistance"
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.memoryEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Data & History Actions */}
          <div className="space-y-2 pb-3 border-b theme-border-subtle">
            <div className="font-semibold theme-text-primary text-sm">Data & Backup</div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg theme-bg-surface hover:theme-bg-surface-hover border theme-border theme-text-primary text-xs font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Export All Data (JSON)</span>
              </button>

              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear all conversation history?")) {
                    onClearAllConversations();
                  }
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 min-h-[36px] rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            </div>
          </div>

          {/* About Asko Section */}
          <div className="p-3.5 sm:p-4 rounded-xl theme-bg-surface border theme-border space-y-2.5">
            <div className="flex items-center justify-between">
              <AskoLogo size="sm" showTagline={true} />
              <span className="text-[10px] font-mono theme-text-subtle">v1.0.0 Pro</span>
            </div>

            <p className="theme-text-secondary leading-relaxed text-xs">
              Asko is an intelligent AI assistant designed to help users think, learn, create,
              analyze and solve problems through natural conversation.
            </p>

            <div className="pt-2 border-t theme-border-subtle flex flex-wrap items-center justify-between gap-1 text-[11px] theme-text-muted">
              <span>
                Built by <strong className="theme-text-primary font-semibold">Asfand Amjad</strong>
              </span>
              <span className="font-mono text-amber-600 dark:text-amber-400">Powered by Google Gemini</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
