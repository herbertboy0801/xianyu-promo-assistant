import { GoogleGenAI } from "@google/genai";
import { CopyStyle } from "../types";

// Lazy initialization to prevent app crash if key is missing
let ai: GoogleGenAI | null = null;

const getAiClient = () => {
  if (ai) return ai;

  // Try both standard Vite env and the process.env shim
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("⚠️ Gemini API Key is missing. AI features will not work.");
    return null;
  }

  try {
    ai = new GoogleGenAI({ apiKey });
    return ai;
  } catch (e) {
    console.error("Failed to initialize Gemini Client:", e);
    return null;
  }
};

const SYSTEM_INSTRUCTION = `You are an expert social media copywriter for a "Xianyu (Idle Fish) No-Source E-commerce" community. 
Your goal is to help users rewrite product descriptions into engaging social media posts.
Tone: Energetic, persuasive, and authentic.`;

export const generateCopy = async (style: CopyStyle, originalText: string): Promise<string> => {
  const client = getAiClient();
  if (!client) {
    return "⚠️ AI Service Unavailable: API Key is missing. Please check configuration.";
  }

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
    const response = await client.models.generateContent({
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
