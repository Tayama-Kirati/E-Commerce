"use client";
import { useUIStore } from "@/app/lib/store";

export function Footer() {
 const { nav } = useUIStore();
 return (
 <footer className="bg-gray-950 text-gray-400 mt-16">
 <div className="py-8 px-4" style={{ backgroundColor: "#C68313" }}>
 <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
 <div><h3 className="text-white font-bold text-lg mb-1">Get exclusive deals in your inbox</h3><p className="text-white/70 text-sm">Join 500K+ shoppers. Unsubscribe anytime.</p></div>
 <div className="flex gap-2 w-full md:w-auto max-w-sm"><input type="email" placeholder="your@email.com" className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/50 text-sm outline-none focus:border-white/60" /><button className="px-5 py-2.5 bg-white text-[#C68313] font-bold text-sm rounded-xl transition-colors whitespace-nowrap hover:bg-gray-100">Subscribe</button></div>
 </div>
 </div>
 <div className="max-w-7xl mx-auto px-4 py-10">
 <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
 <div className="col-span-2 md:col-span-1">
 <button onClick={() => nav("home")} className="flex items-center mb-4">
 <span className="text-xl font-black text-white">Pea<span style={{ color: "#C68313" }}>Nut</span></span>
 </button>
 <p className="text-sm leading-relaxed mb-4">Nepal's AI-powered marketplace. Shop smarter, live better.</p>
 </div>
 {[
 { t:"Shop", ls:["Flash Deals","New Arrivals","Best Sellers","Gift Cards"] },
 { t:"Sell", ls:["Start Selling","Seller Hub","Seller Analytics","Partner Program"]},
 { t:"Support", ls:["Help Center","Contact Us","Returns","Buyer Protection"] },
 { t:"Company", ls:["About Us","Blog","Careers","Privacy Policy"] },
 ].map(({t,ls}) => (
 <div key={t}><h4 className="text-white font-bold text-sm mb-4">{t}</h4><ul className="space-y-2">{ls.map(l => <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>)}</ul></div>
 ))}
 </div>
 <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
 <p>© 2026 Pea<span style={{ color: "#C68313" }}>Nut</span> Pvt. Ltd. · Registered in Nepal · All rights reserved.</p>
 <div className="flex gap-3 flex-wrap justify-center">
 {["eSewa","Khalti","Visa","Mastercard","COD"].map(m => <span key={m} className="bg-gray-800 text-gray-300 font-bold px-3 py-1.5 rounded-lg">{m}</span>)}
 </div>
 </div>
 </div>
 </footer>
 );
}
