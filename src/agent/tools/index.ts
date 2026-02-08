// All tools combined for the agent
import { getDateTime } from "./dateTime";
import { readFile, writeFile, listFiles, deleteFile } from "./file.ts";
import {googleSearch} from "./googleSearch.ts"
import { runCommand } from "./shell.ts";
export { runCommand } from "./shell.ts";

// All tools combined for the agent
export const tools = {
  getDateTime,
  readFile,
  writeFile,
  listFiles,
  deleteFile,
  googleSearch
};

export const shellTools = {
  runCommand
};

// Export individual tools for selective use in evals
export { readFile, writeFile, listFiles, deleteFile} from "./file.ts";

// Tool sets for evals
export const fileTools = {
  readFile,
  writeFile,
  listFiles,
  deleteFile,
};