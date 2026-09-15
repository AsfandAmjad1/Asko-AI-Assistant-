import React, { useState } from "react";
import { Project } from "../types";
import { X, Plus, FolderKanban, Trash2, Check, Sparkles } from "lucide-react";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: (project: Omit<Project, "id" | "createdAt">) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectModal({
  isOpen,
  onClose,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
}: ProjectModalProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateProject({
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.trim(),
    });

    setName("");
    setDescription("");
    setInstructions("");
    setShowCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl theme-bg-modal border theme-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b theme-border flex items-center justify-between theme-bg-modal-header">
          <div className="flex items-center gap-2 min-w-0">
            <FolderKanban className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="font-bold text-base theme-text-primary truncate">Project Workspaces</h2>
              <p className="text-xs theme-text-muted truncate">
                Custom contexts, standing instructions, and knowledge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg theme-text-muted hover:theme-text-primary hover:theme-bg-surface-hover flex-shrink-0"
            aria-label="Close Project Workspaces"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-4 flex-1 overflow-y-auto space-y-3 sm:space-y-4">
          {/* Active selection row */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b theme-border-subtle">
            <button
              onClick={() => {
                onSelectProject(null);
              }}
              className={`px-3 py-1.5 min-h-[32px] rounded-lg text-xs font-medium border transition-all ${
                !activeProjectId
                  ? "bg-amber-500/20 theme-text-accent border-amber-500/40"
                  : "theme-bg-surface theme-text-secondary border theme-border hover:theme-bg-surface-hover"
              }`}
            >
              Default (Global Workspace)
            </button>

            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-500 min-h-[32px] px-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>

          {/* New Project Form */}
          {showCreate && (
            <form
              onSubmit={handleCreate}
              className="p-3.5 rounded-xl theme-bg-surface border theme-border space-y-2.5 text-xs"
            >
              <h3 className="font-semibold theme-text-primary">Create New Project</h3>
              <div>
                <label className="block text-[11px] theme-text-muted mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Django Portfolio, University Research..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] theme-text-muted mb-1">Goal / Description</label>
                <input
                  type="text"
                  placeholder="Brief description of the workspace objective"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-[11px] theme-text-muted mb-1">
                  Custom Instructions & Rules for Asko
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Focus on Python, PostgreSQL, strict type annotations, and clean architectural boundaries."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg theme-bg-input border theme-border-input theme-text-primary placeholder:theme-text-subtle focus:outline-none focus:border-amber-500 text-xs sm:text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 min-h-[32px] rounded-lg theme-text-muted hover:theme-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 min-h-[32px] rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                >
                  Create Project
                </button>
              </div>
            </form>
          )}

          {/* Project List */}
          <div className="space-y-2">
            {projects.map((proj) => {
              const isActive = proj.id === activeProjectId;
              return (
                <div
                  key={proj.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isActive
                      ? "theme-bg-surface border-amber-500/50 shadow-md"
                      : "theme-bg-surface border theme-border hover:border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        onSelectProject(proj.id);
                        onClose();
                      }}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold theme-text-primary text-sm truncate">
                          {proj.name}
                        </span>
                        {isActive && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 font-mono">
                            Active
                          </span>
                        )}
                      </div>

                      {proj.description && (
                        <p className="text-xs theme-text-muted mt-0.5 break-words [overflow-wrap:anywhere]">
                          {proj.description}
                        </p>
                      )}

                      {proj.instructions && (
                        <div className="mt-2 p-2 rounded theme-bg-input border theme-border-subtle text-[11px] theme-text-secondary font-mono break-words [overflow-wrap:anywhere]">
                          {proj.instructions}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          onSelectProject(proj.id);
                          onClose();
                        }}
                        className={`px-2.5 py-1.5 min-h-[32px] rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-amber-500 text-slate-950 font-semibold"
                            : "theme-bg-surface hover:theme-bg-surface-hover theme-text-secondary border theme-border"
                        }`}
                      >
                        {isActive ? "Selected" : "Select"}
                      </button>

                      <button
                        onClick={() => onDeleteProject(proj.id)}
                        className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center theme-text-muted hover:text-rose-500 rounded hover:theme-bg-surface-hover"
                        title="Delete project"
                        aria-label="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
