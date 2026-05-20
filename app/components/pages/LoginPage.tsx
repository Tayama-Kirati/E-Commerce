"use client";
import { useState } from "react";
import { useUIStore, useAuthStore } from "@/app/lib/store";

export function LoginPage() {
  const { nav, showToast } = useUIStore();
  const { setUser }        = useAuthStore();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    if (password.length < 6) { setError("Incorrect email or password. Please try again."); return; }
    const name = email.split("@")[0].replace(/\./g," ").replace(/\b\w/g,c=>c.toUpperCase());
    setUser({ name, email, role:"CUSTOMER", loyaltyPoints:100, loyaltyTier:"BRONZE" });
    showToast("Welcome back! 👋");
    nav("home");
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-linear-to-br from-violet-600 via-violet-700 to-orange-500 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden"><div className="absolute -top-40 -left-40 w-96 h-96 bg-white/5 rounded-full" /><div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" /></div>
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center font-black text-2xl">N</div>
            <span className="text-3xl font-black">Nex<span className="text-orange-300">Mart</span></span>
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight">Nepal's Smartest Shopping Experience</h1>
          <p className="text-white/70 text-lg mb-10">AI-powered recommendations, flash deals, and trusted sellers.</p>
          <div className="flex flex-col gap-3">
            {[{icon:"✨",l:"AI-Powered Recommendations"},{icon:"🛡️",l:"100% Buyer Protection"},{icon:"⚡",l:"Flash Deals Every Hour"}].map(f => (
              <div key={f.l} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-left"><span className="text-xl">{f.icon}</span><span className="font-semibold text-sm">{f.l}</span></div>
            ))}
          </div>
          <div className="flex gap-8 justify-center mt-10 border-t border-white/20 pt-8">
            {[{n:"3M+",l:"Shoppers"},{n:"85K+",l:"Sellers"},{n:"4.9★",l:"Rating"}].map(s => (
              <div key={s.l}><p className="text-2xl font-black">{s.n}</p><p className="text-white/60 text-xs">{s.l}</p></div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto lg:hidden">
            <div className="w-9 h-9 bg-linear-to-br from-violet-600 to-orange-500 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-2xl font-black dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
          </button>
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Welcome back</h2>
            <p className="text-gray-400 text-sm mb-7">Sign in to continue shopping</p>
            {error && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 mb-5"><span className="text-red-500 text-sm">⚠️</span><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
            <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 transition-all mb-5">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" /><span className="text-xs text-gray-400 font-medium">or continue with email</span><div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" /></div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" /></div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5"><label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label><button type="button" onClick={() => nav("forgot")} className="text-xs text-violet-600 font-semibold hover:underline">Forgot password?</button></div>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span><input type={showPass?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPass?"🙈":"👁"}</button></div>
              </div>
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-all active:scale-[0.98] disabled:opacity-70">
                {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><span>→</span></>}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <button onClick={() => nav("register")} className="text-violet-600 font-black hover:underline">Create one free</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}
