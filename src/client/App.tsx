import { useState, useCallback } from "react";
import { useAgent } from "agents/react";
import { ChatContainer } from "./components";
import type { Message, ServerMessage, ServerStateMessage } from "./types";

// Generate unique IDs for messages
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Extract text content from server message (handles both string and array formats)
function extractContent(content: string | unknown[]): string {
  if (typeof content === "string") {
    return content;
  }

  // AI SDK ModelMessage format: content is array of content parts
  if (Array.isArray(content)) {
    return content
      .filter((part): part is { type: string; text?: string } =>
        typeof part === "object" && part !== null && "type" in part
      )
      .filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("");
  }

  return "";
}

// Convert server state messages to client format
function convertServerMessages(serverMessages: ServerStateMessage[]): Message[] {
  return serverMessages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m, index) => ({
      id: `sync_${index}`,
      role: m.role as "user" | "assistant",
      content: extractContent(m.content),
      status: "complete" as const,
    }));
}

export function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: ServerMessage = JSON.parse(event.data);

      switch (data.type) {
        case "sync":
          // Initial state sync - convert and set messages
          setMessages(convertServerMessages(data.messages));
          break;

        case "text-start":
          // New assistant message starting
          setIsStreaming(true);
          setCurrentMessageId(data.id);
          setMessages((prev) => [
            ...prev,
            {
              id: data.id,
              role: "assistant",
              content: "",
              status: "streaming",
            },
          ]);
          break;

        case "text-delta":
          // Append text to current message
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id
                ? { ...msg, content: msg.content + data.delta }
                : msg
            )
          );
          break;

        case "text-end":
          // Mark message as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === data.id ? { ...msg, status: "complete" } : msg
            )
          );
          break;

        case "tool-input-available":
          // Tool is being called (optional UI feedback)
          break;

        case "tool-output-available":
          // Tool completed (optional UI feedback)
          break;

        case "done":
          // Conversation turn complete
          setIsStreaming(false);
          setCurrentMessageId(null);
          break;

        case "error":
          // Handle error
          setIsStreaming(false);
          setCurrentMessageId(null);
          if (currentMessageId) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === currentMessageId
                  ? { ...msg, status: "error", content: msg.content || data.error }
                  : msg
              )
            );
          }
          break;
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }, [currentMessageId]);

  const agent = useAgent({
    agent: "SupportAgent",
    name: "default",
    onMessage: handleMessage,
    onOpen: () => {
      setIsConnected(true);
    },
    onClose: () => {
      setIsConnected(false);
      setIsStreaming(false);
    },
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!agent || isStreaming) return;

      // Add optimistic user message
      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content,
        status: "complete",
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to agent
      agent.send(JSON.stringify({ type: "chat", content }));
    },
    [agent, isStreaming]
  );

  // Show loading state while connecting
  if (!isConnected) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--accent-blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatContainer
      messages={messages}
      onSend={sendMessage}
      isStreaming={isStreaming}
    />
  );
}
