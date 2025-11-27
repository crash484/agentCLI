import { Agent, type Connection, type ConnectionContext } from "agents";
import { streamText, type ModelMessage } from "ai";
import type { Env, AgentState } from "../types";
import { createOpenAI } from "@ai-sdk/openai";
import { tools, executeToolCalls, type ToolCall } from "./tools";
import { createStreamHandler, type StreamChunk } from "./stream";

// WebSocket message types
interface ChatMessage {
  type: "chat";
  content: string;
}

type ClientMessage = ChatMessage;

export class SupportAgent extends Agent<Env, AgentState> {
  // Initialize state with empty messages array
  initialState: AgentState = {
    messages: [],
  };

  // Send current message history when client connects
  onConnect(connection: Connection, ctx: ConnectionContext): void {
    connection.send(
      JSON.stringify({
        type: "sync",
        messages: this.state.messages,
      }),
    );
  }

  // Handle incoming WebSocket messages
  async onMessage(
    connection: Connection,
    message: string | ArrayBuffer,
  ): Promise<void> {
    try {
      const data: ClientMessage = JSON.parse(message.toString());

      if (data.type === "chat") {
        // Add user message to state
        const userMessage: ModelMessage = {
          role: "user",
          content: data.content,
        };
        const messages: ModelMessage[] = [...this.state.messages, userMessage];
        this.setState({ ...this.state, messages });

        // Run agent loop and stream responses
        await this.runAgentLoop(messages, connection);
      }
    } catch (error) {
      console.error("Error handling message:", error);
      connection.send(
        JSON.stringify({
          type: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        }),
      );
    }
  }

  // Optional cleanup on disconnect
  onClose(connection: Connection): void {
    // No cleanup needed for now
  }

  private getOpenAIProvider() {
    const openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
    });

    return openai("gpt-4o");
  }

  // Agent loop with WebSocket streaming
  private async runAgentLoop(
    messages: ModelMessage[],
    connection: Connection,
  ): Promise<void> {
    const MAX_ITERATIONS = 10;
    let iterations = 0;
    const stream = createStreamHandler(connection);

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const result = streamText({
          model: this.getOpenAIProvider(),
          system:
            "You are a helpful customer support agent. You have access to tools: getWeather (get weather for a location) and getTime (get current time). Use them when relevant to help the user.",
          messages,
          tools,
        });

        // Stream the response chunks using StreamHandler
        for await (const chunk of result.fullStream) {
          stream.processChunk(chunk as StreamChunk);
        }

        // Close text stream if one was started
        stream.finishText();

        // Get the response messages (includes assistant message with tool calls)
        const responseMessages = (await result.response).messages;
        messages.push(...responseMessages);

        // Check if we should continue the loop
        const finishReason = await result.finishReason;
        if (finishReason !== "tool-calls") {
          // No more tool calls, we're done
          break;
        }

        // Get tool calls from the result and execute them
        const toolCalls = await result.toolCalls;
        const toolCallsForExecution: ToolCall[] = toolCalls.map((tc) => ({
          toolCallId: tc.toolCallId,
          toolName: tc.toolName,
          input: tc.input,
        }));
        const toolResults = await executeToolCalls(toolCallsForExecution);

        // Stream tool outputs to client and add to messages
        for (const toolResult of toolResults) {
          stream.toolOutput(toolResult.toolCallId, toolResult.result);

          // Add tool result to messages for next iteration
          const toolMessage: ModelMessage = {
            role: "tool",
            content: [
              {
                type: "tool-result",
                toolCallId: toolResult.toolCallId,
                toolName: toolResult.toolName,
                output: { type: "text" as const, value: toolResult.result },
              },
            ],
          };
          messages.push(toolMessage);
        }
      }

      // Save final state with all messages
      this.setState({ ...this.state, messages });

      // Send done signal
      stream.done();
    } catch (error) {
      console.error("Agent loop error:", error);
      stream.error(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
