import crypto from "crypto";

export function generateToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function generateReferralCode(userId: string): string {
  return crypto
    .createHash("sha256")
    .update(userId + process.env.NEXTAUTH_SECRET)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
}
