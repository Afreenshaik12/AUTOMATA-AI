import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
});

/**
 * Serializes canvas nodes and transitions into textual description for Gemini
 */
export function serializeDfa(nodes, transitions) {
  const stateInfo = nodes.map(n => {
    let typeStr = n.type;
    return `${n.name} (${typeStr})`;
  }).join(', ');

  const transInfo = transitions.map(t => {
    return `${t.from} --${t.label}--> ${t.to}`;
  }).join(', ');

  return `States: ${stateInfo}\nTransitions: ${transInfo}`;
}

export async function generateRegexConversion(dfaDescription, method) {
  const prompt = `
You are an expert in Theoretical Computer Science and Automata Theory.
Given the following DFA description:
${dfaDescription}

Provide a detailed step-by-step conversion to a Regular Expression using "${method}".
- If Arden's Theorem is chosen, state all system equations first ($R_i = Q + R_j P$), then show step-by-step substitution and apply Arden's Rule ($R = Q + RP \\implies R = QP^*$).
- If State Elimination is chosen, start with GNFA, then eliminate intermediate states one by one while showing transition label updates.
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          method: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                formula: { type: Type.STRING },
              },
              required: ["title", "description", "formula"],
            },
          },
          finalRegex: { type: Type.STRING },
        },
        required: ["method", "steps", "finalRegex"],
      },
    },
  });

  return JSON.parse(response.text);
}

export async function generatePracticeQuiz(level, numQuestions) {
  const prompt = `
Generate ${numQuestions} multiple-choice practice questions (MCQs) on Automata Theory & Regular Expressions at a "${level}" difficulty level.
Include state graph definitions for Cytoscape.js in "dfaGraph".
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.INTEGER },
            question: { type: Type.STRING },
            dfaGraph: {
              type: Type.OBJECT,
              properties: {
                nodes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      data: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          type: { type: Type.STRING }
                        },
                        required: ["id", "type"]
                      }
                    },
                    required: ["data"]
                  }
                },
                edges: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      data: {
                        type: Type.OBJECT,
                        properties: {
                          source: { type: Type.STRING },
                          target: { type: Type.STRING },
                          label: { type: Type.STRING }
                        },
                        required: ["source", "target", "label"]
                      }
                    },
                    required: ["data"]
                  }
                }
              },
              required: ["nodes", "edges"]
            },
            options: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                },
                required: ["id", "text"],
              },
            },
            correctAnswer: { type: Type.STRING },
            hint: { type: Type.STRING },
            explanations: {
              type: Type.OBJECT,
              properties: {
                A: { type: Type.STRING },
                B: { type: Type.STRING },
                C: { type: Type.STRING },
                D: { type: Type.STRING },
              },
              required: ["A", "B", "C", "D"],
            },
            fullSolution: { type: Type.STRING },
          },
          required: [
            "id",
            "question",
            "dfaGraph",
            "options",
            "correctAnswer",
            "hint",
            "explanations",
            "fullSolution",
          ],
        },
      },
    },
  });

  return JSON.parse(response.text);
}