// Client-side message type
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: "pending" | "streaming" | "complete" | "error";
}

// Server-side message format (from agent state sync)
export interface ServerStateMessage {
  role: "user" | "assistant" | "tool";
  content: string | unknown[];
}

// WebSocket message types from server
export interface SyncMessage {
  type: "sync";
  messages: ServerStateMessage[];
}

export interface TextStartMessage {
  type: "text-start";
  id: string;
}

export interface TextDeltaMessage {
  type: "text-delta";
  id: string;
  delta: string;
}

export interface TextEndMessage {
  type: "text-end";
  id: string;
}

export interface ToolInputMessage {
  type: "tool-input-available";
  toolCallId: string;
  toolName: string;
  input: unknown;
}

export interface ToolOutputMessage {
  type: "tool-output-available";
  toolCallId: string;
  output: string;
}

export interface DoneMessage {
  type: "done";
}

export interface ErrorMessage {
  type: "error";
  error: string;
}

export type ServerMessage =
  | SyncMessage
  | TextStartMessage
  | TextDeltaMessage
  | TextEndMessage
  | ToolInputMessage
  | ToolOutputMessage
  | DoneMessage
  | ErrorMessage;
