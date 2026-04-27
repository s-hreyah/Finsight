import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export async function categorizeTransaction(description: string): Promise<string> {
  if (!process.env.GEMINI_API_KEY) return 'General';
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize this financial transaction description into a single word (e.g., Food, Transport, Housing, Entertainment, Utilities, Healthcare, Salary, Investment, Other): "${description}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING }
          },
          required: ["category"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"category": "Other"}');
    return result.category || 'Other';
  } catch (error) {
    console.error("AI Categorization failed:", error);
    return 'Other';
  }
}

export async function categorizeMultipleTransactions(descriptions: string[]): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) return descriptions.map(() => 'Other');

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Categorize these financial transaction descriptions into categories (e.g., Food, Transport, Housing, Entertainment, Utilities, Healthcare, Salary, Investment, Other). Return an array of categories matching the input order: ${JSON.stringify(descriptions)}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["categories"]
        }
      }
    });

    const result = JSON.parse(response.text || '{"categories": []}');
    return result.categories || descriptions.map(() => 'Other');
  } catch (error) {
    console.error("Batch AI Categorization failed:", error);
    return descriptions.map(() => 'Other');
  }
}
