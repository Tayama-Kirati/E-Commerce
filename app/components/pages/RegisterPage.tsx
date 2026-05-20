"use client";
import { useState } from "react";
import { cn, useUIStore, useAuthStore, apiPost } from "@/app/lib/store";

export function RegisterPage() {
  const { nav, showToast } = useUIStore();
  const { setUser }        = useAuthStore();
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", phone:"", password:"", confirmPassword:"", accept:false });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const set = (k: string, v: any) => setForm(p => ({...p,[k]:v}));
  const pw = form.password;
  const pwChecks = [pw.length>=8,/[A-Z]/.test(pw),/[0-9]/.test(pw),/[^A-Za-z0-9]/.test(pw)];
  const pwScore  = pwChecks.filter(Boolean).length;
  const pwColors = ["","bg-red-500","bg-orange-500","bg-yellow-500","bg-green-500"];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.firstName.length < 2) errs.firstName = "Min 2 chars";
    if (form.lastName.length  < 2) errs.lastName  = "Min 2 chars";
    if (!form.email.includes("@")) errs.email     = "Invalid email";
    if (pwScore < 4) errs.password = "Password too weak";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords don't match";
    if (!form.accept) errs.accept = "You must accept the terms";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    const res = await apiPost("/api/auth/register", { ...form });
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    if (res?.error) { setErrors({ email: res.error }); return; }
    setUser({ name:`${form.firstName} ${form.lastName}`, email:form.email, role:"CUSTOMER", loyaltyPoints:150, loyaltyTier:"BRONZE" });
    showToast("Account created! Welcome to NexMart 🎉");
    nav("home");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-violet-50 via-white to-orange-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4 py-10">
      <div className="w-full max-w-lg">
        <button onClick={() => nav("home")} className="flex items-center justify-center gap-2 mb-8 mx-auto">
          <div className="w-10 h-10 bg-linear-to-br from-violet-600 to-orange-500 rounded-2xl flex items-center justify-center text-white font-black text-lg">N</div>
          <span className="text-2xl font-black dark:text-white">Nex<span className="text-violet-600">Mart</span></span>
        </button>
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl p-8">
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Create your account</h1>
          <p className="text-gray-400 text-sm mb-5">Join 3M+ shoppers on NexMart</p>
          <div className="flex items-center gap-3 bg-linear-to-r from-violet-50 to-orange-50 dark:from-violet-900/20 dark:to-orange-900/20 border border-violet-100 dark:border-violet-800 rounded-2xl px-4 py-3 mb-6">
            <span className="text-xl">🎁</span>
            <div><p className="text-sm font-bold text-gray-900 dark:text-white">100 welcome points on sign up!</p><p className="text-xs text-gray-500">Worth रू 10 · usable on first order</p></div>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[{k:"firstName",lbl:"First Name *",ph:"Arun"},{k:"lastName",lbl:"Last Name *",ph:"Kumar"}].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{f.lbl}</label>
                  <input value={(form as any)[f.k]} onChange={e => set(f.k,e.target.value)} placeholder={f.ph} className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors[f.k]?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
                  {errors[f.k] && <p className="text-xs text-red-500 mt-1">{errors[f.k]}</p>}
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address *</label>
              <input type="email" value={form.email} onChange={e => set("email",e.target.value)} placeholder="you@example.com" className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.email?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password *</label>
              <div className="relative">
                <input type={showPass?"text":"password"} value={form.password} onChange={e => set("password",e.target.value)} placeholder="Create a strong password" className={cn("w-full pl-4 pr-12 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.password?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">{showPass?"🙈":"👁"}</button>
              </div>
              {pw && <div className="mt-2"><div className="flex gap-1 items-center">{[1,2,3,4].map(i => <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors",i<=pwScore?pwColors[pwScore]:"bg-gray-200 dark:bg-gray-700")} />)}{pwScore>0 && <span className={cn("text-xs font-semibold ml-2",pwScore<=1?"text-red-500":pwScore<=2?"text-orange-500":pwScore<=3?"text-yellow-600":"text-green-600")}>{["","Weak","Fair","Good","Strong"][pwScore]}</span>}</div></div>}
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={e => set("confirmPassword",e.target.value)} placeholder="Repeat your password" className={cn("w-full px-4 py-3 border-2 rounded-2xl text-sm outline-none transition-all bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400",errors.confirmPassword?"border-red-400":"border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/30")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
            </div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={form.accept} onChange={e => set("accept",e.target.checked)} className="w-4 h-4 mt-0.5 accent-violet-600 shrink-0" />
              <span className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">I agree to NexMart's <span className="text-violet-600 font-bold">Terms of Service</span> and <span className="text-violet-600 font-bold">Privacy Policy</span></span>
            </label>
            {errors.accept && <p className="text-xs text-red-500">{errors.accept}</p>}
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-sm bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800 transition-all active:scale-[0.98] disabled:opacity-60">
              {loading ? <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <><span>Create Account</span><span>→</span></>}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">Already have an account? <button onClick={() => nav("login")} className="text-violet-600 font-black hover:underline">Sign in</button></p>
        </div>
      </div>
    </div>
  );
}
