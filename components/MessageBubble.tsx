import { ChatMessage } from "@/lib/types";
import CodeBlock from "./CodeBlock";
import { Sparkles } from "lucide-react";

/** Splits message content into plain-text and fenced-code segments. */
function parseSegments(content: string) {
  const segments: { type: "text" | "code"; content: string; lang?: string }[] = [];
  const fenceRegex = /```(\w*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "code", content: match[2].replace(/\n$/, ""), lang: match[1] });
    lastIndex = fenceRegex.lastIndex;
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }
  return segments;
}

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const segments = parseSegments(message.content);

  return (
    <div
      className={`flex gap-2.5 animate-fadeIn ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center mt-0.5">
          <Sparkles size={14} />
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[75%] ${
          isUser
            ? "bg-brand-500 text-white rounded-chat rounded-tr-md"
            : "bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-chat rounded-tl-md"
        } px-4 py-2.5`}
      >
        {segments.map((seg, i) =>
          seg.type === "code" ? (
            <CodeBlock key={i} code={seg.content} language={seg.lang} />
          ) : (
            seg.content.trim() && (
              <p
                key={i}
                className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed ${
                  isUser ? "text-white" : "text-ink-light dark:text-ink-dark"
                }`}
              >
                {seg.content.trim()}
              </p>
            )
          )
        )}
      </div>
    </div>
  );
}
