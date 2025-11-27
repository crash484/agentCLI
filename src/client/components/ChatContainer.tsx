import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import type { Message } from "../types";

interface ChatContainerProps {
  messages: Message[];
  onSend: (content: string) => void;
  isStreaming: boolean;
}

export function ChatContainer({
  messages,
  onSend,
  isStreaming,
}: ChatContainerProps) {
  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 border-b border-[var(--border-subtle)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Support Agent
        </h1>
      </header>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Input */}
      <div className="flex-shrink-0 border-t border-[var(--border-subtle)]">
        <ChatInput onSend={onSend} disabled={isStreaming} />
      </div>
    </div>
  );
}
