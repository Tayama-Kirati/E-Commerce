import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { jsonError, readJson, zodError } from "@/app/lib/api";
import { rateLimit } from "@/app/lib/rate-limit";
import { getSettings } from "@/app/lib/settings";
import { STATUS_LABEL } from "@/app/lib/order-status";

const MODEL = "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 6;

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

// ── Tools ────────────────────────────────────────────────────────────────────

const tools: Anthropic.Beta.BetaTool[] = [
  {
    name: "search_products",
    description: "Search the PeaNut catalogue. Use for any question about products, prices, availability or recommendations.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keywords, e.g. 'wireless earbuds'" },
        maxPrice: { type: "number", description: "Optional maximum price in NPR" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_my_orders",
    description: "List the signed-in customer's most recent orders with status and tracking. Only works when the customer is signed in.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
  {
    name: "get_order",
    description: "Get one of the signed-in customer's orders by order number (e.g. PN-20261017-AB12CD), including items and tracking timeline.",
    input_schema: {
      type: "object",
      properties: { orderNumber: { type: "string" } },
      required: ["orderNumber"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    name: "get_store_policies",
    description: "Shipping costs, free-shipping threshold, return window, payment methods and loyalty points rules.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
    strict: true,
  },
];

const ToolInputs = {
  search_products: z.object({ query: z.string().min(1).max(100), maxPrice: z.number().positive().optional() }),
  get_my_orders: z.object({}),
  get_order: z.object({ orderNumber: z.string().min(3).max(50) }),
  get_store_policies: z.object({}),
};

async function runTool(name: string, input: unknown, userId: string | null): Promise<string> {
  const schema = ToolInputs[name as keyof typeof ToolInputs];
  if (!schema) return JSON.stringify({ error: `Unknown tool ${name}` });
  const parsed = schema.safeParse(input);
  if (!parsed.success) return JSON.stringify({ error: "Invalid tool input", issues: parsed.error.issues });

  switch (name) {
    case "search_products": {
      const { query, maxPrice } = parsed.data as z.infer<typeof ToolInputs.search_products>;
      const words = query.split(/\s+/).filter((w) => w.length > 1).slice(0, 5);
      const products = await prisma.product.findMany({
        where: {
          isActive: true,
          ...(maxPrice && { basePrice: { lte: maxPrice } }),
          OR: words.flatMap((w) => [
            { name: { contains: w, mode: "insensitive" as const } },
            { tags: { some: { tag: { contains: w, mode: "insensitive" as const } } } },
            { category: { name: { contains: w, mode: "insensitive" as const } } },
          ]),
        },
        orderBy: [{ totalSales: "desc" }, { averageRating: "desc" }],
        take: 6,
        select: { name: true, slug: true, basePrice: true, comparePrice: true, stock: true, averageRating: true, freeShipping: true },
      });
      return JSON.stringify(products.map((p) => ({
        name: p.name, slug: p.slug, priceNPR: Number(p.basePrice),
        wasNPR: p.comparePrice != null ? Number(p.comparePrice) : null,
        inStock: p.stock > 0, rating: p.averageRating, freeShipping: p.freeShipping,
      })));
    }
    case "get_my_orders": {
      if (!userId) return JSON.stringify({ error: "The customer is not signed in" });
      const orders = await prisma.order.findMany({
        where: { userId }, orderBy: { createdAt: "desc" }, take: 5,
        select: { orderNumber: true, status: true, total: true, createdAt: true, trackingNumber: true, carrier: true, paymentStatus: true, _count: { select: { items: true } } },
      });
      return JSON.stringify(orders.map((o) => ({
        orderNumber: o.orderNumber, status: STATUS_LABEL[o.status], totalNPR: Number(o.total), placed: o.createdAt.toISOString().slice(0, 10),
        items: o._count.items, payment: o.paymentStatus, tracking: o.trackingNumber, carrier: o.carrier,
      })));
    }
    case "get_order": {
      if (!userId) return JSON.stringify({ error: "The customer is not signed in" });
      const { orderNumber } = parsed.data as z.infer<typeof ToolInputs.get_order>;
      const o = await prisma.order.findFirst({
        where: { userId, orderNumber: orderNumber.trim().toUpperCase() },
        include: {
          items: { select: { quantity: true, variantName: true, product: { select: { name: true } } } },
          statusHistory: { orderBy: { createdAt: "asc" }, select: { status: true, note: true, location: true, createdAt: true } },
        },
      });
      if (!o) return JSON.stringify({ error: "No order with that number on this account" });
      return JSON.stringify({
        orderNumber: o.orderNumber, status: STATUS_LABEL[o.status], totalNPR: Number(o.total), payment: `${o.paymentMethod} (${o.paymentStatus})`,
        tracking: o.trackingNumber, carrier: o.carrier, currentLocation: o.currentLocation, cancelReason: o.cancelReason,
        items: o.items.map((i) => `${i.quantity}× ${i.product.name}${i.variantName ? ` (${i.variantName})` : ""}`),
        timeline: o.statusHistory.map((h) => ({ status: STATUS_LABEL[h.status], at: h.createdAt.toISOString(), note: h.note ?? h.location })),
      });
    }
    case "get_store_policies": {
      const s = await getSettings();
      return JSON.stringify({
        shipping: `Standard रू 150 (rates may vary by province), free on orders above रू ${s.freeShippingThreshold}`,
        returns: `Returns accepted within ${s.returnWindowDays} days of delivery from the order page`,
        cancellation: "Orders can be cancelled from the order page until they ship",
        payments: ["Khalti", "Visa/Mastercard (card)", "Cash on Delivery"],
        loyalty: s.loyaltyEnabled ? "1 point per रू 100 spent; points can cover up to 20% of an order (1 point = रू 1)" : "Loyalty program is paused",
        support: s.supportEmail,
      });
    }
  }
  return JSON.stringify({ error: "Unhandled tool" });
}

// ── Route ────────────────────────────────────────────────────────────────────

const SYSTEM = `You are Pea, the customer-support assistant for PeaNut, an online marketplace in Nepal. Prices are in Nepali rupees (रू).
Use the tools to answer from real data — never invent products, prices, stock, order details or policies. If a tool returns nothing relevant, say so.
Keep replies short and friendly (2–5 sentences or a brief list). When you mention a product, include its link as /products/<slug>.
Order tools only work for signed-in customers; if the customer isn't signed in, ask them to sign in to check their orders.
You can't place, cancel or refund orders yourself — explain how the customer can do it from their Orders page, or point them to support.
Latency-sensitive; begin your visible answer immediately.`;

const ChatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(30)
    .refine((m) => m[0].role === "user" && m[m.length - 1].role === "user", { message: "Conversation must start and end with the customer" }),
});

// ─── POST /api/ai/chat — { messages: [{ role, content }] } → { reply } ───────

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) return jsonError("The assistant isn't available right now", 503);

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await rateLimit(`chat:${userId ?? ip}`, 20, 600);
  if (!success) return jsonError("You're sending messages too quickly — please wait a moment", 429);

  const parsed = ChatSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);

  // Earlier turns arrive as plain text from the browser; tool calls only live within this request
  const messages: Anthropic.Beta.BetaMessageParam[] = parsed.data.messages.map((m) => ({ role: m.role, content: m.content }));
  const system = `${SYSTEM}\nThe customer is ${userId ? `signed in as ${session?.user?.name ?? "a customer"}` : "not signed in"}.`;

  try {
    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      // `fallbacks` re-runs a safety-declined request on Anthropic's recommended model.
      // SDK 0.100 doesn't type it yet, but it is sent as part of the request body.
      const params: Anthropic.Beta.MessageCreateParamsNonStreaming & { fallbacks: "default" } = {
        model: MODEL,
        max_tokens: 4000,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system,
        tools,
        messages,
      };
      const response = await anthropic().beta.messages.create(params);

      if (response.stop_reason === "refusal") {
        return NextResponse.json({ reply: "Sorry, I can't help with that. For anything else about your orders or our products, I'm here!" });
      }
      if (response.stop_reason === "pause_turn") {
        messages.push({ role: "assistant", content: response.content });
        continue;
      }

      const toolUses = response.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (response.stop_reason !== "tool_use" || !toolUses.length) {
        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("\n")
          .trim();
        return NextResponse.json({ reply: reply || "Sorry, I didn't catch that — could you rephrase?" });
      }

      messages.push({ role: "assistant", content: response.content });
      // All results go back in one user message so parallel tool calls keep working
      const results = await Promise.all(
        toolUses.map(async (t): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          try {
            return { type: "tool_result", tool_use_id: t.id, content: await runTool(t.name, t.input, userId) };
          } catch (err) {
            console.error(`[ai/chat] tool ${t.name}`, err);
            return { type: "tool_result", tool_use_id: t.id, content: "The lookup failed — try again later.", is_error: true };
          }
        }),
      );
      messages.push({ role: "user", content: results });
    }
    return NextResponse.json({ reply: "That took longer than expected — could you ask in a simpler way?" });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return jsonError("The assistant is busy — please try again in a minute", 503);
    if (err instanceof Anthropic.APIError) {
      console.error(`[ai/chat] API error ${err.status}`, err.message);
      return jsonError("The assistant is unavailable right now", 502);
    }
    throw err;
  }
}
