import React, { useState } from "react";
import { AskBoardItem } from "../types";
import {
  X,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Download,
  Copy,
  Check,
  Calendar,
  Sparkles,
  HelpCircle,
  FileText,
  BookmarkCheck,
  AlertCircle,
  Tag,
} from "lucide-react";

interface AskBoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: AskBoardItem[];
  onToggleComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: (item: Omit<AskBoardItem, "id" | "createdAt">) => void;
  onExtractFromConversation: () => void;
  isExtracting: boolean;
  currentConversationTitle?: string;
}

export function AskBoardDrawer({
  isOpen,
  onClose,
  items,
  onToggleComplete,
  onDeleteItem,
  onAddItem,
  onExtractFromConversation,
  isExtracting,
  currentConversationTitle,
}: AskBoardDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "action" | "decision" | "keyPoint" | "question" | "note"
  >("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // New item form state
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<AskBoardItem["type"]>("action");
  const [newDeadline, setNewDeadline] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (activeTab === "all") return true;
    return item.type === activeTab;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddItem({
      type: newType,
      title: newTitle.trim(),
      deadline: newDeadline.trim() || undefined,
      priority: newPriority,
      completed: false,
    });

    setNewTitle("");
    setNewDeadline("");
    setShowAddForm(false);
  };

  const handleCopyMarkdown = async () => {
    try {
      const lines = ["# Asko AskBoard Summary", ""];
      const actions = items.filter((i) => i.type === "action");
      if (actions.length) {
        lines.push("## Action Items");
        actions.forEach((a) => {
          lines.push(
            `- [${a.completed ? "x" : " "}] ${a.title}${a.deadline ? ` (Due: ${a.deadline})` : ""}`
          );
        });
        lines.push("");
      }

      const decisions = items.filter((i) => i.type === "decision");
      if (decisions.length) {
        lines.push("## Decisions");
        decisions.forEach((d) => lines.push(`- ${d.title}`));
        lines.push("");
      }

      const keyPoints = items.filter((i) => i.type === "keyPoint");
      if (keyPoints.length) {
        lines.push("## Key Points");
        keyPoints.forEach((k) => lines.push(`- ${k.title}`));
        lines.push("");
      }

      const questions = items.filter((i) => i.type === "question");
      if (questions.length) {
        lines.push("## Open Questions");
        questions.forEach((q) => lines.push(`- ${q.title}`));
        lines.push("");
      }

      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] max-w-full theme-bg-modal border-l theme-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b theme-border flex items-center justify-between theme-bg-modal-header">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base theme-text-primary">AskBoard</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/20 theme-text-accent border border-amber-500/30">
                Workspace
              </span>
            </div>
            <p className="text-xs theme-text-muted mt-0.5">
              Structured action items, decisions & key insights
            </p>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={handleCopyMarkdown}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors"
              title="Copy as Markdown"
              aria-label="Copy as Markdown"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover transition-colors"
              aria-label="Close AskBoard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Bar: Extract from AI & Manual Add */}
        <div className="p-2.5 sm:p-3 border-b theme-border flex items-center gap-2 theme-bg-surface">
          <button
            onClick={onExtractFromConversation}
            disabled={isExtracting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 min-h-[40px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${isExtracting ? "animate-spin" : ""}`} />
            <span className="truncate">{isExtracting ? "Extracting..." : "Extract from Chat"}</span>
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 py-2 px-3 min-h-[40px] rounded-xl theme-bg-surface-hover hover:theme-bg-surface-active theme-text-primary text-xs font-medium border theme-border transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>

        {/* Manual Add Form */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-3 theme-bg-surface border-b theme-border space-y-2.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium theme-text-muted mb-1">
                Title / Description
              </label>
              <input
                type="text"
                placeholder="e.g. Test all endpoints, Finish Django API..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] theme-text-muted mb-1">Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary text-xs"
                >
                  <option value="action">Action Item</option>
                  <option value="decision">Decision</option>
                  <option value="keyPoint">Key Point</option>
                  <option value="question">Question</option>
                  <option value="note">Note</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] theme-text-muted mb-1">Deadline</label>
                <input
                  type="text"
                  placeholder="e.g. Tomorrow"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full px-2 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] theme-text-muted mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary text-xs"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 min-h-[32px] rounded-lg theme-text-muted hover:theme-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 min-h-[32px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
              >
                Save to Board
              </button>
            </div>
          </form>
        )}

        {/* Category Tabs */}
        <div className="px-3 py-2 border-b theme-border flex items-center gap-1 overflow-x-auto text-xs no-scrollbar">
          {[
            { id: "all", label: "All", count: items.length },
            { id: "action", label: "Actions", count: items.filter((i) => i.type === "action").length },
            { id: "decision", label: "Decisions", count: items.filter((i) => i.type === "decision").length },
            { id: "keyPoint", label: "Key Points", count: items.filter((i) => i.type === "keyPoint").length },
            { id: "question", label: "Questions", count: items.filter((i) => i.type === "question").length },
            { id: "note", label: "Notes", count: items.filter((i) => i.type === "note").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-2.5 py-1.5 min-h-[30px] rounded-full whitespace-nowrap transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                activeTab === tab.id
                  ? "theme-bg-surface-active theme-text-accent font-medium"
                  : "theme-text-muted hover:theme-text-primary"
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] opacity-70">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredItems.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 theme-text-muted space-y-2">
              <FileText className="w-8 h-8 stroke-1 theme-text-subtle" />
              <p className="text-sm font-medium theme-text-secondary">No items on AskBoard yet</p>
              <p className="text-xs theme-text-subtle max-w-xs">
                Click "Extract from Chat" to have Asko identify action items and key decisions automatically, or add an item manually.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const isAction = item.type === "action";
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all ${
                    item.completed
                      ? "theme-bg-surface border theme-border opacity-60"
                      : "theme-bg-surface border theme-border hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {isAction && (
                      <button
                        onClick={() => onToggleComplete(item.id)}
                        className="mt-0.5 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center theme-text-muted hover:text-amber-500 transition-colors flex-shrink-0"
                        aria-label={item.completed ? "Mark incomplete" : "Mark complete"}
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                            item.type === "action"
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border-cyan-500/20"
                              : item.type === "decision"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
                              : item.type === "keyPoint"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20"
                              : item.type === "question"
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20"
                              : "theme-bg-tag theme-text-secondary theme-border"
                          }`}
                        >
                          {item.type}
                        </span>

                        {item.priority && (
                          <span
                            className={`text-[10px] font-mono px-1 rounded ${
                              item.priority === "high"
                                ? "text-rose-600 dark:text-rose-400 bg-rose-500/10"
                                : item.priority === "medium"
                                ? "text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                : "theme-text-muted"
                            }`}
                          >
                            {item.priority}
                          </span>
                        )}

                        {item.deadline && (
                          <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-300 font-mono">
                            <Calendar className="w-3 h-3" />
                            <span>{item.deadline}</span>
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-xs theme-text-primary leading-relaxed break-words [overflow-wrap:anywhere] ${
                          item.completed ? "line-through theme-text-muted" : ""
                        }`}
                      >
                        {item.title}
                      </p>
                    </div>

                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="theme-text-muted hover:text-rose-500 p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center rounded hover:theme-bg-surface-hover transition-colors flex-shrink-0"
                      title="Delete item"
                      aria-label="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
