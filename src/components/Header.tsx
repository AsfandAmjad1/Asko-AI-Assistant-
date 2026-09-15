import React, { useState } from "react";
import { AskoLogo } from "./AskoLogo";
import { AIMode, Project } from "../types";
import { AI_MODES, getModeConfig } from "../lib/modes";
import { useTheme } from "../context/ThemeContext";
import {
  Menu,
  Shield,
  Layers,
  Sparkles,
  Settings as SettingsIcon,
  ChevronDown,
  Brain,
  FolderKanban,
  Sun,
  Moon,
  Check,
  X,
} from "lucide-react";

interface HeaderProps {
  currentMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  activeProject: Project | null;
  onOpenProjectModal: () => void;
  isPrivateMode: boolean;
  onTogglePrivateMode: () => void;
  isAskBoardOpen: boolean;
  onToggleAskBoard: () => void;
  askBoardCount: number;
  memoryEnabled: boolean;
  onOpenMemoryModal: () => void;
  onOpenSettings: () => void;
  onToggleMobileSidebar: () => void;
}

export function Header({
  currentMode,
  onModeChange,
  activeProject,
  onOpenProjectModal,
  isPrivateMode,
  onTogglePrivateMode,
  isAskBoardOpen,
  onToggleAskBoard,
  askBoardCount,
  memoryEnabled,
  onOpenMemoryModal,
  onOpenSettings,
  onToggleMobileSidebar,
}: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const activeModeConfig = getModeConfig(currentMode);
  const ModeIcon = activeModeConfig.icon;

  return (
    <header className="h-14 border-b theme-border-subtle theme-bg-header backdrop-blur-md px-2 sm:px-4 flex items-center justify-between z-30 select-none max-w-full">
      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
        {/* Menu button for mobile drawer and tablet sidebar toggle */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-1.5 sm:p-2 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors flex-shrink-0"
          aria-label="Toggle sidebar navigation"
          title="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and Tagline */}
        <div className="flex-shrink-0">
          <AskoLogo size="sm" showTagline={false} hideBadgeOnMobile={true} />
        </div>

        {/* Project Selector Badge (visible on tablet/desktop) */}
        <button
          onClick={onOpenProjectModal}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium theme-bg-surface hover:theme-bg-surface-hover theme-text-secondary border theme-border transition-colors flex-shrink-0"
          title="Switch or manage project workspaces"
        >
          <FolderKanban className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="max-w-[100px] lg:max-w-[140px] truncate">
            {activeProject ? activeProject.name : "Default Project"}
          </span>
          <ChevronDown className="w-3 h-3 theme-text-muted" />
        </button>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Mode Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-semibold border min-h-[34px] sm:min-h-[36px] transition-all ${activeModeConfig.accentBg} shadow-2xs`}
            title={`Active Mode: ${activeModeConfig.name} (Tap to change)`}
            aria-label={`Current AI mode: ${activeModeConfig.name}. Tap to change.`}
            aria-expanded={isModeDropdownOpen}
          >
            <ModeIcon className={`w-3.5 h-3.5 ${activeModeConfig.color} flex-shrink-0`} />
            <span className="theme-text-primary text-xs font-semibold truncate max-w-[65px] xs:max-w-[85px] sm:max-w-none">
              {activeModeConfig.name}
            </span>
            <ChevronDown className="w-3 h-3 theme-text-muted flex-shrink-0" />
          </button>

          {isModeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none"
                onClick={() => setIsModeDropdownOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-1.5 sm:w-68 sm:max-w-xs z-50 rounded-2xl sm:rounded-xl theme-bg-dropdown border theme-border shadow-2xl p-2.5 sm:p-2 max-h-[calc(100dvh-5rem)] sm:max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-1.5 border-b theme-border-subtle px-1">
                  <div>
                    <div className="text-xs font-bold theme-text-primary uppercase tracking-wider">
                      Select AI Mode
                    </div>
                    <div className="text-[11px] theme-text-muted">
                      Tailored intelligence & style
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModeDropdownOpen(false)}
                    className="p-1 rounded-md theme-text-muted hover:theme-text-primary hover:theme-bg-surface transition-colors"
                    aria-label="Close mode menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1">
                  {AI_MODES.map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = mode.id === currentMode;
                    return (
                      <button
                        key={mode.id}
                        onClick={() => {
                          onModeChange(mode.id);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full flex items-start gap-2.5 p-2 rounded-xl sm:rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-amber-500/15 border border-amber-500/40 theme-text-primary font-medium"
                            : "theme-text-secondary hover:theme-bg-surface-hover hover:theme-text-primary border border-transparent"
                        }`}
                      >
                        <div
                          className={`p-1.5 rounded-lg ${
                            isSelected ? "bg-amber-500/25" : "theme-bg-surface"
                          } flex-shrink-0 mt-0.5`}
                        >
                          <Icon className={`w-4 h-4 ${mode.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-semibold text-xs sm:text-sm theme-text-primary truncate">
                              {mode.name}
                            </span>
                            {isSelected && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-500 flex-shrink-0">
                                <Check className="w-3.5 h-3.5" />
                                <span>Active</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] theme-text-muted font-normal leading-snug mt-0.5">
                            {mode.shortDesc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile Quick Toggles Footer */}
                <div className="mt-2 pt-2 border-t theme-border-subtle flex items-center justify-between text-xs px-1 sm:hidden">
                  <div className="flex items-center gap-1.5">
                    <span className="theme-text-muted text-[11px]">Private:</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePrivateMode();
                      }}
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition-colors ${
                        isPrivateMode
                          ? "bg-rose-500/15 text-rose-500 border-rose-500/30 font-semibold"
                          : "theme-bg-surface theme-text-muted border theme-border"
                      }`}
                    >
                      {isPrivateMode ? "Active" : "Off"}
                    </button>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsModeDropdownOpen(false);
                      onOpenMemoryModal();
                    }}
                    className="text-[11px] text-amber-600 dark:text-amber-400 font-medium hover:underline"
                  >
                    Memory: {memoryEnabled ? "Active" : "Off"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Private Mode Toggle (always visible on sm+, and on mobile when active) */}
        <button
          onClick={onTogglePrivateMode}
          className={`items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium border min-h-[34px] sm:min-h-[36px] transition-all ${
            isPrivateMode
              ? "flex bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/40 shadow-xs shadow-rose-500/10"
              : "hidden sm:flex theme-bg-surface theme-text-muted border theme-border hover:theme-text-primary"
          }`}
          title={
            isPrivateMode
              ? "Private Mode is ON: conversations & memories are not persisted."
              : "Enable Private Mode (no conversation history or memory will be saved)"
          }
        >
          <Shield className={`w-3.5 h-3.5 flex-shrink-0 ${isPrivateMode ? "text-rose-500" : "theme-text-muted"}`} />
          <span className="hidden sm:inline">
            {isPrivateMode ? "Private" : "Normal"}
          </span>
        </button>

        {/* AskBoard Drawer Toggle */}
        <button
          onClick={onToggleAskBoard}
          className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-medium border min-h-[34px] sm:min-h-[36px] transition-all ${
            isAskBoardOpen
              ? "theme-bg-accent-light theme-text-accent border-theme-accent"
              : "theme-bg-surface theme-text-secondary border theme-border hover:theme-text-primary hover:theme-bg-surface-hover"
          }`}
          title="Open AskBoard (Action items, decisions & notes)"
        >
          <Layers className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <span className="hidden md:inline">AskBoard</span>
          {askBoardCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 flex-shrink-0">
              {askBoardCount}
            </span>
          )}
        </button>

        {/* Memory status indicator (visible on md+) */}
        <button
          onClick={onOpenMemoryModal}
          className={`hidden md:flex p-2 min-w-[36px] min-h-[36px] items-center justify-center rounded-lg border transition-colors ${
            memoryEnabled
              ? "text-amber-500 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
              : "theme-text-muted theme-border border hover:theme-text-primary hover:theme-bg-surface-hover"
          }`}
          title={memoryEnabled ? "Memory active: view or manage saved memories" : "Memory is disabled"}
          aria-label="Manage memories"
        >
          <Brain className="w-4 h-4" />
        </button>

        {/* Theme Toggle Button (Dark / Light) */}
        <button
          onClick={toggleTheme}
          className="p-1.5 sm:p-2 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg border theme-border theme-bg-surface hover:theme-bg-surface-hover transition-colors"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700 hover:text-slate-900" />
          )}
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 min-w-[34px] min-h-[34px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors"
          title="Settings & About Asko"
          aria-label="Open settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
