import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({});

const groundingTool = {
    googleSearch : {}
};


const config = {
    tools: [groundingTool],
};

export async function googleSearch(){
    const response = await ai.models.generateContent({
        model:"gemini-2.5-flash",
        contents: "",
        config,
    })
}