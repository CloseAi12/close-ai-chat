import { Conversation } from "./types";

const CONV_KEY = "close-ai:conversations";
const THEME_KEY = "close-ai:theme";

export function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CONV_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONV_KEY, JSON.stringify(conversations));
  } catch {
    // storage full or unavailable — fail silently, chat still works in-memory
  }
}

export function loadTheme(): "light" | "dark" | null {
  if (typeof window === "undefined") return null;
  const val = window.localStorage.getItem(THEME_KEY);
  return val === "light" || val === "dark" ? val : null;
}

export function saveTheme(theme: "light" | "dark") {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, theme);
}

export function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Derives a short conversation title from the first user message. */
export function titleFromMessage(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "New chat";
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}
