import { useState, type FormEvent, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <div className="flex items-end gap-3 bg-[var(--bg-secondary)] rounded-3xl px-4 py-3 border border-[var(--border-subtle)]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Support Agent..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent outline-none resize-none text-[var(--text-primary)] placeholder-[var(--text-placeholder)] min-h-[24px] max-h-[200px]"
          style={{ height: "auto" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
          }}
        />
        <button
          type="submit"
          disabled={disabled || !input.trim()}
          className="p-2 bg-[var(--accent-blue)] text-white rounded-full hover:bg-[var(--accent-blue-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <SendHorizontal className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
}
