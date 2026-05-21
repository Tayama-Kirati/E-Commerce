"use client";
import { useUIStore } from "@/app/lib/store";

export function RoleSelectPage() {
 const { nav } = useUIStore();

 return (
 <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-6">
 <button onClick={() => nav("home")} className="flex items-center mb-12">
 <span className="text-3xl font-black text-gray-900 dark:text-white">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </button>

 <div className="text-center mb-10">
 <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">How will you use Pea<span style={{ color: "#C68313" }}>Nut</span>?</h1>
 <p className="text-gray-400 text-base">Choose your account type to get started</p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
 {/* Customer Card */}
 <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-lg hover:border-[#C68313] hover:shadow-amber-100 dark:hover:border-[#C68313] dark:hover:shadow-none transition-all duration-200 p-8 flex flex-col items-center text-center group cursor-pointer"
 onClick={() => nav("login", { role: "CUSTOMER" } as any)}>
 <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-3xl flex items-center justify-center text-4xl mb-5 group-hover:scale-105 transition-transform">
 🛍️
 </div>
 <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">I'm a Customer</h2>
 <p className="text-gray-400 text-sm mb-6 leading-relaxed">Shop millions of products with AI-powered recommendations and exclusive deals</p>
 <div className="flex flex-col gap-2 w-full">
 <button
 onClick={e => { e.stopPropagation(); nav("login", { role: "CUSTOMER" } as any); }}
 className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#2D3748" }}>
 Sign In
 </button>
 <button
 onClick={e => { e.stopPropagation(); nav("register", { role: "CUSTOMER" } as any); }}
 className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#C68313" }}>
 Create Account
 </button>
 </div>
 </div>

 {/* Seller Card */}
 <div className="bg-white dark:bg-gray-900 rounded-3xl border-2 border-gray-100 dark:border-gray-800 shadow-lg hover:border-orange-400 hover:shadow-orange-100 dark:hover:border-orange-500 dark:hover:shadow-none transition-all duration-200 p-8 flex flex-col items-center text-center group cursor-pointer"
 onClick={() => nav("login", { role: "SELLER" } as any)}>
 <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/40 dark:to-orange-800/40 rounded-3xl flex items-center justify-center text-4xl mb-5 group-hover:scale-105 transition-transform">
 🏪
 </div>
 <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">I'm a Seller</h2>
 <p className="text-gray-400 text-sm mb-6 leading-relaxed">Reach millions of customers, manage your store, and grow your business</p>
 <div className="flex flex-col gap-2 w-full">
 <button
 onClick={e => { e.stopPropagation(); nav("login", { role: "SELLER" } as any); }}
 className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#2D3748" }}>
 Sign In
 </button>
 <button
 onClick={e => { e.stopPropagation(); nav("register", { role: "SELLER" } as any); }}
 className="w-full py-3 rounded-2xl font-black text-sm text-white hover:opacity-90 transition-colors" style={{ backgroundColor: "#C68313" }}>
 Start Selling
 </button>
 </div>
 <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
 <span>🏆</span><span>Join 85,000+ sellers on Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </div>
 </div>
 </div>

 <p className="text-center text-sm text-gray-400 mt-8">
 Already have an account?{" "}
 <button onClick={() => nav("login")} className="font-bold hover:underline" style={{ color: "#C68313" }}>Sign in directly</button>
 </p>
 </div>
 );
}
