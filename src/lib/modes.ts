import { AIMode } from "../types";
import {
  Sparkles,
  GraduationCap,
  Code2,
  PenTool,
  Compass,
  FileText,
  Lightbulb,
} from "lucide-react";

export interface ModeConfig {
  id: AIMode;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: any;
  color: string;
  accentBg: string;
  promptPlaceholder: string;
}

export const AI_MODES: ModeConfig[] = [
  {
    id: "general",
    name: "General",
    shortDesc: "Balanced & conversational",
    fullDesc: "Helpful, balanced and conversational guidance across any topic.",
    icon: Sparkles,
    color: "text-amber-400",
    accentBg: "bg-amber-400/10 border-amber-400/30",
    promptPlaceholder: "Ask Asko anything, explore ideas, or paste a problem...",
  },
  {
    id: "study",
    name: "Study",
    shortDesc: "Step-by-step learning & quizzes",
    fullDesc: "Teaches concepts step-by-step, uses real examples, quizzes, and clear study breakdowns.",
    icon: GraduationCap,
    color: "text-emerald-400",
    accentBg: "bg-emerald-400/10 border-emerald-400/30",
    promptPlaceholder: "What concept would you like to master today?",
  },
  {
    id: "coding",
    name: "Coding",
    shortDesc: "Analysis, debugging & architecture",
    fullDesc: "Analyzes code, detects bugs, explains errors, and suggests architectural improvements.",
    icon: Code2,
    color: "text-cyan-400",
    accentBg: "bg-cyan-400/10 border-cyan-400/30",
    promptPlaceholder: "Paste code, an error stack trace, or describe a feature to build...",
  },
  {
    id: "writing",
    name: "Writing",
    shortDesc: "Drafting, editing & tone polish",
    fullDesc: "Helps write, rewrite, polish tone, summarize and elevate content while preserving your voice.",
    icon: PenTool,
    color: "text-rose-400",
    accentBg: "bg-rose-400/10 border-rose-400/30",
    promptPlaceholder: "Paste your draft, or describe what you want to write...",
  },
  {
    id: "research",
    name: "Research",
    shortDesc: "Rigor, uncertainty & fact checking",
    fullDesc: "Structures information clearly, identifies uncertainties, and distinguishes facts from assumptions.",
    icon: Compass,
    color: "text-indigo-400",
    accentBg: "bg-indigo-400/10 border-indigo-400/30",
    promptPlaceholder: "Enter a research question, hypothesis, or topic to investigate...",
  },
  {
    id: "documents",
    name: "Documents",
    shortDesc: "Upload & deep document extraction",
    fullDesc: "Analyzes uploaded documents, reports, and data, answering strictly from provided text.",
    icon: FileText,
    color: "text-orange-400",
    accentBg: "bg-orange-400/10 border-orange-400/30",
    promptPlaceholder: "Upload a document and ask: summarize, extract requirements, or explain...",
  },
  {
    id: "creative",
    name: "Creative",
    shortDesc: "Ideation, naming & storytelling",
    fullDesc: "Assists with brainstorming, divergent thinking, naming, worldbuilding, and narratives.",
    icon: Lightbulb,
    color: "text-yellow-400",
    accentBg: "bg-yellow-400/10 border-yellow-400/30",
    promptPlaceholder: "Describe what you want to brainstorm, name, or write a story about...",
  },
];

export function getModeConfig(mode: AIMode): ModeConfig {
  return AI_MODES.find((m) => m.id === mode) || AI_MODES[0];
}
