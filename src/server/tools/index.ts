import { getWeatherTool, getWeather } from "./getWeather";
import { getTimeTool, getTime } from "./getTime";

// All tool definitions to pass to the LLM
export const tools = {
  getWeather: getWeatherTool,
  getTime: getTimeTool,
};

// Tool name type for type safety
export type ToolName = keyof typeof tools;

// Tool call structure from AI SDK
export interface ToolCall {
  toolCallId: string;
  toolName: string;
  input: unknown;
}

// Tool result structure for messages
export interface ToolResult {
  toolCallId: string;
  toolName: string;
  result: string;
}

// Map of tool implementations
const toolImplementations: Record<
  ToolName,
  (input: unknown) => Promise<string>
> = {
  getWeather: (input) => getWeather(input as Parameters<typeof getWeather>[0]),
  getTime: (input) => getTime(input as Parameters<typeof getTime>[0]),
};

// Execute a single tool call
export async function executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
  const { toolCallId, toolName, input } = toolCall;

  const implementation = toolImplementations[toolName as ToolName];

  if (!implementation) {
    return {
      toolCallId,
      toolName,
      result: `Error: Unknown tool "${toolName}"`,
    };
  }

  try {
    const result = await implementation(input);
    return { toolCallId, toolName, result };
  } catch (error) {
    return {
      toolCallId,
      toolName,
      result: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Execute multiple tool calls in parallel
export async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<ToolResult[]> {
  return Promise.all(toolCalls.map(executeToolCall));
}
