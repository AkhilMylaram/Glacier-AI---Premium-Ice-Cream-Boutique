
import { GoogleGenAI, Type, Modality } from "@google/genai";

export const getFlavorRecommendation = async (userPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User asks: ${userPrompt}. Based on our premium ice cream menu (Midnight Charcoal, Celestial Saffron, Salted Miso Caramel, Dragonfruit Lychee, Matcha White Truffle, Wild Berry Hibiscus), suggest the best flavor and explain why.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            flavor: { type: Type.STRING },
            reason: { type: Type.STRING },
            adjectives: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["flavor", "reason", "adjectives"]
        }
      }
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return { flavor: "Classic Vanilla", reason: "Something went wrong, but you can never go wrong with a classic.", adjectives: ["Simple"] };
  }
};

export const connectVoiceAssistant = async (callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
      },
      systemInstruction: "You are the Glacier AI sensory concierge. You speak with a calm, premium, and sophisticated tone. Help customers discover artisanal flavors. Our selection: Midnight Charcoal, Celestial Saffron, Salted Miso Caramel, Dragonfruit Lychee, Matcha White Truffle, Wild Berry Hibiscus. Be concise but poetic."
    }
  });
};
