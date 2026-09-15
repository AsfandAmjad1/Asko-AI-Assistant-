import React from "react";
import { AskoLogo } from "./AskoLogo";
import { AIMode, Project } from "../types";
import { AI_MODES } from "../lib/modes";
import {
  Sparkles,
  HelpCircle,
  PenTool,
  Code2,
  FileText,
  ArrowRight,
  Shield,
  Layers,
} from "lucide-react";

interface WelcomeScreenProps {
  currentMode: AIMode;
  onSelectPrompt: (prompt: string, targetMode?: AIMode) => void;
  activeProject: Project | null;
  isPrivateMode: boolean;
}

export function WelcomeScreen({
  currentMode,
  onSelectPrompt,
  activeProject,
  isPrivateMode,
}: WelcomeScreenProps) {
  const suggestedPrompts = [
    {
      title: "Explain something to me",
      desc: "Break down quantum computing, transformer models, or economic inflation step-by-step with analogies.",
      prompt: "Can you explain how transformer neural networks work step-by-step using an intuitive real-world analogy?",
      mode: "study" as AIMode,
      icon: HelpCircle,
      accent: "hover:border-emerald-500/50 hover:bg-emerald-500/5 text-emerald-400",
    },
    {
      title: "Help me write something",
      desc: "Draft a compelling product announcement, executive email, or refine an existing article.",
      prompt: "Help me draft a concise, high-impact executive announcement email launching a new product initiative.",
      mode: "writing" as AIMode,
      icon: PenTool,
      accent: "hover:border-rose-500/50 hover:bg-rose-500/5 text-rose-400",
    },
    {
      title: "Help me solve a coding problem",
      desc: "Architect a resilient API, debug an algorithmic bottleneck, or write full-stack TypeScript.",
      prompt: "How can I architect a resilient rate-limiting queue in TypeScript with exponential backoff and error recovery?",
      mode: "coding" as AIMode,
      icon: Code2,
      accent: "hover:border-cyan-500/50 hover:bg-cyan-500/5 text-cyan-400",
    },
    {
      title: "Analyze a document",
      desc: "Upload a specification, research paper, or report to extract action items, deadlines, and key findings.",
      prompt: "I want to analyze a technical document or report. What key insights, requirements, and action items should we look for?",
      mode: "documents" as AIMode,
      icon: FileText,
      accent: "hover:border-orange-500/50 hover:bg-orange-500/5 text-orange-400",
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 sm:px-6 py-6 sm:py-10 max-w-4xl mx-auto w-full text-center select-none my-auto min-h-min">
      {/* Brand Hero Badge */}
      <div className="space-y-4 sm:space-y-5 mb-6 sm:mb-8 flex flex-col items-center">
        {/* Prominent ASKO Logo */}
        <div className="flex justify-center items-center pt-1">
          <div className="sm:hidden">
            <AskoLogo size="md" showTagline={false} />
          </div>
          <div className="hidden sm:block lg:hidden">
            <AskoLogo size="lg" showTagline={false} />
          </div>
          <div className="hidden lg:block">
            <AskoLogo size="xl" showTagline={false} />
          </div>
        </div>

        <div className="space-y-1 sm:space-y-1.5">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight theme-text-primary">
            Think. Ask. Create.
          </h1>
          <p className="text-sm sm:text-base lg:text-lg theme-text-secondary font-medium">
            "Your intelligent AI assistant."
          </p>
        </div>

        {/* Creator Attribution */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full theme-bg-surface border theme-border text-xs theme-text-secondary shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          <span>Created by <strong className="theme-text-primary font-semibold">Asfand Amjad</strong></span>
        </div>

        {/* Active Workspace / Mode context banner */}
        {(activeProject || isPrivateMode) && (
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {activeProject && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full theme-bg-surface theme-text-accent border theme-border">
                Workspace: {activeProject.name}
              </span>
            )}
            {isPrivateMode && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Private Mode Active
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4 Suggested Intelligent Prompts */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 max-w-2xl text-left">
        {suggestedPrompts.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.title}
              onClick={() => onSelectPrompt(item.prompt, item.mode)}
              className={`group p-3.5 sm:p-4 rounded-xl theme-bg-surface border theme-border hover:theme-bg-surface-hover hover:shadow-lg transition-all text-left flex flex-col justify-between active:scale-[0.99] ${item.accent}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="font-semibold theme-text-primary text-sm">
                      {item.title}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 theme-text-subtle group-hover:theme-text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
                <p className="text-xs theme-text-secondary leading-relaxed group-hover:theme-text-primary">
                  {item.desc}
                </p>
              </div>

              <div className="mt-2.5 sm:mt-3 pt-2 border-t theme-border-subtle flex items-center justify-between text-[11px] theme-text-subtle">
                <span className="capitalize font-mono">Mode: {item.mode}</span>
                <span className="text-amber-500 font-medium group-hover:text-amber-400">
                  Start chat &rarr;
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Feature capabilities hint */}
      <div className="mt-6 sm:mt-10 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs theme-text-subtle">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
          Multimodal (Text, Images & Documents)
        </span>
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
          AskBoard Action Extraction
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
          User-Controlled Memory
        </span>
      </div>
    </div>
  );
}
