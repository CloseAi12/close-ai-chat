"use client";

import { useEffect, useRef, useState } from "react";
import {
  Menu,
  Send,
  Sun,
  Moon,
  Sparkles,
  Square,
  Languages,
} from "lucide-react";
import Sidebar from "./Sidebar";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import VoiceInputButton from "./VoiceInputButton";
import { ChatMessage, Conversation } from "@/lib/types";
import {
  loadConversations,
  saveConversations,
  loadTheme,
  saveTheme,
  newId,
  titleFromMessage,
} from "@/lib/storage";
import { streamChat } from "@/lib/streamChat";

export default function ChatInterface() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [voiceLang, setVoiceLang] = useState<"en-US" | "ur-PK">("en-US");
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = loadConversations();
    setConversations(stored);
    if (stored.length > 0) {
      setActiveId([...stored].sort((a, b) => b.updatedAt - a.updatedAt)[0].id);
    }
    const storedTheme = loadTheme();
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setTheme(storedTheme ?? (prefersDark ? "dark" : "light"));
    hydrated.current = true;
  }, []);

  // Persist conversations
  useEffect(() => {
    if (hydrated.current) saveConversations(conversations);
  }, [conversations]);

  // Apply theme class + persist
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    if (hydrated.current) saveTheme(theme);
  }, [theme]);

  // Auto-scroll to bottom on new content
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [conversations, activeId]);

  // Auto-grow textarea
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
  }, [input]);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  function createConversation(): Conversation {
    const conv: Conversation = {
      id: newId(),
      title: "New chat",
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
    return conv;
  }

  function handleNewChat() {
    createConversation();
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  function handleRename(id: string, title: string) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c))
    );
  }

  function handleDelete(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  function stopStreaming() {
    abortRef.current?.abort();
    setIsStreaming(false);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    setError(null);
    setInput("");

    let conv = activeConversation;
    if (!conv) conv = createConversation();

    const userMsg: ChatMessage = {
      id: newId(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };

    const isFirstMessage = conv.messages.length === 0;
    const historyWithUser = [...conv.messages, userMsg];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv!.id
          ? {
              ...c,
              messages: historyWithUser,
              title: isFirstMessage ? titleFromMessage(text) : c.title,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    const assistantMsg: ChatMessage = {
      id: newId(),
      role: "assistant",
      content: "",
      createdAt: Date.now(),
    };

    setIsStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    // Insert an empty assistant placeholder to stream into
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conv!.id ? { ...c, messages: [...historyWithUser, assistantMsg] } : c
      )
    );

    try {
      await streamChat({
        messages: historyWithUser,
        conversationId: conv.id,
        signal: controller.signal,
        onDelta: (chunk) => {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== conv!.id) return c;
              const msgs = c.messages.map((m) =>
                m.id === assistantMsg.id ? { ...m, content: m.content + chunk } : m
              );
              return { ...c, messages: msgs, updatedAt: Date.now() };
            })
          );
        },
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        setError("Message bhejne mein masla hua. Dobara koshish karein.");
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const showTyping =
    isStreaming &&
    activeConversation?.messages.length &&
    activeConversation.messages[activeConversation.messages.length - 1].content === "";

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-canvas-light dark:bg-canvas-dark">
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSelect={(id) => {
          setActiveId(id);
          setSidebarOpen(false);
        }}
        onNew={handleNewChat}
        onRename={handleRename}
        onDelete={handleDelete}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 flex items-center justify-between px-3 sm:px-4 border-b border-line-light dark:border-line-dark bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1.5 rounded-lg hover:bg-line-light dark:hover:bg-line-dark flex-shrink-0"
              aria-label="Open sidebar"
            >
              <Menu size={19} />
            </button>
            <span className="font-display font-bold text-sm truncate">
              {activeConversation?.title ?? "Close AI"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setVoiceLang((l) => (l === "en-US" ? "ur-PK" : "en-US"))}
              className="flex items-center gap-1 text-xs font-medium px-2 py-1.5 rounded-lg hover:bg-line-light dark:hover:bg-line-dark"
              title="Voice input language"
            >
              <Languages size={15} />
              {voiceLang === "en-US" ? "EN" : "UR"}
            </button>
            <button
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              className="p-1.5 rounded-lg hover:bg-line-light dark:hover:bg-line-dark"
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 space-y-5">
            {!activeConversation || activeConversation.messages.length === 0 ? (
              <EmptyState onPrompt={(p) => setInput(p)} />
            ) : (
              activeConversation.messages.map((m) =>
                m.content === "" && m.role === "assistant" ? null : (
                  <MessageBubble key={m.id} message={m} />
                )
              )
            )}
            {showTyping && <TypingIndicator />}
            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-line-light dark:border-line-dark bg-surface-light dark:bg-surface-dark px-3 sm:px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <VoiceInputButton
              lang={voiceLang}
              onResult={(t) => setInput((prev) => (prev ? prev + " " + t : t))}
            />
            <div className="flex-1 flex items-end bg-canvas-light dark:bg-canvas-dark border border-line-light dark:border-line-dark rounded-2xl px-3 py-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Apna message likhein — Roman Urdu, اردو, ya English..."
                className="flex-1 resize-none bg-transparent outline-none text-[15px] leading-relaxed max-h-40 placeholder:text-muted-light dark:placeholder:text-muted-dark"
              />
            </div>
            {isStreaming ? (
              <button
                onClick={stopStreaming}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-ink-light dark:bg-ink-dark text-canvas-light dark:text-canvas-dark flex items-center justify-center"
                aria-label="Stop generating"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="flex-shrink-0 w-9 h-9 rounded-full bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white flex items-center justify-center transition-colors"
                aria-label="Send message"
              >
                <Send size={15} />
              </button>
            )}
          </div>
          <p className="max-w-3xl mx-auto text-[11px] text-muted-light dark:text-muted-dark mt-1.5 px-1">
            Enter se bhejein, Shift+Enter se nayi line.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPrompt }: { onPrompt: (text: string) => void }) {
  const suggestions = [
    "Mujhe ek short story likh kar dein",
    "اردو میں موسم پر ایک نظم لکھیں",
    "Explain recursion with a simple example",
    "Karachi mein weekend trip plan karein",
  ];
  return (
    <div className="flex flex-col items-center justify-center text-center pt-10 sm:pt-16">
      <div className="w-12 h-12 rounded-full bg-brand-500 text-white flex items-center justify-center mb-4">
        <Sparkles size={22} />
      </div>
      <h1 className="font-display font-extrabold text-xl sm:text-2xl mb-1.5">
        Close AI mein khush aamdeed
      </h1>
      <p className="text-sm text-muted-light dark:text-muted-dark max-w-sm mb-6">
        Roman Urdu, Urdu, ya English — jis zaban mein chahein, likhein ya bolein.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPrompt(s)}
            className="text-left text-sm px-3.5 py-2.5 rounded-xl border border-line-light dark:border-line-dark hover:bg-line-light/50 dark:hover:bg-line-dark/50 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
