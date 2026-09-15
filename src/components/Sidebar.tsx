import React, { useState } from "react";
import { Conversation, Project } from "../types";
import { AskoLogo } from "./AskoLogo";
import {
  Plus,
  Search,
  MessageSquare,
  Trash2,
  Edit2,
  Check,
  X,
  FolderKanban,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onOpenProjectModal: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDeleteConversation,
  onClearAllConversations,
  projects,
  activeProjectId,
  onSelectProject,
  onOpenProjectModal,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Filter conversations by search and active project
  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = !activeProjectId || c.projectId === activeProjectId;
    return matchesSearch && matchesProject;
  });

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const handleSaveRename = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] sm:w-72 md:w-64 lg:w-72 theme-bg-sidebar border-r theme-border flex flex-col transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none flex-shrink-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top brand & New Chat */}
        <div className="p-3 sm:p-3.5 border-b theme-border space-y-3">
          <div className="flex items-center justify-between">
            <AskoLogo size="md" showTagline={true} />
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="w-full min-h-[42px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-md shadow-amber-500/15 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Project Selector Bar */}
        <div className="px-3.5 py-2.5 border-b theme-border theme-bg-surface">
          <div className="flex items-center justify-between text-xs theme-text-muted mb-1.5">
            <span className="font-medium flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Project Workspace
            </span>
            <button
              onClick={onOpenProjectModal}
              className="text-[11px] text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium transition-colors"
            >
              Manage
            </button>
          </div>

          <select
            value={activeProjectId || ""}
            onChange={(e) => onSelectProject(e.target.value || null)}
            className="w-full px-2.5 py-1.5 rounded-lg theme-bg-input border theme-border-input theme-text-primary text-xs focus:outline-none focus:border-amber-500 transition-colors"
          >
            <option value="">All Projects / Global</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Conversations */}
        <div className="px-3.5 py-2 border-b theme-border-subtle">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 theme-text-subtle" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle text-xs focus:outline-none focus:border-amber-500/80 transition-colors"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          <div className="px-2 py-1 text-[11px] font-semibold theme-text-subtle uppercase tracking-wider">
            Conversations ({filteredConversations.length})
          </div>

          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-xs theme-text-muted">
              {searchQuery ? "No matching conversations." : "No conversations yet. Start a new chat!"}
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isActive = c.id === activeConversationId;
              const isEditing = c.id === editingId;

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    onSelectConversation(c.id);
                    onCloseMobile();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs transition-all ${
                    isActive
                      ? "theme-bg-surface-elevated theme-text-primary font-medium border theme-border-strong shadow-sm"
                      : "theme-text-secondary hover:theme-bg-surface hover:theme-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <MessageSquare
                      className={`w-3.5 h-3.5 flex-shrink-0 ${
                        isActive ? "text-amber-500 dark:text-amber-400" : "theme-text-subtle group-hover:theme-text-muted"
                      }`}
                    />

                    {isEditing ? (
                      <form
                        onSubmit={(e) => handleSaveRename(c.id, e)}
                        className="flex items-center gap-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          autoFocus
                          className="w-full px-1.5 py-0.5 rounded theme-bg-input border border-amber-500 text-xs theme-text-primary focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="p-1 text-emerald-500 hover:text-emerald-400"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelRename}
                          className="p-1 theme-text-muted hover:theme-text-primary"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <span className="truncate">{c.title}</span>
                    )}
                  </div>

                  {/* Actions (visible on mobile/tablet or hover on desktop) */}
                  {!isEditing && (
                    <div className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 flex items-center gap-1 transition-opacity flex-shrink-0">
                      <button
                        onClick={(e) => startRename(c, e)}
                        className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center theme-text-muted hover:theme-text-primary rounded hover:theme-bg-surface-hover"
                        title="Rename"
                        aria-label="Rename conversation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        className="p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center theme-text-muted hover:text-rose-500 rounded hover:theme-bg-surface-hover"
                        title="Delete"
                        aria-label="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Bottom footer: Clear history + Creator credit */}
        <div className="p-3 border-t theme-border theme-bg-sidebar-footer space-y-2.5">
          {conversations.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-300 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Clear all chats?</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => {
                        onClearAllConversations();
                        setShowClearConfirm(false);
                      }}
                      className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px]"
                    >
                      Yes, Clear
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-2.5 py-1 rounded theme-bg-surface hover:theme-bg-surface-hover theme-text-secondary text-[11px] border theme-border"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Conversation History</span>
                </button>
              )}
            </div>
          )}

          {/* Attribution */}
          <div className="pt-1 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] theme-text-muted">
              Created by <strong className="theme-text-primary font-medium">Asfand Amjad</strong>
            </span>
            <span className="text-[10px] theme-text-subtle font-mono">
              Powered by Google Gemini
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
