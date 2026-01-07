
import { GoogleGenAI, Type, Modality } from "@google/genai";

// Use an environment-variable based API key directly without default values to follow security guidelines
export const getFlavorRecommendation = async (userPrompt: string) => {
  // Initialize GoogleGenAI within the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User asks: ${userPrompt}. Based on our premium ice cream menu (Charcoal, Lavender, Miso Caramel, Dragonfruit, Matcha), suggest the best flavor and explain why.`,
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
    
    // Use the .text property getter to extract the response string
    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Error:", error);
    return { flavor: "Classic Vanilla", reason: "Something went wrong, but you can never go wrong with a classic.", adjectives: ["Simple"] };
  }
};

export const startVoiceOrderingSession = async (callbacks: any) => {
  // Initialize GoogleGenAI within the function to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      // responseModalities must contain exactly one Modality.AUDIO element
      responseModalities: [Modality.AUDIO],
      systemInstruction: "You are the Glacier AI voice concierge. You help customers choose ice cream and place orders. Keep it helpful, premium, and concise. Our flavors: Midnight Charcoal, Honey Lavender, Salted Miso Caramel, Dragonfruit Lychee, Matcha White Truffle."
    }
  });
};