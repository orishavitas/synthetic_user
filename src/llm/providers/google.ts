import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GOOGLE_AI_API_KEY is not set. Add it to your .env file or remove Google from models.json."
      );
    }
    client = new GoogleGenerativeAI(apiKey);
  }
  return client;
}

export async function callGemini(
  systemPrompt: string,
  userMessage: string,
  model: string
): Promise<string> {
  const genModel = getClient().getGenerativeModel({
    model,
    systemInstruction: systemPrompt,
  });
  const result = await genModel.generateContent(userMessage);
  return result.response.text();
}
