import OpenAI from "openai";
import { prisma } from "./prisma";
 
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
 
export async function generateAISummary(product: {
  name:        string;
  description: string;
  attributes:  { name: string; value: string }[];
}): Promise<string> {
  const attributeText = product.attributes
    .map((a: any) => `${a.name}: ${a.value}`)
    .join(", ");
 
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 200,
    messages: [
      {
        role: "system",
        content:
          "You are a product copywriter. Write a concise, engaging 2-3 sentence product summary that highlights the key benefits. Be factual and avoid hype.",
      },
      {
        role: "user",
        content: `Product: ${product.name}\n\nDescription: ${product.description.slice(0, 1000)}\n\nKey Specs: ${attributeText}`,
      },
    ],
  });
 
  return response.choices[0].message.content ?? "";
}
 
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}
 
export async function getAIRecommendations(
  userEmbedding: number[],
  excludeIds:    string[],
  limit          = 10
): Promise<string[]> {
  // Uses pgvector for similarity search — executed via Prisma raw query
  // Returns product IDs ordered by similarity
  const result = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM products
    WHERE id NOT IN (${excludeIds.join(",") || "''"})
    AND status = 'ACTIVE' AND is_active = true
    ORDER BY embedding <=> ${JSON.stringify(userEmbedding)}::vector
    LIMIT ${limit}
  `;
  return result.map((r: any) => r.id);
}
 
export async function chatbotResponse(
  messages: { role: "user" | "assistant"; content: string }[],
  context:  string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 300,
    messages: [
      {
        role: "system",
        content: `You are PeaAssist, PeaNut's AI shopping assistant. Be helpful, friendly, and concise. 
Context: ${context}
You can help users find products, track orders, compare items, suggest gifts, and answer questions about PeaNut.
Always respond in the user's language. Keep responses under 100 words.`,
      },
      ...messages,
    ],
  });
  return response.choices[0].message.content ?? "I'm here to help! What are you looking for?";
}
 