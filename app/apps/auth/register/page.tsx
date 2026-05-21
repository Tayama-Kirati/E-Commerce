"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
 Eye,
 EyeOff,
 User,
 Mail,
 Lock,
 Phone,
 CheckCircle,
 XCircle,
 ArrowRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { toast } from "react-hot-toast";
import { useDebounce } from "@/app/hooks/useDebounce";

const RegisterSchema = z
 .object({
 firstName: z.string().min(2, "At least 2 characters").max(50),
 lastName: z.string().min(2, "At least 2 characters").max(50),
 email: z.string().email("Enter a valid email"),
 phone: z
 .string()
 .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number")
 .optional()
 .or(z.literal("")),
 password: z
 .string()
 .min(8, "At least 8 characters")
 .regex(/[A-Z]/, "Include an uppercase letter")
 .regex(/[0-9]/, "Include a number")
 .regex(/[^A-Za-z0-9]/, "Include a special character"),
 confirmPassword: z.string(),
 referralCode: z.string().optional(),
 acceptTerms: z.literal(true, {
 error: () => ({ message: "You must accept the Terms of Service" }),
 }),
 })
 .refine((d) => d.password === d.confirmPassword, {
 message: "Passwords do not match",
 path: ["confirmPassword"],
 });

type RegisterForm = z.infer<typeof RegisterSchema>;

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
 const checks = [
 { label: "8+ characters", pass: password.length >= 8 },
 { label: "Uppercase letter", pass: /[A-Z]/.test(password) },
 { label: "Number", pass: /[0-9]/.test(password) },
 { label: "Special character", pass: /[^A-Za-z0-9]/.test(password) },
 ];
 const score = checks.filter((c) => c.pass).length;
 const color =
 score <= 1
 ? "bg-red-500"
 : score === 2
 ? "bg-amber-500"
 : score === 3
 ? "bg-yellow-500"
 : "bg-green-500";

 return (
 <div className="mt-2">
 <div className="flex gap-1 mb-2">
 {[1, 2, 3, 4].map((i) => (
 <div
 key={i}
 className={cn(
 "flex-1 h-1 rounded-full transition-colors duration-300",
 i <= score ? color : "bg-gray-200 dark:bg-gray-700",
 )}
 />
 ))}
 </div>
 <div className="grid grid-cols-2 gap-1">
 {checks.map((c) => (
 <div
 key={c.label}
 className={cn(
 "flex items-center gap-1 text-xs",
 c.pass ? "text-green-600" : "text-gray-400",
 )}
 >
 {c.pass ? (
 <CheckCircle className="w-3 h-3 shrink-0" />
 ) : (
 <XCircle className="w-3 h-3 shrink-0" />
 )}
 {c.label}
 </div>
 ))}
 </div>
 </div>
 );
};

export default function RegisterPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const refCode = searchParams.get("ref");
 const [showPass, setShowPass] = useState(false);
 const [showConfirm, setShowConfirm] = useState(false);
 const [emailStatus, setEmailStatus] = useState<
 "idle" | "checking" | "available" | "taken"
 >("idle");
 const [googleLoading, setGoogleLoading] = useState(false);

 const {
 register,
 handleSubmit,
 watch,
 formState: { errors, isSubmitting },
 } = useForm<RegisterForm>({
 resolver: zodResolver(RegisterSchema),
 defaultValues: { referralCode: refCode ?? "", acceptTerms: undefined },
 });

 const watchedEmail = watch("email");
 const watchedPassword = watch("password") ?? "";
 const debouncedEmail = useDebounce(watchedEmail, 500);

 React.useEffect(() => {
 if (
 !debouncedEmail ||
 !z.string().email().safeParse(debouncedEmail).success
 ) {
 setEmailStatus("idle");
 return;
 }
 setEmailStatus("checking");
 fetch(`/api/auth/check-email?email=${encodeURIComponent(debouncedEmail)}`)
 .then((r) => r.json())
 .then((d) => setEmailStatus(d.available ? "available" : "taken"))
 .catch(() => setEmailStatus("idle"));
 }, [debouncedEmail]);

 const onSubmit = async (data: RegisterForm) => {
 try {
 const res = await fetch("/api/auth/register", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ ...data, phone: data.phone || undefined }),
 });

 const json = await res.json();

 if (!res.ok) {
 if (json.details) {
 const firstError = Object.values(
 json.details as Record<string, string[]>,
 )[0]?.[0];
 toast.error(firstError ?? json.error ?? "Registration failed.");
 } else {
 toast.error(json.error ?? "Registration failed. Please try again.");
 }
 return;
 }

 toast.success(
 "Account created! Check your email to verify your account.",
 );
 router.push("/login?registered=true");
 } catch {
 toast.error("Something went wrong. Please try again.");
 }
 };

 const handleGoogle = async () => {
 setGoogleLoading(true);
 await signIn("google", { callbackUrl: "/" });
 };

 return (
 <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-400 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 py-12">
 <div className="w-full max-w-md animate-fade-in">
 <Link href="/" className="flex items-center justify-center gap-2 mb-8">
 <span className="text-3xl font-bold text-blue-600">
 Nex<span className="text-blue-500">Mart</span>
 </span>
 </Link>

 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl shadow-blue-100/30 dark:shadow-none">
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
 Create your account
 </h1>
 <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
 Join 3M+ shoppers on PeaNut and get 100 welcome points!
 </p>

 {/* Welcome Points Banner */}
 <div className="bg-linear-to-r from-blue-50 to-blue-400 dark:from-blue-900/20 dark:to-blue-400/20 rounded-2xl p-4 mb-6 flex items-center gap-3 border border-blue-100 dark:border-blue-800/30">
 <span className="text-2xl">🎁</span>
 <div>
 <p className="text-sm font-semibold text-gray-900 dark:text-white">
 100 welcome points
 </p>
 <p className="text-xs text-gray-500">
 Worth रू 10 on your first order
 </p>
 </div>
 </div>

 {/* Google */}
 <button
 onClick={handleGoogle}
 disabled={googleLoading}
 className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 mb-5 disabled:opacity-60"
 >
 {googleLoading ? (
 <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
 ) : (
 <svg className="w-5 h-5" viewBox="0 0 24 24">
 <path
 fill="#4285F4"
 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
 />
 <path
 fill="#34A853"
 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
 />
 <path
 fill="#FBBC05"
 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
 />
 <path
 fill="#EA4335"
 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
 />
 </svg>
 )}
 Sign up with Google
 </button>

 <div className="flex items-center gap-3 mb-5">
 <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
 <span className="text-xs text-gray-400 font-medium">
 or register with email
 </span>
 <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
 </div>

 <form
 onSubmit={handleSubmit(onSubmit)}
 noValidate
 className="space-y-4"
 >
 {/* Name Row */}
 <div className="grid grid-cols-2 gap-3">
 {[
 {
 id: "firstName",
 label: "First name",
 placeholder: "Arun",
 key: "firstName",
 },
 {
 id: "lastName",
 label: "Last name",
 placeholder: "Kumar",
 key: "lastName",
 },
 ].map((f) => (
 <div key={f.id}>
 <label
 htmlFor={f.id}
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 {f.label}
 </label>
 <div className="relative">
 <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
 <input
 id={f.id}
 type="text"
 placeholder={f.placeholder}
 {...register(f.key as keyof RegisterForm)}
 className={cn(
 "w-full pl-8 pr-3 py-2.5 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors[f.key as keyof typeof errors]
 ? "border-red-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30",
 )}
 />
 </div>
 {errors[f.key as keyof typeof errors] && (
 <p className="mt-0.5 text-xs text-red-500">
 {String(errors[f.key as keyof typeof errors]?.message)}
 </p>
 )}
 </div>
 ))}
 </div>

 {/* Email */}
 <div>
 <label
 htmlFor="reg-email"
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 Email address
 </label>
 <div className="relative">
 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input
 id="reg-email"
 type="email"
 autoComplete="email"
 placeholder="you@example.com"
 {...register("email")}
 className={cn(
 "w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.email || emailStatus === "taken"
 ? "border-red-400"
 : emailStatus === "available"
 ? "border-green-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
 )}
 />
 {emailStatus === "checking" && (
 <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
 )}
 {emailStatus === "available" && (
 <CheckCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
 )}
 {emailStatus === "taken" && (
 <XCircle className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
 )}
 </div>
 {errors.email && (
 <p className="mt-1 text-xs text-red-500">
 {errors.email.message}
 </p>
 )}
 {emailStatus === "taken" && !errors.email && (
 <p className="mt-1 text-xs text-red-500">
 This email is already registered.{" "}
 <Link href="/login" className="font-semibold underline">
 Sign in?
 </Link>
 </p>
 )}
 </div>

 {/* Phone */}
 <div>
 <label
 htmlFor="phone"
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 Phone number{" "}
 <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <div className="relative">
 <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input
 id="phone"
 type="tel"
 placeholder="+977 9800000000"
 {...register("phone")}
 className={cn(
 "w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.phone
 ? "border-red-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
 )}
 />
 </div>
 {errors.phone && (
 <p className="mt-1 text-xs text-red-500">
 {errors.phone.message}
 </p>
 )}
 </div>

 {/* Password */}
 <div>
 <label
 htmlFor="reg-password"
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 Password
 </label>
 <div className="relative">
 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input
 id="reg-password"
 type={showPass ? "text" : "password"}
 placeholder="Create a strong password"
 {...register("password")}
 className={cn(
 "w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.password
 ? "border-red-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
 )}
 />
 <button
 type="button"
 onClick={() => setShowPass((v) => !v)}
 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 aria-label={showPass ? "Hide" : "Show"}
 >
 {showPass ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </button>
 </div>
 {watchedPassword && (
 <PasswordStrength password={watchedPassword} />
 )}
 {errors.password && (
 <p className="mt-1 text-xs text-red-500">
 {errors.password.message}
 </p>
 )}
 </div>

 {/* Confirm Password */}
 <div>
 <label
 htmlFor="confirmPassword"
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 Confirm password
 </label>
 <div className="relative">
 <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input
 id="confirmPassword"
 type={showConfirm ? "text" : "password"}
 placeholder="Repeat your password"
 {...register("confirmPassword")}
 className={cn(
 "w-full pl-10 pr-12 py-3 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.confirmPassword
 ? "border-red-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
 )}
 />
 <button
 type="button"
 onClick={() => setShowConfirm((v) => !v)}
 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
 aria-label={showConfirm ? "Hide" : "Show"}
 >
 {showConfirm ? (
 <EyeOff className="w-4 h-4" />
 ) : (
 <Eye className="w-4 h-4" />
 )}
 </button>
 </div>
 {errors.confirmPassword && (
 <p className="mt-1 text-xs text-red-500">
 {errors.confirmPassword.message}
 </p>
 )}
 </div>

 {/* Referral Code */}
 <div>
 <label
 htmlFor="referralCode"
 className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1"
 >
 Referral code{" "}
 <span className="text-gray-400 font-normal">(optional)</span>
 </label>
 <input
 id="referralCode"
 type="text"
 placeholder="e.g. NEX2025"
 {...register("referralCode")}
 className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm outline-none transition-colors bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase"
 />
 </div>

 {/* Terms */}
 <div>
 <div className="flex items-start gap-2.5">
 <input
 id="acceptTerms"
 type="checkbox"
 {...register("acceptTerms")}
 className="w-4 h-4 mt-0.5 accent-blue-600 cursor-pointer shrink-0"
 />
 <label
 htmlFor="acceptTerms"
 className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed"
 >
 I agree to PeaNut&apos;s{" "}
 <Link
 href="/terms"
 className="text-blue-600 font-semibold hover:underline"
 >
 Terms of Service
 </Link>{" "}
 and{" "}
 <Link
 href="/privacy"
 className="text-blue-600 font-semibold hover:underline"
 >
 Privacy Policy
 </Link>
 </label>
 </div>
 {errors.acceptTerms && (
 <p className="mt-1 text-xs text-red-500">
 {errors.acceptTerms.message}
 </p>
 )}
 </div>

 {/* Submit */}
 <button
 type="submit"
 disabled={isSubmitting || emailStatus === "taken"}
 className={cn(
 "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm mt-2",
 "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800",
 "transition-all duration-200 active:scale-[0.98]",
 "disabled:opacity-70 disabled:cursor-not-allowed",
 )}
 >
 {isSubmitting ? (
 <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 <>
 Create Account
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </form>

 <p className="text-center text-sm text-gray-500 mt-5">
 Already have an account?{" "}
 <Link
 href="/login"
 className="text-blue-600 hover:text-blue-700 font-semibold"
 >
 Sign in
 </Link>
 </p>
 </div>
 </div>
 </div>
 );
}
