import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with generous limits for file/image attachments
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy GoogleGenAI client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Resilient retry wrappers with automatic fallback for transient quota/demand spikes
async function generateContentWithRetry(ai: GoogleGenAI, params: any): Promise<any> {
  try {
    return await ai.models.generateContent(params);
  } catch (err: any) {
    const isQuotaOrDemand =
      err?.status === 429 ||
      err?.status === 503 ||
      err?.message?.includes("RESOURCE_EXHAUSTED") ||
      err?.message?.includes("Quota exceeded") ||
      err?.message?.includes("high demand") ||
      err?.message?.includes("UNAVAILABLE") ||
      err?.message?.includes("503") ||
      err?.message?.includes("429");

    if (isQuotaOrDemand && params.model === "gemini-3.8-flash") {
      console.warn("gemini-3.8-flash quota/demand reached, gracefully falling back to gemini-3.1-flash-lite");
      try {
        return await ai.models.generateContent({ ...params, model: "gemini-3.1-flash-lite" });
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

async function generateContentStreamWithRetry(ai: GoogleGenAI, params: any): Promise<any> {
  try {
    return await ai.models.generateContentStream(params);
  } catch (err: any) {
    const isQuotaOrDemand =
      err?.status === 429 ||
      err?.status === 503 ||
      err?.message?.includes("RESOURCE_EXHAUSTED") ||
      err?.message?.includes("Quota exceeded") ||
      err?.message?.includes("high demand") ||
      err?.message?.includes("UNAVAILABLE") ||
      err?.message?.includes("503") ||
      err?.message?.includes("429");

    if (isQuotaOrDemand && params.model === "gemini-3.8-flash") {
      console.warn("gemini-3.8-flash quota/demand reached, gracefully falling back to gemini-3.1-flash-lite");
      try {
        return await ai.models.generateContentStream({ ...params, model: "gemini-3.1-flash-lite" });
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
}

// System Instructions based on AI Mode
function buildSystemInstruction(
  mode: string = "general",
  projectContext?: { name: string; description?: string; instructions?: string },
  memories?: string[]
): string {
  const baseInstruction = `You are Asko, an intelligent, multimodal AI assistant created by Asfand Amjad.
Tagline: "Think. Ask. Create."

Identity & Core Personality:
- You are Asko: thoughtful, articulate, honest, precise, and genuinely capable.
- Never state that you are ChatGPT, Claude, or a generic bot. If asked about your origins, state clearly that you are Asko, created by Asfand Amjad.
- Provide real, high-quality analysis. Never output fake or mock responses.
- If you are uncertain about something or facts cannot be verified, state clearly: "I'm not fully certain about this" or "This should be verified." Never fabricate sources, citations, or document contents.
- For uploaded documents or images: Distinguish strictly between:
  1) Information explicitly stated in the uploaded content.
  2) General domain knowledge.
  3) Information that cannot be determined from the provided material.
- Intelligent Clarification: If the user's prompt is deeply ambiguous or lacks critical specifications (for instance, "Build a website for me" or "Analyze my project"), provide a brief initial conceptual framing and ask 1 to 3 targeted, high-impact clarification questions rather than blindly guessing. Keep questions concise and relevant.`;

  const modeInstructions: Record<string, string> = {
    general: `MODE: GENERAL
Be balanced, insightful, and conversational. Adapt fluidly to the user's depth and style.`,

    study: `MODE: STUDY & LEARNING
You are a master tutor.
- Break concepts down step-by-step using clear mental models and analogies.
- Provide concrete real-world examples.
- When explaining complex ideas, offer to quiz the user or test comprehension.
- Synthesize key takeaways into clear structured study notes.`,

    coding: `MODE: CODING & SOFTWARE ENGINEERING
You are a senior staff software architect.
- Analyze code thoroughly, detect subtle edge cases, performance bottlenecks, and security bugs.
- Explain the underlying root cause of errors, not just a blind copy-paste fix.
- Provide clean, modern, well-typed code blocks with comments where relevant.
- Offer actionable architectural insights (optimization, test cases, error handling).`,

    writing: `MODE: WRITING & EDITORIAL
You are an expert editor and wordsmith.
- Help draft, refine, clarify, and elevate text while preserving the user's intended voice and core message.
- Offer specific alternatives (e.g., more professional, more concise, more narrative, or more punchy).
- Point out grammatical improvements and structural flow.`,

    research: `MODE: RESEARCH & DEEP ANALYSIS
You are an objective research fellow.
- Structure information rigorously with clear headings, evidence, and logical progression.
- Explicitly identify uncertainty, assumptions, and counter-arguments.
- Distinguish verified empirical facts from speculative opinions.`,

    documents: `MODE: DOCUMENT ANALYSIS
You specialize in inspecting, querying, and synthesizing provided documents, PDFs, data, and notes.
- Ground your answers strictly in the provided document context.
- Cite specific sections, tables, or requirements when referenced.
- If the document does not contain an answer, explicitly declare: "I couldn't determine that from the uploaded document."`,

    creative: `MODE: CREATIVE & BRAINSTORMING
You are a creative strategist and storytelling collaborator.
- Generate inventive, lateral concepts, hooks, names, storylines, and creative angles.
- Avoid generic tropes; encourage fresh perspective and imaginative depth.`,
  };

  const selectedModeInstruction = modeInstructions[mode.toLowerCase()] || modeInstructions.general;

  let contextAddition = "";
  if (projectContext && projectContext.name) {
    contextAddition += `\n\nCURRENT PROJECT WORKSPACE: "${projectContext.name}"`;
    if (projectContext.description) {
      contextAddition += `\nProject Goal / Description: ${projectContext.description}`;
    }
    if (projectContext.instructions) {
      contextAddition += `\nProject-Specific Context & Rules:\n${projectContext.instructions}`;
    }
  }

  let memoryAddition = "";
  if (memories && memories.length > 0) {
    memoryAddition += `\n\nUSER-APPROVED PERSISTENT MEMORIES:\n${memories
      .map((m) => `- ${m}`)
      .join("\n")}\n(Incorporate these preferences and facts naturally into your answers.)`;
  }

  return `${baseInstruction}\n\n${selectedModeInstruction}${contextAddition}${memoryAddition}`;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasKey: Boolean(process.env.GEMINI_API_KEY),
    name: "Asko API",
  });
});

// Normalize and validate conversation history for Gemini generateContent / generateContentStream
interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContentTurn {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface NormalizationResult {
  valid: boolean;
  error?: string;
  contents: GeminiContentTurn[];
}

function normalizeConversationHistory(rawMessages: any[]): NormalizationResult {
  if (!rawMessages || !Array.isArray(rawMessages) || rawMessages.length === 0) {
    return {
      valid: false,
      error: "Conversation history is empty.",
      contents: [],
    };
  }

  const rawTurns: GeminiContentTurn[] = [];

  for (const msg of rawMessages) {
    if (!msg || typeof msg !== "object") continue;

    // Map internal roles to Gemini roles: user -> user, assistant/model/bot -> model
    const rawRole = String(msg.role || "").toLowerCase().trim();
    // System messages must not be sent in contents (handled in systemInstruction)
    if (rawRole === "system") {
      continue;
    }

    const role: "user" | "model" =
      rawRole === "model" || rawRole === "assistant" || rawRole === "bot"
        ? "model"
        : "user";

    const parts: GeminiPart[] = [];

    // Attached files (images / text documents)
    if (msg.files && Array.isArray(msg.files)) {
      for (const file of msg.files) {
        if (!file) continue;
        if (file.base64 && (file.type?.startsWith("image/") || typeof file.type === "string")) {
          const base64Data = String(file.base64).replace(/^data:[^;]+;base64,/, "");
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType: file.type || "image/png",
                data: base64Data,
              },
            });
          }
        } else if (file.textContent) {
          parts.push({
            text: `[Attached Document: ${file.name || "document"}]\n\`\`\`\n${file.textContent}\n\`\`\``,
          });
        }
      }
    }

    // Text content
    const textVal =
      typeof msg.text === "string"
        ? msg.text
        : typeof msg.content === "string"
        ? msg.content
        : "";

    if (textVal.trim()) {
      parts.push({ text: textVal });
    }

    // Handle empty parts
    if (parts.length === 0) {
      if (role === "user") {
        parts.push({ text: "(empty message)" });
      } else {
        // Skip empty assistant/model turns
        continue;
      }
    }

    rawTurns.push({ role, parts });
  }

  if (rawTurns.length === 0) {
    return {
      valid: false,
      error: "No valid user or assistant messages found in conversation history.",
      contents: [],
    };
  }

  // Filter out leading model turns (Gemini conversation must start with a user turn)
  while (rawTurns.length > 0 && rawTurns[0].role === "model") {
    rawTurns.shift();
  }

  if (rawTurns.length === 0) {
    return {
      valid: false,
      error: "Conversation history must begin with a user turn.",
      contents: [],
    };
  }

  // Merge consecutive turns of the same role (prevents turns must alternate error)
  const alternatingTurns: GeminiContentTurn[] = [];
  for (const turn of rawTurns) {
    if (alternatingTurns.length === 0) {
      alternatingTurns.push(turn);
    } else {
      const prev = alternatingTurns[alternatingTurns.length - 1];
      if (prev.role === turn.role) {
        prev.parts.push(...turn.parts);
      } else {
        alternatingTurns.push(turn);
      }
    }
  }

  // Gemini strictly requires the request to END with a user turn
  if (
    alternatingTurns.length > 0 &&
    alternatingTurns[alternatingTurns.length - 1].role === "model"
  ) {
    return {
      valid: false,
      error:
        "Invalid conversation sequence: requests must end with a user turn, not a model turn. Ensure a new user turn has been added before generating.",
      contents: alternatingTurns,
    };
  }

  return {
    valid: true,
    contents: alternatingTurns,
  };
}

// Chat endpoint (supports streaming SSE)
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, mode, projectContext, memories, stream = true } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "Missing or invalid messages array" });
      return;
    }

    // Validate and normalize conversation history before sending to Gemini
    const normalized = normalizeConversationHistory(messages);
    if (!normalized.valid) {
      res.status(400).json({ error: normalized.error || "Invalid conversation history" });
      return;
    }

    const ai = getGeminiClient();
    const systemInstruction = buildSystemInstruction(mode, projectContext, memories);
    const contents = normalized.contents;

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const responseStream = await generateContentStreamWithRetry(ai, {
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: mode === "creative" ? 0.9 : mode === "coding" ? 0.2 : 0.7,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();
    } else {
      const response = await generateContentWithRetry(ai, {
        model: "gemini-3.8-flash",
        contents,
        config: {
          systemInstruction,
          temperature: mode === "creative" ? 0.9 : mode === "coding" ? 0.2 : 0.7,
        },
      });

      res.json({ text: response.text || "" });
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage =
      error?.message?.includes("ending with a model turn")
        ? "Conversation must end with a user turn before generating."
        : error?.message || "An unexpected error occurred while communicating with Gemini.";

    if (!res.headersSent) {
      res.status(500).json({
        error: errorMessage,
      });
    } else {
      res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
      res.end();
    }
  }
});

// Endpoint to generate a concise conversation title
app.post("/api/generate-title", async (req, res) => {
  try {
    const { prompt, firstResponse } = req.body;
    if (!prompt) {
      res.json({ title: "New Conversation" });
      return;
    }

    const ai = getGeminiClient();
    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.8-flash",
      contents: `Generate a concise, elegant 2 to 4 word title for a conversation that begins with:
User: "${prompt.slice(0, 300)}"
${firstResponse ? `AI: "${firstResponse.slice(0, 300)}"` : ""}

Rules:
- 2 to 4 words maximum
- Capitalize properly
- No quotes or punctuation
- Return ONLY the title string`,
      config: {
        temperature: 0.3,
      },
    });

    const title = result.text?.trim().replace(/^["']|["']$/g, "") || "Conversation";
    res.json({ title });
  } catch (error) {
    console.error("Generate title error:", error);
    res.json({ title: "New Conversation" });
  }
});

// Endpoint to extract AskBoard structured information
app.post("/api/extract-askboard", async (req, res) => {
  try {
    const { conversationText } = req.body;
    if (!conversationText || typeof conversationText !== "string") {
      res.status(400).json({ error: "Missing conversationText" });
      return;
    }

    const ai = getGeminiClient();
    const extractionPrompt = `You are Asko's AskBoard structured data extractor.
Analyze the following conversation carefully. Extract ONLY facts, action items, decisions, and questions directly supported by the conversation. Do NOT fabricate or assume items not mentioned.

CONVERSATION:
${conversationText.slice(0, 10000)}

Return a valid JSON object with:
{
  "keyPoints": string[], // Core insights or facts discussed
  "decisions": string[], // Any concrete choices or decisions agreed upon
  "actionItems": [ // Actionable tasks
    {
      "title": string,
      "deadline": string | null, // Deadline if mentioned (e.g. "Tomorrow", "Next Friday"), or null
      "priority": "high" | "medium" | "low"
    }
  ],
  "questions": string[], // Open questions or things to research
  "notes": string[] // Miscellaneous important details
}

Return ONLY clean JSON without markdown code fences.`;

    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.8-flash",
      contents: extractionPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const jsonText = result.text?.trim() || "{}";
    const parsed = JSON.parse(jsonText);
    res.json({ data: parsed });
  } catch (error: any) {
    console.error("Extract Askboard error:", error);
    // Graceful fallback to avoid client failure
    res.json({
      data: {
        keyPoints: [],
        decisions: [],
        actionItems: [],
        questions: [],
        notes: ["Extraction is temporarily queued due to high model demand. Try again in a few moments."],
      },
    });
  }
});

// Endpoint to detect if a message implies long-term memory to remember
app.post("/api/detect-memory", async (req, res) => {
  try {
    const { userText } = req.body;
    if (!userText || userText.length < 10) {
      res.json({ shouldPrompt: false });
      return;
    }

    const ai = getGeminiClient();
    const result = await generateContentWithRetry(ai, {
      model: "gemini-3.8-flash",
      contents: `Analyze if the user's message contains a durable personal preference, background fact, identity statement, or standing instruction that would be genuinely useful for an AI assistant to remember in future conversations (e.g. "I am a frontend developer", "I prefer Python over JavaScript", "My dog's name is Luna", "Always write TypeScript").
Message: "${userText.slice(0, 500)}"

Return JSON:
{
  "hasCandidateMemory": boolean,
  "memoryFact": string | null // e.g. "Prefers TypeScript for coding solutions", or null
}`,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const parsed = JSON.parse(result.text?.trim() || "{}");
    res.json(parsed);
  } catch (err) {
    res.json({ hasCandidateMemory: false });
  }
});

// Vite middleware and server startup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Asko server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
