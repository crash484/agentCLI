import { tool } from "ai";
import { z } from "zod";

// Input schema for the tool
export const getWeatherInputSchema = z.object({
  location: z.string().describe("The city or location to get weather for"),
});

// Tool definition for LLM (no execute - we handle that manually)
export const getWeatherTool = tool({
  description: "Get the current weather for a location",
  inputSchema: getWeatherInputSchema,
});

// Tool implementation
export async function getWeather(
  input: z.infer<typeof getWeatherInputSchema>
): Promise<string> {
  // Static response for now
  return `The weather in ${input.location} is sunny with a high of 72°F.`;
}
