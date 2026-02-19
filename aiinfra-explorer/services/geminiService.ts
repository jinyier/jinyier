
import { GoogleGenAI, Type } from "@google/genai";
import { EvolutionGraph } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // Initialize GoogleGenAI with the API key from process.env.API_KEY directly as per guidelines
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async searchRelatedPapers(query: string) {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Search for the latest research papers and technical blog posts related to: ${query}. Focus on AI Infrastructure and LLM optimizations.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;
    // Extract website URLs from groundingMetadata as per grounding rules
    const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(
      (chunk: any) => chunk.web?.uri
    ).filter(Boolean) || [];

    return { text, urls };
  }

  async mapEvolution(paperContents: string[]): Promise<EvolutionGraph> {
    const response = await this.ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze these paper excerpts and build a systematic evolution graph of concepts.
      Focus on how one technique improved upon another (e.g., Attention -> FlashAttention -> FlashAttention-2).
      
      Paper Excerpts:
      ${paperContents.join("\n\n---\n\n")}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nodes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  year: { type: Type.NUMBER },
                  paperId: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ["id", "name", "description", "year", "paperId", "category"]
              }
            },
            edges: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  target: { type: Type.STRING },
                  label: { type: Type.STRING }
                },
                required: ["source", "target", "label"]
              }
            }
          },
          required: ["nodes", "edges"]
        }
      }
    });

    try {
      // Access the .text property directly from response
      return JSON.parse(response.text.trim());
    } catch (e) {
      console.error("Failed to parse evolution graph:", e);
      return { nodes: [], edges: [] };
    }
  }

  async chatWithContext(query: string, context: string, history: any[]) {
    const chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: `You are AIInfra Expert. Help users understand LLM infrastructure using the provided context and your own knowledge. Ground your answers in reality.`,
        tools: [{ googleSearch: {} }]
      }
    });

    // sendMessage only accepts message parameter, grounding URLs are extracted from candidates
    const response = await chat.sendMessage({
        message: `Context from research: ${context}\n\nUser Question: ${query}`
    });

    return {
      text: response.text,
      // Always extract URLs from groundingChunks when search grounding is used
      urls: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => c.web?.uri).filter(Boolean) || []
    };
  }
}

export const gemini = new GeminiService();
