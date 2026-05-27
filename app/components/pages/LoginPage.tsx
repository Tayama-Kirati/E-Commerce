"use client";
import { useState, useRef, useEffect } from "react";
import { useUIStore, useAuthStore } from "@/app/lib/store";

type Mode = "email" | "wa-phone" | "wa-otp";

const DEMO_OTP = "256189";

export function LoginPage() {
 const { nav, showToast, pageData } = useUIStore();
 const { setUser } = useAuthStore();
 const intendedRole = (pageData?.role as string) ?? "CUSTOMER";

 // email mode state
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [showPass, setShowPass] = useState(false);

 // whatsapp mode state
 const [phone, setPhone] = useState("");
 const [otp, setOtp] = useState(["","","","","",""]);
 const otpRefs = [
 useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
 useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
 useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
 ];
 const [resendTimer, setResendTimer] = useState(0);

 // shared state
 const [mode, setMode] = useState<Mode>("email");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");

 useEffect(() => {
 if (resendTimer <= 0) return;
 const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
 return () => clearTimeout(t);
 }, [resendTimer]);

 const loginUser = (identifier: string) => {
 const name = identifier.includes("@")
 ? identifier.split("@")[0].replace(/\./g," ").replace(/\b\w/g, c => c.toUpperCase())
 : `User ${identifier.slice(-4)}`;
 setUser({ name, email: identifier, role: intendedRole as any, loyaltyPoints: 100, loyaltyTier: "BRONZE" });
 showToast("Welcome back! 👋");
 nav(intendedRole === "SELLER" ? "seller" : "home");
 };

 const submitEmail = async (e: { preventDefault(): void }) => {
 e.preventDefault();
 setError("");
 if (!email || !password) { setError("Please fill in all fields."); return; }
 setLoading(true);
 await new Promise(r => setTimeout(r, 900));
 setLoading(false);
 if (password.length < 6) { setError("Incorrect email or password."); return; }
 loginUser(email);
 };

 const sendWhatsApp = async (e: { preventDefault(): void }) => {
 e.preventDefault();
 setError("");
 const digits = phone.replace(/\D/g, "");
 if (digits.length < 7) { setError("Enter a valid phone number."); return; }
 setLoading(true);
 await new Promise(r => setTimeout(r, 1000));
 setLoading(false);
 setMode("wa-otp");
 setResendTimer(30);
 showToast(`Code sent to WhatsApp: ${DEMO_OTP} (demo)`);
 };

 const submitOtp = async (e: { preventDefault(): void }) => {
 e.preventDefault();
 setError("");
 const entered = otp.join("");
 if (entered.length < 6) { setError("Enter the 6-digit code."); return; }
 setLoading(true);
 await new Promise(r => setTimeout(r, 800));
 setLoading(false);
 if (entered !== DEMO_OTP) { setError("Invalid code. Try again."); setOtp(["","","","","",""]); otpRefs[0].current?.focus(); return; }
 loginUser(phone);
 };

 const handleOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
 if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs[i-1].current?.focus();
 };

 const handleOtpChange = (i: number, val: string) => {
 const digit = val.replace(/\D/g, "").slice(-1);
 const next = [...otp];
 next[i] = digit;
 setOtp(next);
 if (digit && i < 5) otpRefs[i+1].current?.focus();
 };

 const handleOtpPaste = (e: React.ClipboardEvent) => {
 const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
 if (!text) return;
 e.preventDefault();
 const next = ["","","","","",""];
 text.split("").forEach((d, i) => { next[i] = d; });
 setOtp(next);
 otpRefs[Math.min(text.length, 5)].current?.focus();
 };

 const switchMode = (m: Mode) => { setMode(m); setError(""); setOtp(["","","","","",""]); };

 const leftPanel = (
 <div className="hidden lg:flex flex-1 bg-linear-to-br from-[#1C1A16] via-[#2D2418] to-[#C68313] items-center justify-center p-12 relative overflow-hidden">
 <div className="absolute inset-0 overflow-hidden">
 <div className="absolute -top-40 -left-40 w-96 h-96 bg-[rgba(198,131,19,0.1)] rounded-full" />
 <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-[rgba(198,131,19,0.1)] rounded-full" />
 </div>
 <div className="relative z-10 text-white text-center max-w-md">
 <div className="flex items-center justify-center gap-3 mb-10">
 <span className="text-3xl font-black">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </div>
 <h1 className="text-4xl font-black mb-4 leading-tight">Nepal's Smartest Shopping Experience</h1>
 <p className="text-white/70 text-lg mb-10">AI-powered recommendations, flash deals, and trusted sellers.</p>
 <div className="flex flex-col gap-3">
 {[{icon:"✨",l:"AI-Powered Recommendations"},{icon:"🛡️",l:"100% Buyer Protection"},{icon:"⚡",l:"Flash Deals Every Hour"}].map(f => (
 <div key={f.l} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl px-5 py-3 text-left">
 <span className="text-xl">{f.icon}</span><span className="font-semibold text-sm">{f.l}</span>
 </div>
 ))}
 </div>
 <div className="flex gap-8 justify-center mt-10 border-t border-white/20 pt-8">
 {[{n:"3M+",l:"Shoppers"},{n:"85K+",l:"Sellers"},{n:"4.9★",l:"Rating"}].map(s => (
 <div key={s.l}><p className="text-2xl font-black">{s.n}</p><p className="text-white/60 text-xs">{s.l}</p></div>
 ))}
 </div>
 </div>
 </div>
 );

 // ── WhatsApp OTP screen ──────────────────────────────────────────────────
 if (mode === "wa-otp") return (
 <div className="min-h-screen flex">
 {leftPanel}
 <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
 <div className="w-full max-w-md">
 <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto lg:hidden">
 <span className="text-2xl font-black text-gray-900 dark:text-white">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </button>
 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
 <button onClick={() => switchMode("wa-phone")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
 <span>←</span> Back
 </button>
 <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto" style={{background:"#25D366"}}>
 <WhatsAppIcon className="w-9 h-9 text-white" />
 </div>
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1 text-center">Enter OTP</h2>
 <p className="text-gray-400 text-sm mb-2 text-center">
 We sent a 6-digit code to WhatsApp<br />
 <span className="font-semibold text-gray-700 dark:text-gray-300">{phone}</span>
 </p>
 <p className="text-xs text-center text-[#25D366] font-semibold mb-6">Demo code: {DEMO_OTP}</p>
 {error && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 mb-5"><span className="text-red-500 text-sm">⚠️</span><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
 <form onSubmit={submitOtp} className="space-y-5">
 <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
 {otp.map((digit, i) => (
 <input
 key={i}
 ref={otpRefs[i]}
 type="text"
 inputMode="numeric"
 maxLength={1}
 value={digit}
 onChange={e => handleOtpChange(i, e.target.value)}
 onKeyDown={e => handleOtpKey(i, e)}
 className="w-12 h-14 text-center text-xl font-black border-2 rounded-2xl outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30"
 />
 ))}
 </div>
 <button type="submit" disabled={loading || otp.join("").length < 6}
 className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
 style={{background: loading || otp.join("").length < 6 ? undefined : "#25D366", backgroundColor: loading || otp.join("").length < 6 ? "#9ca3af" : "#25D366"}}>
 {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Verify & Sign In</span><span>→</span></>}
 </button>
 </form>
 <div className="text-center mt-5">
 {resendTimer > 0
 ? <p className="text-sm text-gray-400">Resend code in <span className="font-bold text-gray-600 dark:text-gray-300">{resendTimer}s</span></p>
 : <button onClick={sendWhatsApp as any} className="text-sm font-semibold text-[#25D366] hover:underline">Resend code</button>
 }
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 // ── WhatsApp phone screen ───────────────────────────────────────────────
 if (mode === "wa-phone") return (
 <div className="min-h-screen flex">
 {leftPanel}
 <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
 <div className="w-full max-w-md">
 <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto lg:hidden">
 <span className="text-2xl font-black text-gray-900 dark:text-white">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </button>
 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
 <button onClick={() => switchMode("email")} className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
 <span>←</span> Back
 </button>
 <div className="flex items-center justify-center w-16 h-16 rounded-2xl mb-5 mx-auto" style={{background:"#25D366"}}>
 <WhatsAppIcon className="w-9 h-9 text-white" />
 </div>
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Sign in with WhatsApp</h2>
 <p className="text-gray-400 text-sm mb-7">We'll send a one-time code to your WhatsApp number</p>
 {error && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 mb-5"><span className="text-red-500 text-sm">⚠️</span><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}
 <form onSubmit={sendWhatsApp} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">WhatsApp number</label>
 <div className="flex gap-2">
 <div className="flex items-center gap-1.5 px-3 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
 <span className="text-base">🇳🇵</span> +977
 </div>
 <input
 type="tel"
 value={phone}
 onChange={e => setPhone(e.target.value)}
 placeholder="98XXXXXXXX"
 autoComplete="tel"
 className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 dark:focus:ring-green-900/30 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all"
 />
 </div>
 </div>
 <button type="submit" disabled={loading}
 className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm text-white transition-all active:scale-[0.98] disabled:opacity-60"
 style={{backgroundColor:"#25D366"}}>
 {loading
 ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
 : <><WhatsAppIcon className="w-4 h-4" /><span>Send WhatsApp Code</span></>}
 </button>
 </form>
 <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
 By continuing you agree to receive a WhatsApp message from PeaNut
 </p>
 </div>
 </div>
 </div>
 </div>
 );

 // ── Email / default screen ───────────────────────────────────────────────
 return (
 <div className="min-h-screen flex">
 {leftPanel}
 <div className="flex-1 flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
 <div className="w-full max-w-md">
 <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto lg:hidden">
 <span className="text-2xl font-black text-gray-900 dark:text-white">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </button>
 <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
 <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Welcome back</h2>
 <p className="text-gray-400 text-sm mb-7">Sign in to continue shopping</p>
 {error && <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 mb-5"><span className="text-red-500 text-sm">⚠️</span><p className="text-sm text-red-600 dark:text-red-400">{error}</p></div>}

 {/* Social buttons */}
 <div className="flex flex-col gap-3 mb-5">
 <button className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold text-sm hover:bg-gray-50 transition-all">
 <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
 Continue with Google
 </button>
 <button
 onClick={() => switchMode("wa-phone")}
 className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all text-white"
 style={{backgroundColor:"#25D366", borderColor:"#25D366"}}>
 <WhatsAppIcon className="w-5 h-5" />
 Continue with WhatsApp
 </button>
 </div>

 <div className="flex items-center gap-3 mb-5">
 <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
 <span className="text-xs text-gray-400 font-medium">or continue with email</span>
 <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
 </div>

 <form onSubmit={submitEmail} className="space-y-4">
 <div>
 <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email address</label>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">✉</span>
 <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-[#C68313] focus:ring-2 focus:ring-[rgba(198,131,19,0.15)] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
 </div>
 </div>
 <div>
 <div className="flex justify-between mb-1.5">
 <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Password</label>
 <button type="button" onClick={() => nav("forgot")} className="text-xs text-[#C68313] font-semibold hover:underline">Forgot password?</button>
 </div>
 <div className="relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔒</span>
 <input type={showPass?"text":"password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-2xl text-sm outline-none focus:border-[#C68313] focus:ring-2 focus:ring-[rgba(198,131,19,0.15)] bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 transition-all" />
 <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#C68313] transition-colors">
   <EyeIcon open={showPass} />
 </button>
 </div>
 </div>
 <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-[#C68313] text-white hover:bg-[#9B6210] active:bg-[#7A5010] transition-all active:scale-[0.98] disabled:opacity-70">
 {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Sign In</span><span>→</span></>}
 </button>
 </form>
 <p className="text-center text-sm text-gray-500 mt-6">Don't have an account? <button onClick={() => nav("register")} className="text-[#C68313] font-black hover:underline">Create one free</button></p>
 </div>
 </div>
 </div>
 </div>
 );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="currentColor">
 <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
 </svg>
 );
}
