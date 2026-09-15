/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Conversation,
  ChatMessage,
  Project,
  AskBoardItem,
  MemoryItem,
  AppSettings,
  AIMode,
  Attachment,
} from "./types";
import { storage, DEFAULT_SETTINGS } from "./lib/storage";
import { detectIntent, getActionsForIntentAndMode } from "./lib/intelligence";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ChatMessageItem } from "./components/ChatMessageItem";
import { ChatInput } from "./components/ChatInput";
import { AskBoardDrawer } from "./components/AskBoardDrawer";
import { ProjectModal } from "./components/ProjectModal";
import { MemoryModal } from "./components/MemoryModal";
import { SettingsModal } from "./components/SettingsModal";
import { AlertCircle, RotateCw, Shield, Sparkles } from "lucide-react";

export default function App() {
  // Persistence state
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    storage.getConversations()
  );
  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [askBoardItems, setAskBoardItems] = useState<AskBoardItem[]>(() =>
    storage.getAskBoardItems()
  );
  const [memories, setMemories] = useState<MemoryItem[]>(() => storage.getMemories());
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Active navigation state
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<AIMode>(settings.defaultMode || "general");

  // Private mode temporary messages (when private mode is on, no persistence)
  const [privateMessages, setPrivateMessages] = useState<ChatMessage[]>([]);

  // Generation & streaming state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [pendingMemoryFact, setPendingMemoryFact] = useState<string | null>(null);
  const [isExtractingAskBoard, setIsExtractingAskBoard] = useState(false);

  // UI Drawers & Modals
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);
  const [isAskBoardOpen, setIsAskBoardOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = settings.privateMode
    ? privateMessages
    : activeConversation?.messages || [];

  useEffect(() => {
    scrollToBottom();
  }, [currentMessages, isGenerating]);

  // Persist conversations
  useEffect(() => {
    if (!settings.privateMode) {
      storage.saveConversations(conversations);
    }
  }, [conversations, settings.privateMode]);

  // Persist projects
  useEffect(() => {
    storage.saveProjects(projects);
  }, [projects]);

  // Persist AskBoard
  useEffect(() => {
    storage.saveAskBoardItems(askBoardItems);
  }, [askBoardItems]);

  // Persist memories
  useEffect(() => {
    storage.saveMemories(memories);
  }, [memories]);

  // Persist settings
  useEffect(() => {
    storage.saveSettings(settings);
  }, [settings]);

  // Handler to start a new chat
  const handleNewChat = (customMode?: AIMode) => {
    if (settings.privateMode) {
      setPrivateMessages([]);
    } else {
      setActiveConversationId(null);
    }
    if (customMode) {
      setCurrentMode(customMode);
    }
    setGenerationError(null);
    setPendingMemoryFact(null);
  };

  // Helper to get active project object
  const currentProject = projects.find((p) => p.id === activeProjectId) || null;

  // Main chat sending handler
  const handleSendMessage = async (text: string, files: Attachment[] = []) => {
    if (!text.trim() && files.length === 0) return;
    if (isGenerating) return;

    setGenerationError(null);
    const intent = detectIntent(text, currentMode, files.length > 0);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      role: "user",
      text,
      timestamp: Date.now(),
      files,
      intent,
      mode: currentMode,
    };

    let convId = activeConversationId;
    let baseHistory: ChatMessage[] = [];

    if (settings.privateMode) {
      baseHistory = privateMessages;
    } else if (convId) {
      const activeConv = conversations.find((c) => c.id === convId);
      baseHistory = activeConv ? activeConv.messages : [];
    }

    // Filter out any trailing empty model messages from base history to prevent duplicates
    const cleanBaseHistory = baseHistory.filter(
      (m) => m.role === "user" || (m.role === "model" && m.text.trim().length > 0)
    );

    // Strictly append the new user message as a user turn
    const updatedHistory = [...cleanBaseHistory, userMessage];

    if (settings.privateMode) {
      setPrivateMessages(updatedHistory);
    } else {
      if (!convId) {
        // Create new conversation
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: text.slice(0, 32) || "New Conversation",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          mode: currentMode,
          projectId: activeProjectId || undefined,
          messages: updatedHistory,
        };
        convId = newConv.id;
        setActiveConversationId(newConv.id);
        setConversations((prev) => [newConv, ...prev]);
      } else {
        // Append user message to active conversation
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: updatedHistory,
                }
              : c
          )
        );
      }
    }

    // Now call Gemini API with streaming using the validated history ending with userMessage
    await executeGeneration(userMessage, convId, updatedHistory);

    // If Memory is enabled and not private mode, check in background for candidate durable facts
    if (settings.memoryEnabled && !settings.privateMode && text.length > 15) {
      try {
        fetch("/api/detect-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userText: text }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.hasCandidateMemory && data.memoryFact) {
              setPendingMemoryFact(data.memoryFact);
            }
          })
          .catch(() => {});
      } catch {}
    }
  };

  // Helper to execute generation with streaming SSE
  const executeGeneration = async (
    triggerUserMessage: ChatMessage,
    targetConvId: string | null,
    historyEndingWithUser: ChatMessage[]
  ) => {
    // Safety validation: never generate if history is empty or does not end with a user turn
    if (!historyEndingWithUser || historyEndingWithUser.length === 0) {
      console.warn("Generation skipped: conversation history is empty.");
      return;
    }

    const lastMessage = historyEndingWithUser[historyEndingWithUser.length - 1];
    if (lastMessage.role !== "user") {
      console.warn("Generation skipped: conversation must end with a user turn, not a model turn.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Placeholder model message
    const modelMessageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const initialModelMessage: ChatMessage = {
      id: modelMessageId,
      role: "model",
      text: "",
      timestamp: Date.now(),
      mode: currentMode,
      intent: triggerUserMessage.intent,
      suggestedActions: getActionsForIntentAndMode(
        triggerUserMessage.intent || "question",
        currentMode
      ),
    };

    // Append placeholder model message to UI state
    if (settings.privateMode) {
      setPrivateMessages([...historyEndingWithUser, initialModelMessage]);
    } else if (targetConvId) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? { ...c, messages: [...historyEndingWithUser, initialModelMessage] }
            : c
        )
      );
    }

    // Prepare message history to send to Gemini API:
    // MUST contain turns up to and including the current user turn, NEVER ending with a model turn!
    const messageHistory = historyEndingWithUser.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      text: m.text,
      files: m.files,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortController.signal,
        body: JSON.stringify({
          messages: messageHistory,
          mode: currentMode,
          projectContext: currentProject
            ? {
                name: currentProject.name,
                description: currentProject.description,
                instructions: currentProject.instructions,
              }
            : undefined,
          memories: settings.memoryEnabled ? memories.map((m) => m.text) : [],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response reader available.");

      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            const dataStr = trimmed.slice(6);
            if (dataStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                accumulatedText += parsed.text;

                // Update model message content
                if (settings.privateMode) {
                  setPrivateMessages((prev) =>
                    prev.map((m) =>
                      m.id === modelMessageId ? { ...m, text: accumulatedText } : m
                    )
                  );
                } else if (targetConvId) {
                  setConversations((prev) =>
                    prev.map((c) =>
                      c.id === targetConvId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === modelMessageId
                                ? { ...m, text: accumulatedText }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                }
              }
            } catch (e: any) {
              if (e.message && e.message !== "Unexpected end of JSON input") {
                console.warn("Parse line warning", e.message);
              }
            }
          }
        }
      }

      // If generation completed with empty text (e.g. abrupt stop), clean up empty model message
      if (!accumulatedText.trim()) {
        if (settings.privateMode) {
          setPrivateMessages(historyEndingWithUser);
        } else if (targetConvId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId ? { ...c, messages: historyEndingWithUser } : c
            )
          );
        }
      }

      // Title Generation for new conversations
      if (!settings.privateMode && targetConvId) {
        if (historyEndingWithUser.length <= 1) {
          fetch("/api/generate-title", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: triggerUserMessage.text,
              firstResponse: accumulatedText,
            }),
          })
            .then((res) => res.json())
            .then((res) => {
              if (res.title) {
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === targetConvId ? { ...c, title: res.title } : c
                  )
                );
              }
            })
            .catch(() => {});
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Generation stopped by user");
      } else {
        console.error("Chat generation failed:", err);
        setGenerationError(err.message || "Failed to generate response.");
        // Revert empty placeholder on error to prevent duplicate or empty model turn
        if (settings.privateMode) {
          setPrivateMessages((prev) =>
            prev.filter((m) => m.id !== modelMessageId || m.text.trim().length > 0)
          );
        } else if (targetConvId) {
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.filter(
                      (m) => m.id !== modelMessageId || m.text.trim().length > 0
                    ),
                  }
                : c
            )
          );
        }
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Stop active generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  // Regenerate last response
  const handleRegenerate = async () => {
    if (isGenerating) return;
    const msgs = currentMessages;
    if (msgs.length === 0) return;

    // Find the last model message index
    let lastModelIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === "model") {
        lastModelIndex = i;
        break;
      }
    }

    if (lastModelIndex === -1) return;

    // Remove the last model message and take the conversation history up to the user message
    const historyBeforeModel = msgs.slice(0, lastModelIndex);
    if (historyBeforeModel.length === 0) return;

    const previousUserMsg = historyBeforeModel[historyBeforeModel.length - 1];
    if (!previousUserMsg || previousUserMsg.role !== "user") {
      console.warn("Regenerate aborted: preceding message is not a user message.");
      return;
    }

    // Regenerate from the preceding user message, replacing the model response
    await executeGeneration(previousUserMsg, activeConversationId, historyBeforeModel);
  };

  // Follow-up context-aware action clicked (creates a NEW user request before calling Gemini)
  const handleActionClick = (actionName: string) => {
    handleSendMessage(actionName);
  };

  // Extract from current chat to AskBoard
  const handleExtractAskBoard = async (providedText?: string) => {
    const textToAnalyze =
      providedText ||
      currentMessages
        .map((m) => `${m.role === "user" ? "User" : "Asko"}: ${m.text}`)
        .join("\n\n");

    if (!textToAnalyze.trim()) {
      alert("No conversation text available to extract.");
      return;
    }

    setIsExtractingAskBoard(true);
    setIsAskBoardOpen(true);

    try {
      const response = await fetch("/api/extract-askboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationText: textToAnalyze }),
      });

      if (!response.ok) throw new Error("Failed to extract AskBoard items");

      const result = await response.json();
      const extracted = result.data;

      const newItems: AskBoardItem[] = [];

      // Add Action Items
      if (extracted.actionItems && Array.isArray(extracted.actionItems)) {
        extracted.actionItems.forEach((act: any) => {
          if (act.title) {
            newItems.push({
              id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              type: "action",
              title: act.title,
              deadline: act.deadline || undefined,
              priority: act.priority || "medium",
              completed: false,
              sourceConversationId: activeConversationId || undefined,
              createdAt: Date.now(),
            });
          }
        });
      }

      // Add Decisions
      if (extracted.decisions && Array.isArray(extracted.decisions)) {
        extracted.decisions.forEach((dec: string) => {
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: "decision",
            title: dec,
            sourceConversationId: activeConversationId || undefined,
            createdAt: Date.now(),
          });
        });
      }

      // Add Key Points
      if (extracted.keyPoints && Array.isArray(extracted.keyPoints)) {
        extracted.keyPoints.forEach((kp: string) => {
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: "keyPoint",
            title: kp,
            sourceConversationId: activeConversationId || undefined,
            createdAt: Date.now(),
          });
        });
      }

      // Add Questions
      if (extracted.questions && Array.isArray(extracted.questions)) {
        extracted.questions.forEach((q: string) => {
          newItems.push({
            id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            type: "question",
            title: q,
            sourceConversationId: activeConversationId || undefined,
            createdAt: Date.now(),
          });
        });
      }

      if (newItems.length > 0) {
        setAskBoardItems((prev) => [...newItems, ...prev]);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to extract insights to AskBoard.");
    } finally {
      setIsExtractingAskBoard(false);
    }
  };

  // Export all data
  const handleExportData = () => {
    const fullBackup = {
      conversations,
      projects,
      askBoardItems,
      memories,
      settings,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `asko-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full overflow-hidden theme-bg-app theme-text-primary font-sans">
      {/* Conversation Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          setActiveConversationId(id);
          const conv = conversations.find((c) => c.id === id);
          if (conv) {
            setCurrentMode(conv.mode || "general");
            if (conv.projectId) setActiveProjectId(conv.projectId);
          }
          setGenerationError(null);
        }}
        onNewChat={handleNewChat}
        onRenameConversation={(id, newTitle) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
          );
        }}
        onDeleteConversation={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        }}
        onClearAllConversations={() => {
          setConversations([]);
          setActiveConversationId(null);
          storage.saveConversations([]);
        }}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(projId) => setActiveProjectId(projId)}
        onOpenProjectModal={() => setIsProjectModalOpen(true)}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative theme-bg-chat">
        {/* Navigation Header */}
        <Header
          currentMode={currentMode}
          onModeChange={(m) => setCurrentMode(m)}
          activeProject={currentProject}
          onOpenProjectModal={() => setIsProjectModalOpen(true)}
          isPrivateMode={settings.privateMode}
          onTogglePrivateMode={() =>
            setSettings((prev) => ({ ...prev, privateMode: !prev.privateMode }))
          }
          isAskBoardOpen={isAskBoardOpen}
          onToggleAskBoard={() => setIsAskBoardOpen(!isAskBoardOpen)}
          askBoardCount={askBoardItems.length}
          memoryEnabled={settings.memoryEnabled}
          onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onToggleMobileSidebar={() => setIsSidebarOpenMobile(true)}
        />

        {/* Private Mode Banner Alert */}
        {settings.privateMode && (
          <div className="bg-rose-500/10 border-b border-rose-500/30 px-3 sm:px-4 py-1.5 flex items-center justify-center gap-2 text-xs text-rose-600 dark:text-rose-300 font-medium select-none text-center leading-snug">
            <Shield className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
            <span>
              Private Mode Active: This conversation will not be saved to history, and no memories will be recorded.
            </span>
          </div>
        )}

        {/* Chat History or Welcome Screen */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {currentMessages.length === 0 ? (
            <WelcomeScreen
              currentMode={currentMode}
              onSelectPrompt={(prompt, targetMode) => {
                if (targetMode) setCurrentMode(targetMode);
                handleSendMessage(prompt);
              }}
              activeProject={currentProject}
              isPrivateMode={settings.privateMode}
            />
          ) : (
            <div className="flex-1 pb-4">
              {currentMessages.map((msg, index) => {
                const isLatestModel =
                  msg.role === "model" && index === currentMessages.length - 1;

                return (
                  <ChatMessageItem
                    key={msg.id}
                    message={msg}
                    isLatestModelMessage={isLatestModel}
                    isGenerating={isGenerating}
                    onRegenerate={isLatestModel ? handleRegenerate : undefined}
                    onActionClick={handleActionClick}
                    onSaveMemory={(fact) => {
                      setMemories((prev) => [
                        { id: `mem-${Date.now()}`, text: fact, createdAt: Date.now() },
                        ...prev,
                      ]);
                      setPendingMemoryFact(null);
                    }}
                    onAddToAskBoard={(text) => handleExtractAskBoard(text)}
                    pendingMemoryFact={isLatestModel ? pendingMemoryFact : null}
                    onDismissMemoryFact={() => setPendingMemoryFact(null)}
                  />
                );
              })}

              {/* Generating loading indicator */}
              {isGenerating && currentMessages[currentMessages.length - 1]?.role === "user" && (
                <div className="py-5 px-4 sm:px-6 theme-bg-surface-active border-y theme-border">
                  <div className="max-w-4xl mx-auto flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs animate-pulse">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs theme-text-accent font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      <span>Asko is thinking and formulating response...</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Error state with retry */}
              {generationError && (
                <div className="max-w-4xl mx-auto my-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{generationError}</span>
                  </div>
                  <button
                    onClick={handleRegenerate}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Composer */}
        <ChatInput
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          currentMode={currentMode}
        />
      </div>

      {/* AskBoard Workspace Drawer */}
      <AskBoardDrawer
        isOpen={isAskBoardOpen}
        onClose={() => setIsAskBoardOpen(false)}
        items={askBoardItems}
        onToggleComplete={(id) => {
          setAskBoardItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i))
          );
        }}
        onDeleteItem={(id) => {
          setAskBoardItems((prev) => prev.filter((i) => i.id !== id));
        }}
        onAddItem={(newItem) => {
          setAskBoardItems((prev) => [
            {
              ...newItem,
              id: `item-${Date.now()}`,
              createdAt: Date.now(),
            },
            ...prev,
          ]);
        }}
        onExtractFromConversation={() => handleExtractAskBoard()}
        isExtracting={isExtractingAskBoard}
        currentConversationTitle={activeConversation?.title}
      />

      {/* Project Workspace Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => setActiveProjectId(id)}
        onCreateProject={(proj) => {
          const newProj: Project = {
            ...proj,
            id: `proj-${Date.now()}`,
            createdAt: Date.now(),
          };
          setProjects((prev) => [...prev, newProj]);
          setActiveProjectId(newProj.id);
        }}
        onDeleteProject={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          if (activeProjectId === id) setActiveProjectId(null);
        }}
      />

      {/* User-Controlled Memory Modal */}
      <MemoryModal
        isOpen={isMemoryModalOpen}
        onClose={() => setIsMemoryModalOpen(false)}
        memories={memories}
        memoryEnabled={settings.memoryEnabled}
        onToggleMemoryEnabled={() =>
          setSettings((prev) => ({ ...prev, memoryEnabled: !prev.memoryEnabled }))
        }
        onAddMemory={(text) => {
          setMemories((prev) => [
            { id: `mem-${Date.now()}`, text, createdAt: Date.now() },
            ...prev,
          ]);
        }}
        onDeleteMemory={(id) => {
          setMemories((prev) => prev.filter((m) => m.id !== id));
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
        onClearAllConversations={() => {
          setConversations([]);
          setActiveConversationId(null);
          storage.saveConversations([]);
        }}
        onExportData={handleExportData}
        onOpenMemoryModal={() => {
          setIsSettingsModalOpen(false);
          setIsMemoryModalOpen(true);
        }}
      />
    </div>
  );
}
