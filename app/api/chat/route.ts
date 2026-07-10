import { NextRequest } from "next/server";

export const runtime = "edge";

/**
 * This is a placeholder implementation so the chat UI works out of the box.
 * Replace the body of this handler with your Part 1 backend logic
 * (e.g. calling the Anthropic/OpenAI API and forwarding the real stream).
 *
 * The frontend (lib/streamChat.ts) already understands two response shapes:
 *   1. SSE frames:  `data: {"content":"..."}\n\n` ... `data: [DONE]\n\n`
 *   2. Plain incremental text chunks
 * Keep whichever shape your real backend already produces — no frontend
 * changes needed either way.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const messages = body?.messages ?? [];
  const lastUserMessage =
    [...messages].reverse().find((m: any) => m.role === "user")?.content ?? "";

  const reply = buildMockReply(lastUserMessage);
  const words = reply.split(" ");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      for (const word of words) {
        const frame = `data: ${JSON.stringify({ content: word + " " })}\n\n`;
        controller.enqueue(encoder.encode(frame));
        // simulate token-by-token generation latency
        await new Promise((r) => setTimeout(r, 35));
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildMockReply(userText: string): string {
  if (!userText) {
    return "Hi, main Close AI hoon. Aap mujhse kuch bhi puch sakte hain — Roman Urdu, Urdu, ya English mein.";
  }
  return `Yeh ek demo response hai for: "${userText}". Is /api/chat route ko apne Part 1 backend se replace kar dein taake asal AI reply aaye. Example ke tor par yahan kuch code bhi hai:\n\n\`\`\`js\nfunction greet(name) {\n  return \`Hello, ${"$"}{name}!\`;\n}\n\`\`\`\n\nAap is route.ts file mein apna model call laga sakte hain.`;
}
