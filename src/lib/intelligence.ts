import { AIMode, IntentType } from "../types";

export function detectIntent(text: string, mode: AIMode, hasFiles: boolean): IntentType {
  const lower = text.toLowerCase();

  if (hasFiles || lower.includes("summarize this document") || lower.includes("in this file") || lower.includes("in this pdf")) {
    return "document";
  }

  if (
    mode === "coding" ||
    lower.includes("function") ||
    lower.includes("const ") ||
    lower.includes("def ") ||
    lower.includes("class ") ||
    lower.includes("bug") ||
    lower.includes("error") ||
    lower.includes("code") ||
    lower.includes("typescript") ||
    lower.includes("python") ||
    lower.includes("react") ||
    lower.includes("api") ||
    lower.includes("sql")
  ) {
    return "coding";
  }

  if (
    mode === "writing" ||
    lower.startsWith("write ") ||
    lower.startsWith("draft ") ||
    lower.includes("essay") ||
    lower.includes("email") ||
    lower.includes("blog post") ||
    lower.includes("headline") ||
    lower.includes("paragraph")
  ) {
    return "writing";
  }

  if (
    mode === "study" ||
    lower.includes("explain to me") ||
    lower.includes("how does") ||
    lower.includes("teach me") ||
    lower.includes("quiz me") ||
    lower.includes("what is the difference between")
  ) {
    return "learning";
  }

  if (
    mode === "creative" ||
    lower.includes("brainstorm") ||
    lower.includes("ideas for") ||
    lower.includes("story") ||
    lower.includes("naming") ||
    lower.includes("creative concept")
  ) {
    return "creative";
  }

  if (
    lower.includes("plan") ||
    lower.includes("roadmap") ||
    lower.includes("steps to") ||
    lower.includes("milestones") ||
    lower.includes("schedule")
  ) {
    return "planning";
  }

  if (
    mode === "research" ||
    lower.includes("analyze") ||
    lower.includes("compare") ||
    lower.includes("evidence") ||
    lower.includes("pros and cons")
  ) {
    return "research";
  }

  return "question";
}

export function getActionsForIntentAndMode(intent: IntentType, mode: AIMode): string[] {
  if (intent === "coding" || mode === "coding") {
    return [
      "Explain Solution Step-by-Step",
      "Debug & Check Edge Cases",
      "Optimize Performance",
      "Generate Unit Tests",
      "Add TypeScript Types",
    ];
  }

  if (intent === "writing" || mode === "writing") {
    return [
      "Make More Professional",
      "Make Concise & Punchy",
      "Make Conversational & Natural",
      "Draft 3 Headline Options",
      "Improve Structure",
    ];
  }

  if (intent === "learning" || mode === "study") {
    return [
      "Explain Simply (ELI5)",
      "Provide Concrete Example",
      "Quiz Me on This",
      "Generate Study Cheat-Sheet",
      "Next Concept to Learn",
    ];
  }

  if (intent === "research" || mode === "research") {
    return [
      "Identify Potential Assumptions",
      "Present Counter-Arguments",
      "Summarize Core Findings",
      "Suggest Next Questions",
    ];
  }

  if (intent === "document" || mode === "documents") {
    return [
      "Extract Action Items & Deadlines",
      "Summarize Key Requirements",
      "Explain Complex Sections",
      "Highlight Risks or Caveats",
    ];
  }

  if (intent === "creative" || mode === "creative") {
    return [
      "Generate 5 Wild Alternatives",
      "Develop This into a Full Outline",
      "Give Me Catchy Names",
      "Deepen the Concept",
    ];
  }

  // Default general
  return [
    "Explain in More Depth",
    "Summarize Key Takeaways",
    "Give a Concrete Example",
    "Convert to Action Items",
  ];
}
