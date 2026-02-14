import { GoogleGenerativeAI } from "@google/generative-ai";

let client: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY ?? "");
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
