import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { getSettings } from "@/app/lib/settings";
import { z } from "zod";

const Schema = z.object({
  storeName:   z.string().min(3, "Store name must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  acceptPolicy: z.literal(true),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user)
    return NextResponse.json({ error: "Please sign in first" }, { status: 401 });

  const existing = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (existing)
    return NextResponse.json({ error: "You already have a seller account." }, { status: 409 });

  let body: unknown;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

  const parsed = Schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 422 });

  const { storeName, description } = parsed.data;

  // Generate unique slug
  const base = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = base;
  let attempt = 0;
  while (await prisma.seller.findUnique({ where: { storeSlug: slug } })) {
    slug = `${base}-${++attempt}`;
  }

  // Stores start in review (no verified badge, no payouts) unless the admin enabled auto-approval
  const { newSellerAuto } = await getSettings();
  const status = newSellerAuto ? "APPROVED" : "PENDING";

  const seller = await prisma.$transaction(async (tx: any) => {
    const s = await tx.seller.create({
      data: {
        userId:      session.user.id,
        storeName,
        storeSlug:   slug,
        description,
        status,
      },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data:  { role: "SELLER" },
    });

    // Notify admins
    const admins = await tx.user.findMany({
      where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      select: { id: true },
    });
    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((a: any) => ({
          userId: a.id,
          type:   "SYSTEM" as const,
          title:  "New Seller Registration",
          body:   status === "PENDING" ? `${storeName} registered and is waiting for approval.` : `${storeName} has registered as a seller.`,
        })),
      });
    }

    // Notify applicant
    await tx.notification.create({
      data: {
        userId: session.user.id,
        type:   "SYSTEM",
        title:  "Welcome to PeaNut Sellers!",
        body:   status === "PENDING"
          ? "Your store is live and under review. You can add products now; payouts unlock once we verify your store (usually within 1 business day)."
          : "Your seller account is now active. Start adding products from your Seller Hub.",
      },
    });

    return s;
  });

  return NextResponse.json({ seller, message: "Seller account created successfully!" }, { status: 201 });
}
