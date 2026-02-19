import { GoogleGenAI } from "@google/genai";
import { BeastData } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBeastImage = async (data: BeastData): Promise<string | null> => {
  try {
    const prompt = `
      Create a high-quality, realistic fantasy digital art illustration of a Guardian Beast with the following specifications:
      
      - Stance: ${data.stance}
      - Head: Resembles a ${data.head}
      - Front Limbs: Resembling those of a ${data.frontLimbs}
      - Body/Torso: Resembling a ${data.body}
      - Hind Limbs: Resembling a ${data.hindLimbs}
      ${data.wings && data.wings !== '无' ? `- Wings: ${data.wings}` : ''}
      - Tail: Resembling a ${data.tail}
      - Elemental Aura: ${data.elements.join(', ')}
      - Purpose/Vibe: This beast is designed to ${data.purposes.join(', ')}.
      
      The image should be majestic, mythical, and highly detailed. Center the creature in the frame.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
    });

    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating beast:", error);
    throw error;
  }
};

export const generateEnemyImage = async (level: number): Promise<{image: string, name: string} | null> => {
  try {
    const difficulty = level < 3 ? "small and mischievous" : level < 6 ? "dangerous and wild" : "legendary and terrifying";
    
    const prompt = `
      Create a fantasy digital art illustration of a wild enemy monster. 
      The monster should look ${difficulty}. 
      Examples: Shadow Wolf, Crystal Golem, Swamp Serpent, Iron Bear.
      Make it look hostile but suitable for a game battle sprite.
      Dark background or transparent feel.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    let image = null;
    if (response.candidates && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          image = `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }

    const prefixes = ["暗影", "钢铁", "剧毒", "水晶", "烈焰", "黑暗", "狂暴", "寒冰", "雷霆"];
    const suffixes = ["狼", "熊", "蛇", "魔像", "幼龙", "蜘蛛", "幽灵", "巨蝎", "猛虎"];
    const name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}`;

    return image ? { image, name } : null;

  } catch (error) {
    console.error("Error generating enemy:", error);
    return null;
  }
};