import { Conversation, Project, AskBoardItem, MemoryItem, AppSettings } from "../types";

const STORAGE_KEYS = {
  CONVERSATIONS: "asko_conversations_v1",
  PROJECTS: "asko_projects_v1",
  ASKBOARD: "asko_askboard_v1",
  MEMORIES: "asko_memories_v1",
  SETTINGS: "asko_settings_v1",
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "dark",
  defaultMode: "general",
  memoryEnabled: true,
  privateMode: false,
  streamResponses: true,
  voiceAutoSpeak: false,
};

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "General Workspace",
    description: "General tasks, daily reasoning, and ad-hoc research",
    instructions: "Respond concisely, with clean formatting and clear mental models.",
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: "proj-2",
    name: "Engineering & Architecture",
    description: "Full-stack code, system designs, debugging, and algorithms",
    instructions: "Prioritize TypeScript, clean architecture, performance, and explicit edge case analysis.",
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: "mem-1",
    text: "Prefers well-typed TypeScript and modern architectural patterns.",
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "mem-2",
    text: "Prefers concise, actionable explanations without unnecessary fluff.",
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const storage = {
  getConversations(): Conversation[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveConversations(conversations: Conversation[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (e) {
      console.error("Failed to save conversations", e);
    }
  },

  getProjects(): Project[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  },

  saveProjects(projects: Project[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error("Failed to save projects", e);
    }
  },

  getAskBoardItems(): AskBoardItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ASKBOARD);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveAskBoardItems(items: AskBoardItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ASKBOARD, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to save AskBoard items", e);
    }
  },

  getMemories(): MemoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEMORIES);
      return data ? JSON.parse(data) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  },

  saveMemories(memories: MemoryItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(memories));
    } catch (e) {
      console.error("Failed to save memories", e);
    }
  },

  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  getTheme(): "dark" | "light" {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed?.theme === "light" || parsed?.theme === "dark") {
          return parsed.theme;
        }
      }
      return DEFAULT_SETTINGS.theme;
    } catch {
      return DEFAULT_SETTINGS.theme;
    }
  },

  saveTheme(theme: "dark" | "light"): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const current = data ? JSON.parse(data) : DEFAULT_SETTINGS;
      if (current.theme !== theme) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...current, theme }));
      }
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  },

  saveSettings(settings: Partial<AppSettings>): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const current = data ? JSON.parse(data) : DEFAULT_SETTINGS;
      // Preserve current theme stored in localStorage unless explicitly given
      const currentTheme = current.theme || DEFAULT_SETTINGS.theme;
      const merged = { ...DEFAULT_SETTINGS, ...current, ...settings, theme: currentTheme };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
    } catch (e) {
      console.error("Failed to save settings", e);
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
    localStorage.removeItem(STORAGE_KEYS.ASKBOARD);
    localStorage.removeItem(STORAGE_KEYS.MEMORIES);
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
  },
};
