import { tool } from "ai";
import { z } from "zod";

// Input schema for the tool
export const getTimeInputSchema = z.object({
  timezone: z
    .string()
    .optional()
    .describe("The timezone to get time for (e.g., 'America/New_York')"),
});

// Tool definition for LLM (no execute - we handle that manually)
export const getTimeTool = tool({
  description: "Get the current time, optionally for a specific timezone",
  inputSchema: getTimeInputSchema,
});

// Tool implementation
export async function getTime(
  input: z.infer<typeof getTimeInputSchema>
): Promise<string> {
  const now = new Date();
  const timezone = input.timezone || "UTC";
  // Static response for now
  return `The current time in ${timezone} is ${now.toISOString()}.`;
}
