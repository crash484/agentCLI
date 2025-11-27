import { Agent, type Connection } from "agents";
import { streamText, type ModelMessage } from "ai";
import type { Env, AgentState } from "../types";
import { createOpenAI } from "@ai-sdk/openai";
import { tools, executeToolCalls, type ToolCall } from "./tools";

export class SupportAgent extends Agent<Env, AgentState> {
  // Initialize state with empty messages array
  initialState: AgentState = {
    messages: [],
  };

  // Keep WebSocket handler for reference (not actively used)
  onMessage(connection: Connection, message: string | ArrayBuffer): void {
    connection.send("hello world");
  }

  private getOpenAIProvider() {
    const openai = createOpenAI({
      apiKey: this.env.OPENAI_API_KEY,
    });

    return openai("gpt-5");
  }

  // Generate unique IDs for messages
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // HTTP/SSE handler for chat requests
  async onRequest(request: Request): Promise<Response> {
    // Handle GET requests - return conversation history
    if (request.method === "GET") {
      return new Response(JSON.stringify({ messages: this.state.messages }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only handle POST requests for chat
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Parse the request body - expects a single message
    let body: { message?: { role: string; content: string } };
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    if (!body.message || typeof body.message.content !== "string") {
      return new Response("Missing message object", { status: 400 });
    }

    // Append user message to state
    const userMessage: ModelMessage = {
      role: "user",
      content: body.message.content,
    };
    const messages: ModelMessage[] = [...this.state.messages, userMessage];
    this.setState({ ...this.state, messages });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const self = this;

    const stream = new ReadableStream({
      async start(controller) {
        await self.runAgentLoop(messages, controller, encoder);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "x-vercel-ai-ui-message-stream": "v1",
      },
    });
  }

  // Manual agent loop with streaming
  private async runAgentLoop(
    messages: ModelMessage[],
    controller: ReadableStreamDefaultController,
    encoder: TextEncoder,
  ): Promise<void> {
    const MAX_ITERATIONS = 10;
    let iterations = 0;

    // Helper to send SSE data
    const send = (data: unknown) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    try {
      while (iterations < MAX_ITERATIONS) {
        iterations++;

        const result = streamText({
          model: this.getOpenAIProvider(),
          providerOptions: {
            openai: {
              reasoningEffort: "medium",
            },
          },
          system:
            "You are a helpful customer support agent. You have access to tools: getWeather (get weather for a location) and getTime (get current time). Use them when relevant to help the user.",
          messages,
          tools,
        });

        const messageId = this.generateId();
        let textStarted = false;

        // Stream the response chunks (emit events for UI feedback)
        for await (const chunk of result.fullStream) {
          switch (chunk.type) {
            case "text-delta":
              if (!textStarted) {
                send({ type: "text-start", id: messageId });
                textStarted = true;
              }
              send({ type: "text-delta", id: messageId, delta: chunk.text });
              break;

            case "tool-call":
              // Stream tool call to client for UI feedback
              send({
                type: "tool-input-available",
                toolCallId: chunk.toolCallId,
                toolName: chunk.toolName,
                input: chunk.input,
              });
              break;
          }
        }

        // Close text if we started it
        if (textStarted) {
          send({ type: "text-end", id: messageId });
        }

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
          send({
            type: "tool-output-available",
            toolCallId: toolResult.toolCallId,
            output: toolResult.result,
          });

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
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
    } catch (error) {
      console.error("Agent loop error:", error);
      send({
        type: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      controller.close();
    }
  }
}
