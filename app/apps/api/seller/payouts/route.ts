import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { requireSeller, readJson, zodError, jsonError } from "@/app/lib/api";
import { sellerBalance } from "@/app/lib/seller";
import { notifyAdmins } from "@/app/lib/notify";

const mask = (acct: string | null) => (acct ? `•••• ${acct.slice(-4)}` : null);

// ─── GET /api/seller/payouts — balances and withdrawal history ───────────────

export async function GET() {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  if (!sellerId) return jsonError("Seller profile not found", 403);

  const [balance, seller, history] = await Promise.all([
    sellerBalance(sellerId),
    prisma.seller.findUniqueOrThrow({ where: { id: sellerId }, select: { bankName: true, bankAccountName: true, bankAccountNumber: true } }),
    prisma.payout.findMany({ where: { sellerId }, orderBy: { requestedAt: "desc" }, take: 50 }),
  ]);

  return NextResponse.json({
    ...balance,
    bankDetails: seller.bankAccountNumber
      ? { bank: seller.bankName, name: seller.bankAccountName, account: mask(seller.bankAccountNumber) }
      : null,
    payoutHistory: history.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      status: p.status,
      date: p.processedAt ?? p.requestedAt,
      requestedAt: p.requestedAt,
      bank: p.bankName ? `${p.bankName} ${mask(p.accountNumber) ?? ""}`.trim() : mask(p.accountNumber),
      reference: p.reference,
      note: p.note,
    })),
  });
}

// ─── POST /api/seller/payouts — request a withdrawal ─────────────────────────

const RequestSchema = z.object({
  amount: z.number().positive(),
  // Optional: update the payout bank account in the same step
  bankName: z.string().trim().min(2).max(100).optional(),
  bankAccountName: z.string().trim().min(2).max(100).optional(),
  bankAccountNumber: z.string().trim().regex(/^[0-9A-Za-z-]{6,30}$/).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireSeller();
  if (auth.error) return auth.error;
  const sellerId = auth.user.sellerId;
  if (!sellerId) return jsonError("Seller profile not found", 403);

  const parsed = RequestSchema.safeParse(await readJson(req));
  if (!parsed.success) return zodError(parsed.error);
  const { amount, ...bank } = parsed.data;

  if (bank.bankAccountNumber) {
    await prisma.seller.update({ where: { id: sellerId }, data: bank });
  }
  const seller = await prisma.seller.findUniqueOrThrow({
    where: { id: sellerId },
    select: { storeName: true, status: true, bankName: true, bankAccountName: true, bankAccountNumber: true },
  });
  if (seller.status !== "APPROVED") return jsonError("Your store must be approved before you can withdraw", 403);
  if (!seller.bankAccountNumber) return jsonError("Add your bank account details before requesting a payout", 400);

  const balance = await sellerBalance(sellerId);
  if (amount < balance.minWithdrawal) return jsonError(`Minimum withdrawal is रू ${balance.minWithdrawal.toLocaleString()}`, 400);
  if (amount > balance.maxWithdrawal) return jsonError(`Maximum withdrawal is रू ${balance.maxWithdrawal.toLocaleString()}`, 400);
  if (amount > balance.available) return jsonError("Insufficient available balance", 400);
  if (balance.inFlight > 0) return jsonError("You already have a payout being processed", 409);

  const payout = await prisma.payout.create({
    data: {
      sellerId, amount,
      bankName: seller.bankName, accountName: seller.bankAccountName, accountNumber: seller.bankAccountNumber,
    },
  });
  await notifyAdmins("Payout requested", `${seller.storeName} requested रू ${amount.toLocaleString()}`);

  return NextResponse.json(
    { payout: { ...payout, amount: Number(payout.amount) }, message: "Withdrawal requested — it will be processed within 3 business days." },
    { status: 201 },
  );
}
