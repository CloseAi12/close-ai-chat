import { ChatMessage } from "./types";

interface StreamChatArgs {
  messages: ChatMessage[];
  conversationId: string;
  signal: AbortSignal;
  onDelta: (textChunk: string) => void;
}

/**
 * Sends the conversation to POST /api/chat and streams the reply back.
 *
 * Contract expected from the backend (Part 1):
 *   POST /api/chat
 *   body: { conversationId: string, messages: { role: "user"|"assistant", content: string }[] }
 *   response: a streamed body, either
 *     - Server-Sent-Events style lines: `data: {"content":"..."}\n\n` ending in `data: [DONE]`
 *     - or plain incremental text chunks
 *   Both shapes are handled below — adjust `parseChunk` if your backend uses a different envelope.
 */
export async function streamChat({
  messages,
  conversationId,
  signal,
  onDelta,
}: StreamChatArgs): Promise<void> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
    signal,
  });

  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on double-newline for SSE frames, but fall back gracefully
    // to raw text if the backend isn't sending an SSE envelope at all.
    const looksLikeSSE = buffer.includes("data:");
    if (looksLikeSSE) {
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const delta =
            json.content ?? json.delta ?? json.text ?? json.token ?? "";
          if (delta) onDelta(delta);
        } catch {
          // not JSON — treat the raw payload as text
          if (payload) onDelta(payload);
        }
      }
    } else {
      // Plain text stream: emit as it arrives.
      if (buffer) {
        onDelta(buffer);
        buffer = "";
      }
    }
  }

  // Flush any trailing plain-text buffer that wasn't SSE-framed.
  if (buffer && !buffer.startsWith("data:")) {
    onDelta(buffer);
  }
}
