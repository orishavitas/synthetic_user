import OpenAI from "openai";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function callOpenAIVision(
  systemPrompt: string,
  textMessage: string,
  screenshotBase64: string,
  model: string
): Promise<string> {
  const response = await getClient().chat.completions.create({
    model,
    max_tokens: 4096,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          { type: "text", text: textMessage },
          {
            type: "image_url",
            image_url: { url: `data:image/png;base64,${screenshotBase64}`, detail: "high" },
          },
        ],
      },
    ],
  });
  return response.choices[0].message.content ?? "";
}
