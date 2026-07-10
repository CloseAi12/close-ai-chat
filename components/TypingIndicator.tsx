import { Sparkles } from "lucide-react";

export default function TypingIndicator() {
  return (
    <div className="flex gap-2.5 animate-fadeIn">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center mt-0.5">
        <Sparkles size={14} />
      </div>
      <div className="flex items-center gap-1.5 bg-surface-light dark:bg-surface-dark border border-line-light dark:border-line-dark rounded-chat rounded-tl-md px-4 py-3">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
      </div>
    </div>
  );
}
