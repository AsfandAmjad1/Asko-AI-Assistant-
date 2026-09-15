export type AIMode =
  | "general"
  | "study"
  | "coding"
  | "writing"
  | "research"
  | "documents"
  | "creative";

export type IntentType =
  | "question"
  | "learning"
  | "coding"
  | "writing"
  | "research"
  | "planning"
  | "document"
  | "creative"
  | "action";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  base64?: string;
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
  files?: Attachment[];
  intent?: IntentType;
  mode?: AIMode;
  suggestedActions?: string[];
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  mode: AIMode;
  projectId?: string;
  messages: ChatMessage[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  instructions: string;
  createdAt: number;
}

export interface AskBoardItem {
  id: string;
  type: "action" | "decision" | "keyPoint" | "question" | "note";
  title: string;
  deadline?: string;
  completed?: boolean;
  priority?: "high" | "medium" | "low";
  sourceConversationId?: string;
  createdAt: number;
}

export interface MemoryItem {
  id: string;
  text: string;
  createdAt: number;
}

export interface AppSettings {
  theme: "dark" | "light";
  defaultMode: AIMode;
  memoryEnabled: boolean;
  privateMode: boolean;
  streamResponses: boolean;
  voiceAutoSpeak: boolean;
}
