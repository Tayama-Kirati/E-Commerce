"use client";
import { useState } from "react";
import { useUIStore, apiPost } from "@/app/lib/store";

export function ForgotPage() {
 const { nav } = useUIStore();
 const [email, setEmail] = useState("");
 const [sent, setSent] = useState(false);
 const [loading, setLoading] = useState(false);

 const submit = async (e: React.FormEvent) => {
 e.preventDefault();
 setLoading(true);
 await apiPost("/api/auth/forgot-password", { email });
 await new Promise(r => setTimeout(r, 700));
 setLoading(false);
 setSent(true);
 };

 return (
 <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
 <div className="w-full max-w-md">
 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
 {!sent ? (
 <>
 <div className="w-14 h-14 bg-violet-100 dark:bg-violet-900/30 rounded-2xl flex items-center justify-center mb-5 text-3xl mx-auto">✉️</div>
 <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1 text-center">Forgot password?</h1>
 <p className="text-gray-400 text-sm mb-7 text-center">Enter your email and we'll send a reset link.</p>
 <form onSubmit={submit} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
 </div>
 <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 transition-all disabled:opacity-60">
 {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Send Reset Link"}
 </button>
 </form>
 </>
 ) : (
 <>
 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">✅</div>
 <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 text-center">Check your inbox!</h2>
 <p className="text-gray-500 text-sm mb-7 text-center">If <strong>{email}</strong> is registered, we've sent a reset link. Check spam too.</p>
 <button onClick={() => setSent(false)} className="w-full text-sm text-violet-600 font-semibold hover:underline">Try a different email</button>
 </>
 )}
 <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-center">
 <button onClick={() => nav("login")} className="text-sm text-gray-500 hover:text-violet-600 transition-colors font-medium">← Back to Sign In</button>
 </div>
 </div>
 </div>
 </div>
 );
}
