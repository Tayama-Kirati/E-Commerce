import crypto from "crypto";
import { prisma } from "@/app/lib/prisma";
import { generateToken } from "@/app/lib/auth-utils";

export type TokenPurpose = "verify-email" | "reset-password";

const hash = (raw: string) => crypto.createHash("sha256").update(raw).digest("hex");

/**
 * Issues a single-use token (only its hash is stored) and revokes any earlier
 * token for the same user and purpose. Returns the raw token for the email link.
 */
export async function issueToken(purpose: TokenPurpose, userId: string, ttlSeconds: number) {
  const raw = generateToken(32);
  const identifier = `${purpose}:${userId}`;
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hash(raw), expires: new Date(Date.now() + ttlSeconds * 1000) },
    }),
  ]);
  return raw;
}

/** Validates and deletes a token, returning the user id it was issued for. */
export async function consumeToken(purpose: TokenPurpose, raw: string): Promise<string | null> {
  if (!raw || raw.length < 32) return null;
  const row = await prisma.verificationToken.findUnique({ where: { token: hash(raw) } });
  if (!row || !row.identifier.startsWith(`${purpose}:`)) return null;
  await prisma.verificationToken.delete({ where: { token: row.token } }).catch(() => null);
  if (row.expires < new Date()) return null;
  return row.identifier.slice(purpose.length + 1);
}
