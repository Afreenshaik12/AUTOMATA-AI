import { GoogleGenAI } from "@google/genai";

// 1. Grab the key based on your setup
const apiKey = import.meta.env.VITE_GEMINI_API_KEY; // Change to process.env.REACT_APP_GEMINI_API_KEY if using CRA

// 2. Initialize the client
const ai = new GoogleGenAI({ apiKey });

export async function generatePracticeQuestion() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Generate a DFA practice question to convert to a Regular Expression. Return ONLY a JSON object with keys: 'question', 'difficulty', and 'regexAnswer'.",
      config: {
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}