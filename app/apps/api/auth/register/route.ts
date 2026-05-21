import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { prisma } from "@/app/lib/prisma";
import { redis } from "@/app/lib/redis";
import {
 sendVerificationEmail,
 sendPasswordResetEmail,
 sendPasswordChangedEmail,
} from "@/app/lib/email";
import {
 generateToken,
 generateReferralCode,
} from "@/app/lib/auth-utils";
import { rateLimit } from "@/app/lib/rate-limit";
import { authOptions } from "@/app/lib/auth";

const RegisterSchema = z.object({
 firstName: z.string().min(2).max(50).trim(),
 lastName: z.string().min(2).max(50).trim(),
 email: z.string().email().toLowerCase().trim(),
 password: z
 .string()
 .min(8)
 .regex(/[A-Z]/, "Must contain at least one uppercase letter")
 .regex(/[0-9]/, "Must contain at least one number")
 .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
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
 // Rate limit: 5 registrations per hour per IP
 const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 const { success } = await rateLimit(`register:${ip}`, 5, 3600);
 if (!success) {
 return NextResponse.json(
 { error: "Too many registration attempts. Please try again later." },
 { status: 429 },
 );
 }

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
 const phoneExists = await prisma.user.findUnique({
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

 // Handle referral
 let referrerId: string | null = null;
 if (data.referralCode) {
 const referral = await prisma.referral.findFirst({
 where: { code: data.referralCode, isConverted: false },
 });
 if (referral) referrerId = referral.referrerId;
 }

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
 title: "Welcome to PeaNut! 🎉",
 body: "Your account is ready. You've earned 100 welcome points. Start exploring!",
 imageUrl: "/images/welcome.png",
 },
 });

 // Handle referral reward
 if (referrerId) {
 await tx.referral.updateMany({
 where: { referrerId, code: data.referralCode },
 data: {
 referredId: created.id,
 isConverted: true,
 convertedAt: new Date(),
 pointsEarned: 500,
 },
 });
 await tx.user.update({
 where: { id: referrerId },
 data: { loyaltyPoints: { increment: 500 } },
 });
 await tx.loyaltyTransaction.create({
 data: {
 userId: referrerId,
 points: 500,
 type: "REFERRAL",
 description: `Referral bonus — ${data.email} joined using your code`,
 },
 });
 }

 // Create default address placeholder
 // (user fills it in checkout)

 return created;
 });

 // Generate email verification token
 const verifyToken = generateToken();
 await redis.setex(`verify:email:${verifyToken}`, 86400, user.id); // 24h expiry

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

export async function verifyEmailHandler(req: NextRequest) {
 const { searchParams } = new URL(req.url);
 const token = searchParams.get("token");

 if (!token) {
 return NextResponse.json(
 { error: "Verification token missing." },
 { status: 400 },
 );
 }

 const userId = await redis.get(`verify:email:${token}`);
 if (!userId) {
 return NextResponse.json(
 {
 error:
 "Invalid or expired verification link. Please request a new one.",
 },
 { status: 400 },
 );
 }

 await prisma.user.update({
 where: { id: userId as string },
 data: { emailVerified: new Date() },
 });

 await redis.del(`verify:email:${token}`);

 // Redirect to login with success message
 return NextResponse.redirect(
 `${process.env.NEXTAUTH_URL}/login?verified=true`,
 );
}

const ResendSchema = z.object({ email: z.string().email() });

export async function resendVerificationHandler(req: NextRequest) {
 const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 const { success } = await rateLimit(`resend:${ip}`, 3, 600); // 3 per 10 min
 if (!success) {
 return NextResponse.json({ error: "Too many requests." }, { status: 429 });
 }

 const body = await req.json();
 const { email } = ResendSchema.parse(body);

 const user = await prisma.user.findUnique({ where: { email } });
 if (!user) {
 // Return success even if not found (security: don't reveal existence)
 return NextResponse.json({
 message: "If this email exists, a verification link was sent.",
 });
 }
 if (user.emailVerified) {
 return NextResponse.json({ message: "Email already verified." });
 }

 const token = generateToken();
 await redis.setex(`verify:email:${token}`, 86400, user.id);
 sendVerificationEmail({
 to: user.email,
 name: user.firstName ?? "there",
 token,
 }).catch(console.error);

 return NextResponse.json({ message: "Verification email sent." });
}

 
const ForgotSchema = z.object({ email: z.string().email() });

export async function forgotPasswordHandler(req: NextRequest) {
 const ip = req.headers.get("x-forwarded-for") ?? "unknown";
 const { success } = await rateLimit(`forgot:${ip}`, 3, 600);
 if (!success)
 return NextResponse.json({ error: "Too many requests." }, { status: 429 });

 const body = await req.json();
 const { email } = ForgotSchema.parse(body);

 const user = await prisma.user.findUnique({ where: { email } });

 // Always return success (security: don't reveal email existence)
 const response = NextResponse.json({
 message:
 "If an account with that email exists, a password reset link has been sent.",
 });

 if (!user) return response;

 // Invalidate any previous reset tokens for this user
 const oldKeys = await redis.keys(`reset:password:*:${user.id}`);
 if (oldKeys.length) await redis.del(...oldKeys);

 const token = generateToken(48);
 await redis.setex(`reset:password:${token}`, 3600, user.id); // 1h expiry

 sendPasswordResetEmail({
 to: user.email,
 name: user.firstName ?? user.name ?? "there",
 token,
 }).catch(console.error);

 return response;
}
 
const ResetSchema = z
 .object({
 token: z.string().min(32),
 password: z
 .string()
 .min(8)
 .regex(/[A-Z]/, "Must contain uppercase")
 .regex(/[0-9]/, "Must contain number")
 .regex(/[^A-Za-z0-9]/, "Must contain special character"),
 confirmPassword: z.string(),
 })
 .refine((d) => d.password === d.confirmPassword, {
 message: "Passwords do not match",
 path: ["confirmPassword"],
 });

export async function resetPasswordHandler(req: NextRequest) {
 const body = await req.json();
 const data = ResetSchema.parse(body);

 const userId = await redis.get(`reset:password:${data.token}`);
 if (!userId) {
 return NextResponse.json(
 {
 error:
 "This reset link is invalid or has expired. Please request a new one.",
 },
 { status: 400 },
 );
 }

 const passwordHash = await bcrypt.hash(data.password, 12);

 await prisma.$transaction([
 prisma.user.update({
 where: { id: userId as string },
 data: { passwordHash },
 }),
 // Invalidate all sessions
 prisma.session.deleteMany({ where: { userId: userId as string } }),
 ]);

 await redis.del(`reset:password:${data.token}`);

 // Send password changed confirmation email
 const user = await prisma.user.findUnique({
 where: { id: userId as string },
 });
 if (user) {
 sendPasswordChangedEmail({
 to: user.email,
 name: user.firstName ?? "there",
 }).catch(console.error);
 }

 return NextResponse.json({
 message: "Password reset successfully. You can now sign in.",
 });
}

 
// Authenticated password change
const ChangePasswordSchema = z
 .object({
 currentPassword: z.string().min(1),
 newPassword: z
 .string()
 .min(8)
 .regex(/[A-Z]/)
 .regex(/[0-9]/)
 .regex(/[^A-Za-z0-9]/),
 confirmPassword: z.string(),
 })
 .refine((d) => d.newPassword === d.confirmPassword, {
 message: "Passwords do not match",
 path: ["confirmPassword"],
 });

export async function changePasswordHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (!session?.user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const body = await req.json();
 const data = ChangePasswordSchema.parse(body);

 const user = await prisma.user.findUnique({ where: { id: session.user.id } });
 if (!user?.passwordHash) {
 return NextResponse.json(
 { error: "This account uses social login and has no password." },
 { status: 400 },
 );
 }

 const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
 if (!valid) {
 return NextResponse.json(
 { error: "Current password is incorrect." },
 { status: 400 },
 );
 }

 const sameAsOld = await bcrypt.compare(data.newPassword, user.passwordHash);
 if (sameAsOld) {
 return NextResponse.json(
 { error: "New password must be different from your current password." },
 { status: 400 },
 );
 }

 const newHash = await bcrypt.hash(data.newPassword, 12);
 await prisma.user.update({
 where: { id: user.id },
 data: { passwordHash: newHash },
 });

 return NextResponse.json({ message: "Password changed successfully." });
}

 
// Real-time email availability check for registration form
export async function checkEmailHandler(req: NextRequest) {
 const { searchParams } = new URL(req.url);
 const email = searchParams.get("email")?.toLowerCase().trim();

 if (!email || !z.string().email().safeParse(email).success) {
 return NextResponse.json({ available: false, message: "Invalid email" });
 }

 const exists = await prisma.user.findUnique({
 where: { email },
 select: { id: true },
 });

 return NextResponse.json({ available: !exists });
}

 

export async function logoutHandler(req: NextRequest) {
 const session = await getServerSession(authOptions);
 if (session?.user) {
 // Revoke all sessions for this user (optional: or just current)
 await prisma.session.deleteMany({ where: { userId: session.user.id } });
 }
 return NextResponse.json({ success: true });
}
