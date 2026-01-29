import "dotenv/config";
import {generateText, stepCountIs, tool, type ModelMessage,streamText} from "ai"
import { getTracer, Laminar } from "@lmnr-ai/lmnr";
import {google} from "@ai-sdk/google"
import { SYSTEM_PROMPT } from "./system/prompt"
import type { AgentCallbacks, ToolCallInfo } from "../types" 

import {tools} from "./tools/index.ts"
import { executeTool } from "./executeTool.ts";
import { filterCompatibleMessages } from "./system/filterMessages.ts";
import { Input } from '../ui/components/Input';


const MODEL_NAME="gemini-2.5-flash"
//console.log(process.env.GOOGLE_GENERATIVE_AI_API_KEY);

Laminar.initialize({
    projectApiKey:process.env.LMNR_API_KEY,
})

export const runAgent = async(
    userMessage: string, 
    conversationHistory: ModelMessage[], 
    callbacks: AgentCallbacks
 ):Promise<ModelMessage[]>=>{
    
    const workingHistory = filterCompatibleMessages(conversationHistory);

    const messages:ModelMessage[]=[
        {role:"system",content:"SYSTEM_PROMPT"},
        ...workingHistory,
        {role:"user", content: userMessage},
    ];

    let fullResponse = "";

    while(true){
        const result = streamText({
            model: google(MODEL_NAME),
            messages,
            tools,
            experimental_telemetry:{
                isEnabled:true,
                tracer: getTracer(),
            }
        });

        const toolCalls: ToolCallInfo[] = [];
        let currentText = "";
        let streamError: Error | null = null;

        try{
            for await( const chunk of result.fullStream){
                if(chunk.type === "text-delta"){
                    currentText += chunk.text;
                    callbacks.onToken(chunk.text);
                }

                if(chunk.type === "tool-call"){
                    const input = "input" in chunk? chunk.input:{};
                    toolCalls.push({
                        toolCallId:chunk.toolCallId,
                        toolName:chunk.toolName,
                        args: input as Record<string,unknown>,
                    });
                    callbacks.onToolCallStart(chunk.toolName,input);
                }
            }
        } catch(error){
            streamError = error as Error;
            //if some text exist continue process else rethrow if its a no output error

            if(
                !currentText && !streamError.message.includes("No output generated")
            ){
                throw streamError;
            }
        }

        fullResponse += currentText;

        //if steam error with "no output" and we have no text , try to recover
        if(streamError && !currentText){
            fullResponse= " I apologize but i wasnt able to generate a response, could u please try rephrasing ur message";
            callbacks.onToken(fullResponse);
            break;
        }

        const finishReason = await result.finishReason;

        if(finishReason !== "tool-calls" || toolCalls.length === 0){
            const responseMessages = await result.response;
            messages.push(...responseMessages.messages);
            break;
        }

        const responseMessage = await result.response;
        messages.push(...responseMessage.messages);

        for(const tc of toolCalls){
            const result = await executeTool(tc.toolName,tc.args);
            callbacks.onToolCallEnd(tc.toolName,result);

            messages.push({
                role:"tool",
                content: [{
                    type:"tool-result",
                    toolCallId:tc.toolCallId,
                    toolName: tc.toolName,
                    output:{type:"text",value:result},
                }],
            });
        }
    }

    callbacks.onComplete(fullResponse);
     
    return messages;
 }

runAgent('what is the current time right now , convert it to ist');