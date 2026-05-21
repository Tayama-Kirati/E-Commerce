"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { cn } from "@/app/lib/utils";

const ForgotSchema = z.object({
 email: z.string().email("Enter a valid email"),
});
type ForgotForm = z.infer<typeof ForgotSchema>;

export default function ForgotPasswordPage() {
 const [submitted, setSubmitted] = useState(false);
 const [sentTo, setSentTo] = useState("");

 const {
 register,
 handleSubmit,
 formState: { errors, isSubmitting },
 } = useForm<ForgotForm>({ resolver: zodResolver(ForgotSchema) });

 const onSubmit = async (data: ForgotForm) => {
 await fetch("/api/auth/forgot-password", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ email: data.email }),
 });
 setSentTo(data.email);
 setSubmitted(true);
 };

 return (
 <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-400 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
 <div className="w-full max-w-md animate-fade-in">
 <Link href="/" className="flex items-center justify-center mb-8">
 <span className="text-3xl font-bold text-blue-600">
 Nex<span className="text-blue-500">Mart</span>
 </span>
 </Link>

 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-8 shadow-xl shadow-blue-100/30">
 {!submitted ? (
 <>
 <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
 <Mail className="w-6 h-6 text-blue-600" />
 </div>
 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
 Forgot password?
 </h1>
 <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
 No worries! Enter your email and we'll send you a reset link.
 </p>
 <form
 onSubmit={handleSubmit(onSubmit)}
 noValidate
 className="space-y-4"
 >
 <div>
 <label
 htmlFor="fp-email"
 className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
 >
 Email address
 </label>
 <div className="relative">
 <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
 <input
 id="fp-email"
 type="email"
 placeholder="you@example.com"
 {...register("email")}
 className={cn(
 "w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-colors",
 "bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",
 errors.email
 ? "border-red-400"
 : "border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
 )}
 />
 </div>
 {errors.email && (
 <p className="mt-1 text-xs text-red-500">
 {errors.email.message}
 </p>
 )}
 </div>
 <button
 type="submit"
 disabled={isSubmitting}
 className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70"
 >
 {isSubmitting ? (
 <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 ) : (
 "Send Reset Link"
 )}
 </button>
 </form>
 </>
 ) : (
 <div className="text-center py-4">
 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
 <CheckCircle className="w-8 h-8 text-green-600" />
 </div>
 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
 Check your inbox
 </h2>
 <p className="text-gray-500 text-sm mb-2">
 We've sent a password reset link to
 </p>
 <p className="font-semibold text-gray-900 dark:text-white mb-6">
 {sentTo}
 </p>
 <p className="text-xs text-gray-400 mb-6">
 Didn't receive it? Check your spam folder, or{" "}
 <button
 onClick={() => setSubmitted(false)}
 className="text-blue-600 font-semibold hover:underline"
 >
 try again
 </button>
 </p>
 </div>
 )}

 <Link
 href="/login"
 className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-4 transition-colors"
 >
 <ArrowLeft className="w-4 h-4" />
 Back to sign in
 </Link>
 </div>
 </div>
 </div>
 );
}
