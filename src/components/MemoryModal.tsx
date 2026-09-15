import React, { useState } from "react";
import { MemoryItem } from "../types";
import { X, Brain, Trash2, Plus, Check, ShieldCheck, AlertCircle } from "lucide-react";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  memories: MemoryItem[];
  memoryEnabled: boolean;
  onToggleMemoryEnabled: () => void;
  onAddMemory: (text: string) => void;
  onDeleteMemory: (id: string) => void;
}

export function MemoryModal({
  isOpen,
  onClose,
  memories,
  memoryEnabled,
  onToggleMemoryEnabled,
  onAddMemory,
  onDeleteMemory,
}: MemoryModalProps) {
  const [newMemoryText, setNewMemoryText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMemoryText.trim()) {
      onAddMemory(newMemoryText.trim());
      setNewMemoryText("");
      setShowAddForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl theme-bg-modal border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b theme-border flex items-center justify-between theme-bg-modal-header">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div>
              <h2 className="font-bold text-base theme-text-primary">User-Controlled Memory</h2>
              <p className="text-xs theme-text-muted">
                Explicitly approved knowledge and preferences for Asko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover flex-shrink-0"
            aria-label="Close Memory Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Memory Switch */}
        <div className="p-3.5 sm:p-4 border-b theme-border theme-bg-surface flex items-center justify-between gap-3">
          <div className="space-y-0.5 pr-2">
            <div className="text-sm font-semibold theme-text-primary">
              Personalized Memory
            </div>
            <div className="text-xs theme-text-muted">
              {memoryEnabled
                ? "Asko incorporates approved memories into responses."
                : "Memory is paused. No memories will be recalled or suggested."}
            </div>
          </div>

          <button
            onClick={onToggleMemoryEnabled}
            className={`w-12 h-6 rounded-full transition-colors relative flex items-center px-1 flex-shrink-0 ${
              memoryEnabled ? "bg-amber-500" : "theme-bg-surface-active"
            }`}
            aria-label="Toggle personalized memory"
          >
            <span
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                memoryEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Memory List */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="theme-text-muted font-medium uppercase text-[11px] tracking-wider">
              Saved Memories ({memories.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-500 font-medium min-h-[32px] px-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Memory</span>
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleAdd} className="p-3.5 rounded-xl theme-bg-surface border theme-border space-y-2.5">
              <label className="block text-[11px] theme-text-muted">
                Enter fact or preference for Asko to remember:
              </label>
              <textarea
                rows={2}
                value={newMemoryText}
                onChange={(e) => setNewMemoryText(e.target.value)}
                placeholder="e.g. Always write code in TypeScript with strict null checks."
                className="w-full px-2.5 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
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
                  Save Fact
                </button>
              </div>
            </form>
          )}

          {memories.length === 0 ? (
            <div className="py-8 text-center theme-text-muted space-y-1.5">
              <ShieldCheck className="w-8 h-8 mx-auto stroke-1 theme-text-subtle" />
              <p className="font-medium theme-text-secondary">No saved memories</p>
              <p className="text-[11px] theme-text-subtle">
                Asko never remembers anything without your explicit confirmation.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {memories.map((mem) => (
                <div
                  key={mem.id}
                  className="p-3 rounded-xl theme-bg-surface border theme-border flex items-start justify-between gap-3 group"
                >
                  <p className="theme-text-primary leading-relaxed text-xs break-words [overflow-wrap:anywhere] flex-1 min-w-0">
                    {mem.text}
                  </p>
                  <button
                    onClick={() => onDeleteMemory(mem.id)}
                    className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center theme-text-muted hover:text-rose-500 rounded hover:theme-bg-surface-hover transition-colors flex-shrink-0"
                    title="Delete memory"
                    aria-label="Delete memory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="p-3 border-t theme-border theme-bg-surface theme-text-muted text-[11px] flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
          <span>Memories are stored locally and only included when Memory is ON.</span>
        </div>
      </div>
    </div>
  );
}
