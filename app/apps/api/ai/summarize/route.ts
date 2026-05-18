import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  text: z.string().min(10).max(10000),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = Schema.parse(body);

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant. Summarize the provided product description in 2-3 concise sentences, highlighting key features and benefits.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 150,
    });

    return NextResponse.json({
      summary: completion.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
