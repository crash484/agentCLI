import type { Connection } from "agents";

// Generate unique IDs for messages
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// StreamHandler wraps a WebSocket connection and provides typed methods for streaming events
export interface StreamHandler {
  // Text streaming lifecycle
  textStart(id: string): void;
  textDelta(id: string, text: string): void;
  textEnd(id: string): void;

  // Tool events
  toolInput(toolCallId: string, toolName: string, input: unknown): void;
  toolOutput(toolCallId: string, output: string): void;

  // Completion signals
  done(): void;
  error(message: string): void;

  // Process a fullStream chunk and emit appropriate events
  // Returns the message ID being used for text streaming
  processChunk(chunk: StreamChunk): string;

  // End the current text stream if one was started
  // Call this after processing all chunks from a stream iteration
  finishText(): void;
}

// Accept any chunk with a type field - we only process the ones we care about
export type StreamChunk = { type: string; [key: string]: unknown };

// Create a StreamHandler for a WebSocket connection
export function createStreamHandler(connection: Connection): StreamHandler {
  let currentMessageId: string | null = null;
  let textStarted = false;

  const send = (data: unknown) => {
    connection.send(JSON.stringify(data));
  };

  return {
    textStart(id: string) {
      send({ type: "text-start", id });
    },

    textDelta(id: string, text: string) {
      send({ type: "text-delta", id, delta: text });
    },

    textEnd(id: string) {
      send({ type: "text-end", id });
    },

    toolInput(toolCallId: string, toolName: string, input: unknown) {
      send({
        type: "tool-input-available",
        toolCallId,
        toolName,
        input,
      });
    },

    toolOutput(toolCallId: string, output: string) {
      send({
        type: "tool-output-available",
        toolCallId,
        output,
      });
    },

    done() {
      send({ type: "done" });
    },

    error(message: string) {
      send({ type: "error", error: message });
    },

    processChunk(chunk: StreamChunk): string {
      // Generate message ID on first use
      if (!currentMessageId) {
        currentMessageId = generateId();
      }

      if (chunk.type === "text-delta") {
        if (!textStarted) {
          this.textStart(currentMessageId);
          textStarted = true;
        }
        this.textDelta(currentMessageId, chunk.text as string);
      } else if (chunk.type === "tool-call") {
        this.toolInput(
          chunk.toolCallId as string,
          chunk.toolName as string,
          chunk.input
        );
      }
      // Other chunk types are ignored

      return currentMessageId;
    },

    finishText() {
      if (textStarted && currentMessageId) {
        this.textEnd(currentMessageId);
        // Reset for next iteration
        textStarted = false;
        currentMessageId = null;
      }
    },
  };
}
