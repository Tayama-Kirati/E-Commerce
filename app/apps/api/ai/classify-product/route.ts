import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  categories: z.array(z.object({ id: z.string(), name: z.string() })).min(1).max(100),
});

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, categories } = Schema.parse(body);

    const categoriesList = categories.map(c => `${c.name} [id:${c.id}]`).join(", ");
    const userContent = `Product: "${name}"${description ? `\nDescription: ${description}` : ""}\n\nAvailable categories: ${categoriesList}`;

    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 64,
      system:
        'You are a product category classifier. Given a product name and optional description, pick the single best matching category from the list. Reply with ONLY valid JSON, no markdown: {"categoryId":"<id>","categoryName":"<name>"}',
      messages: [{ role: "user", content: userContent }],
    });

    const raw = response.content.find(b => b.type === "text")?.text?.trim() ?? "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd   = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) throw new Error("No JSON in response");

    const result = JSON.parse(raw.slice(jsonStart, jsonEnd + 1)) as {
      categoryId: string;
      categoryName: string;
    };

    // Validate the returned id actually exists in the provided list
    const chosen = categories.find(c => c.id === result.categoryId);
    if (!chosen) {
      // Fall back: find by name if id doesn't match
      const byName = categories.find(
        c => c.name.toLowerCase() === result.categoryName?.toLowerCase(),
      );
      if (!byName) throw new Error("Returned category not found in list");
      return NextResponse.json({ categoryId: byName.id, categoryName: byName.name });
    }

    return NextResponse.json({ categoryId: chosen.id, categoryName: chosen.name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 422 },
      );
    }
    console.error("[POST /api/ai/classify-product]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
