import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const refineComplaintText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found for Gemini.");
    return text;
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      Actúa como un experto legal en defensa del consumidor. 
      Reescribe el siguiente texto de un reclamo para que sea formal, claro, conciso y profesional, 
      manteniendo todos los hechos importantes pero mejorando la redacción y ortografía.
      
      Texto original: "${text}"
      
      Solo devuelve el texto reescrito, sin introducciones ni explicaciones adicionales.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error refining text with Gemini:", error);
    return text; // Return original text on error
  }
};