import { GoogleGenAI } from "@google/genai";
import { CopyStyle } from "../types";

// Initialize the client with the API key from the environment
// Note: In a real production app, backend proxy is recommended to hide the key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `You are an expert social media copywriter for a "Xianyu (Idle Fish) No-Source E-commerce" community. 
Your goal is to help users rewrite product descriptions into engaging social media posts.
Tone: Energetic, persuasive, and authentic.`;

export const generateCopy = async (style: CopyStyle, originalText: string): Promise<string> => {
  const modelId = "gemini-2.5-flash";
  
  let prompt = "";

  if (style === 'xiaohongshu') {
    prompt = `
      Please rewrite the following product text into a "XiaoHongShu (Little Red Book)" style post.
      Requirements:
      1. Use an excited, sharing tone.
      2. Use plenty of emojis (🔥, 💰, ✨, 📦).
      3. Emphasize "Side hustle", "No stock needed", "High profit".
      4. Add relevant hashtags at the end (e.g., #闲鱼赚钱 #副业 #选品).
      5. Keep paragraphs short.
      
      Original Text: "${originalText}"
    `;
  } else {
    prompt = `
      Please rewrite the following product text into a "WeChat Moments" style post.
      Requirements:
      1. Sincere, personal tone (like sharing with friends).
      2. Emphasize "Personally tested", "Effective", "Real results".
      3. Short and punchy. Less emojis, more text focused.
      4. Focus on the value proposition.

      Original Text: "${originalText}"
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      }
    });

    return response.text || "AI generation failed. Please try again.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please check your network or API Key.";
  }
};
