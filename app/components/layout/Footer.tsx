
import React from "react";
import Link from "next/link";

const FOOTER_LINKS = {
  Shop:    ["Flash Deals","New Arrivals","Best Sellers","Trending Now","Gift Cards","Bulk Orders"],
  Sell:    ["Seller Onboarding","Seller University","Seller Analytics","Seller Dashboard","Advertise","Partner Program"],
  Support: ["Help Center","Contact Us","Returns & Refunds","Buyer Protection","Report Abuse","Sitemap"],
  Company: ["About Us","Careers","Blog","Press","Investors","Privacy Policy","Terms of Service","Cookie Policy"],
};

export function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16">
      {/* Newsletter */}
      <div className="bg-linear-to-r from-blue-900 to-blue-800 py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Get exclusive deals in your inbox</h3>
            <p className="text-blue-300 text-sm">Join 500K+ shoppers. Unsubscribe anytime.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto max-w-sm">
            <input type="email" placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 text-sm outline-none focus:border-white/50" />
            <button className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm rounded-xl transition-colors whitespace-nowrap">
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-400 rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
              <span className="text-xl font-black text-white">Nex<span className="text-blue-400">Mart</span></span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">Nepal's AI-powered marketplace. Shop smarter, live better.</p>
            <div className="flex gap-2">
              {["facebook","instagram","twitter","youtube","linkedin"].map((s) => (
                <a key={s} href={`https://${s}.com`} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 bg-gray-800 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors text-xs font-bold text-gray-400 hover:text-white capitalize">
                  {s[0].toUpperCase()}
                </a>
              ))}
            </div>
          </div>
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-white font-semibold text-sm mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map((l) => (
                  <li key={l}><Link href="#" className="text-sm hover:text-white transition-colors">{l}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* App download */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8 border-t border-gray-800">
          <div>
            <p className="text-white font-semibold mb-2">Get the NexMart App</p>
            <div className="flex gap-3">
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors">
                <span className="text-xl">🍎</span>
                <div><p className="text-xs text-gray-400">Download on</p><p className="text-sm font-semibold text-white">App Store</p></div>
              </a>
              <a href="#" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition-colors">
                <span className="text-xl">🤖</span>
                <div><p className="text-xs text-gray-400">Get it on</p><p className="text-sm font-semibold text-white">Google Play</p></div>
              </a>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm mb-2">Secure payments</p>
            <div className="flex gap-2 justify-end flex-wrap">
              {["eSewa","Khalti","Visa","Mastercard","COD"].map((m) => (
                <span key={m} className="bg-gray-800 text-gray-300 text-xs font-semibold px-3 py-1.5 rounded-lg">{m}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} NexMart Pvt. Ltd. · Registered in Nepal · All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}