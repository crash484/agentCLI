import { GoogleGenAI } from "@google/genai";
import { z } from "zod"
import {tool} from "ai"

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});
// const groundingTool = {
//     googleSearch : {}
// };


// const config = {
//     tools: [groundingTool],
// };

// export async function googleSearch(){
//     const response = await ai.models.generateContent({
//         model:"gemini-2.5-flash",
//         contents: "",
//         config,
//     })

//     return response;
// }

export const googleSearch = tool({
    description:"search google for real time info",
    inputSchema: z.object({
        query:z.string()
    }),
    execute: async ({ query }) =>{
        const response = await ai.models.generateContent({
            model:"gemini-2.5-flash",
            contents:query
        });
        
        return response.text ?? JSON.stringify(response);
    },
});