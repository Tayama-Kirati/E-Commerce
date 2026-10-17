import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/app/lib/prisma";
import { sendVerificationEmail } from "@/app/lib/email";
import { issueToken } from "@/app/lib/tokens";
import { attachReferral } from "@/app/lib/referrals";
import { PasswordSchema } from "@/app/lib/validation";
import { rateLimit } from "@/app/lib/rate-limit";

const RegisterSchema = z.object({
 firstName: z.string().min(2).max(50).trim(),
 lastName: z.string().min(2).max(50).trim(),
 email: z.string().email().toLowerCase().trim(),
 password: PasswordSchema,
 phone: z
 .string()
 .regex(/^\+?[0-9]{10,15}$/)
 .optional(),
 referralCode: z.string().optional(),
 acceptTerms: z.literal(true, {
 error: () => ({ message: "You must accept the terms" }),
 }),
});

export async function POST(req: NextRequest) {
 const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 try {
   const { success } = await rateLimit(`register:${ip}`, 50, 3600);
   if (!success) {
     return NextResponse.json(
       { error: "Too many registration attempts. Please try again in an hour." },
       { status: 429 },
     );
   }
 } catch { /* Redis unavailable — fail open */ }

 try {
 const body = await req.json();
 const data = RegisterSchema.parse(body);

 // Check if email already exists
 const existing = await prisma.user.findUnique({
 where: { email: data.email },
 });
 if (existing) {
 return NextResponse.json(
 { error: "An account with this email already exists." },
 { status: 409 },
 );
 }

 // Check phone uniqueness
 if (data.phone) {
 const phoneExists = await prisma.user.findFirst({
 where: { phone: data.phone },
 });
 if (phoneExists) {
 return NextResponse.json(
 { error: "This phone number is already registered." },
 { status: 409 },
 );
 }
 }

 // Hash password
 const passwordHash = await bcrypt.hash(data.password, 12);


 // Create user + initial data in transaction
 const user = await prisma.$transaction(async (tx: any) => {
 const created = await tx.user.create({
 data: {
 email: data.email,
 firstName: data.firstName,
 lastName: data.lastName,
 name: `${data.firstName} ${data.lastName}`,
 phone: data.phone,
 passwordHash,
 role: "CUSTOMER",
 loyaltyPoints: 100,
 loyaltyTier: "BRONZE",
 },
 });

 // Welcome loyalty points transaction
 await tx.loyaltyTransaction.create({
 data: {
 userId: created.id,
 points: 100,
 type: "BONUS",
 description: "Welcome bonus for joining PeaNut!",
 },
 });

 // Welcome notification
 await tx.notification.create({
 data: {
 userId: created.id,
 type: "SYSTEM",
 title: "Welcome to PeaNut!",
 body: "Your account is ready. You've earned 100 welcome points. Start exploring!",
 },
 });


 await attachReferral(tx, created.id, data.referralCode);

 return created;
 });

 // Generate email verification token (24h)
 const verifyToken = await issueToken("verify-email", user.id, 86400);

 // Send verification email (non-blocking)
 sendVerificationEmail({
 to: user.email,
 name: user.firstName ?? user.name ?? "there",
 token: verifyToken,
 }).catch(console.error);

 return NextResponse.json(
 {
 message:
 "Account created! Please check your email to verify your account.",
 userId: user.id,
 },
 { status: 201 },
 );
 } catch (err) {
 if (err instanceof z.ZodError) {
 return NextResponse.json(
 { error: "Validation failed", details: err.flatten().fieldErrors },
 { status: 422 },
 );
 }
 console.error("[POST /api/auth/register]", err);
 return NextResponse.json(
 { error: "Registration failed. Please try again." },
 { status: 500 },
 );
 }
}
