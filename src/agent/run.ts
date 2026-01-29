import "dotenv/config";
import {generateText, tool, type ModelMessage} from "ai"
import {google} from "@ai-sdk/google"
import { SYSTEM_PROMPT } from "./system/prompt"
import type { AgentCallbacks } from "../types" 

import {tools} from "./tools/index.ts"
import { executeTool } from "./executeTool.ts";


const MODEL_NAME="gemini-2.5-flash"
//console.log(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

export const runAgent = async(
    userMessage: string, 
    conversationHistory: ModelMessage[], 
    callbacks: AgentCallbacks
 ):Promise<any>=>{
    const {text,toolCalls} = await generateText({
        model: google(MODEL_NAME),
        prompt: userMessage,
        system: SYSTEM_PROMPT,
        tools,
    });
    console.log(text,toolCalls);

    toolCalls.forEach(async (tc)=>{
       console.log( await executeTool(tc.toolName,tc.input) );
    })
 }

runAgent('what is the current time right now');