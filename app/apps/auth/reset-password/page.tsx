"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { toast } from "react-hot-toast";

const ResetSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type ResetForm = z.infer<typeof ResetSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(ResetSchema) });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-4">
            Invalid or missing reset token.
          </p>
          <Link href="/forgot-password" className="text-blue-600 underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ResetForm) => {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, ...data }),
    });
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Reset failed.");
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2500);
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
          {!done ? (
            <>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Set new password
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Choose a strong password you haven't used before.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-4"
              >
                {[
                  {
                    id: "new-pass",
                    name: "password",
                    label: "New password",
                    show: showPass,
                    setShow: setShowPass,
                  },
                ].map((f) => (
                  <div key={f.id}>
                    <label
                      htmlFor={f.id}
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                    >
                      {f.label}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        id={f.id}
                        type={f.show ? "text" : "password"}
                        placeholder="••••••••"
                        {...register(f.name as keyof ResetForm)}
                        className="w-full pl-10 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 dark:text-white placeholder:text-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => f.setShow((v) => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {f.show ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {errors[f.name as keyof typeof errors] && (
                      <p className="mt-1 text-xs text-red-500">
                        {String(errors[f.name as keyof typeof errors]?.message)}
                      </p>
                    )}
                  </div>
                ))}

                <div>
                  <label
                    htmlFor="confirm-pass"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="confirm-pass"
                      type="password"
                      placeholder="••••••••"
                      {...register("confirmPassword")}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                Password reset!
              </h2>
              <p className="text-gray-500 text-sm">
                Redirecting you to sign in...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
