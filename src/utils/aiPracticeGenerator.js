import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

export async function fetchAIPracticeQuestions(config) {
  const prompt = `Generate ${config.count} DFA to Regular Expression conversion questions at ${config.difficulty} difficulty level using the ${config.method} method.
  
Return ONLY a JSON array where each object has these exact keys:
[
  {
    "id": "q1",
    "dfa": {
      "nodes": [
        { "id": "q0", "label": "q0", "type": "start", "x": 150, "y": 200 },
        { "id": "q1", "label": "q1", "type": "accept", "x": 450, "y": 200 }
      ],
      "transitions": [
        { "id": "t1", "from": "q0", "to": "q1", "symbol": "a" }
      ]
    },
    "options": [
      { "id": "A", "regex": "a", "isCorrect": true, "explanationIfChosen": "" },
      { "id": "B", "regex": "a*", "isCorrect": false, "explanationIfChosen": "Incorrect loop assumption." },
      { "id": "C", "regex": "b", "isCorrect": false, "explanationIfChosen": "Wrong transition symbol." },
      { "id": "D", "regex": "(a|b)*", "isCorrect": false, "explanationIfChosen": "Too broad." }
    ],
    "hint": "Trace the path from the start state q0 to the accept state q1.",
    "stepByStepSolution": [
      { "stepNumber": 1, "formulaLaTeX": "q_1 = q_0 \\cdot a" }
    ]
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
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