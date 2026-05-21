"use client";
import { useUIStore } from "@/app/lib/store";

const GOLD = "#C68313";

const CUSTOMER_CARE = [
  { label: "Help Center",       section: "help-center" },
  { label: "How to Buy",        section: "how-to-buy" },
  { label: "Returns & Refunds", section: "returns-refunds" },
  { label: "Contact Us",        section: "contact-us" },
];

export function Footer() {
  const { nav } = useUIStore();

  return (
    <footer className="bg-gray-100 dark:bg-gray-950 text-gray-600 dark:text-gray-400 mt-16">
      {/* Newsletter strip */}
      <div className="py-8 px-4" style={{ backgroundColor: GOLD }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
          <div>
            <h3 className="text-white font-bold text-lg mb-1">Get exclusive deals in your inbox</h3>
            <p className="text-white/70 text-sm">Join 500K+ shoppers. Unsubscribe anytime.</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto max-w-sm">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder:text-white/50 text-sm outline-none focus:border-white/60"
            />
            <button className="px-5 py-2.5 bg-white font-bold text-sm rounded-xl transition-colors whitespace-nowrap hover:bg-gray-100" style={{ color: GOLD }}>
              Subscribe
            </button>
          </div>
        </div>
      </div>

      {/* Main columns */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <button onClick={() => nav("home")} className="flex items-center mb-4">
              <span className="text-xl font-black text-gray-900 dark:text-white">
                Pea<span style={{ color: GOLD }}>Nut</span>
              </span>
            </button>
            <p className="text-sm leading-relaxed mb-4">
              Nepal's AI-powered marketplace. Shop smarter, live better.
            </p>
          </div>

          {/* Customer Care */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-4">Customer Care</h4>
            <ul className="space-y-2">
              {CUSTOMER_CARE.map(({ label, section }) => (
                <li key={section}>
                  <button
                    onClick={() => nav("customer-care", { section })}
                    className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors text-left"
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-4">Shop</h4>
            <ul className="space-y-2">
              {[
                { label: "Flash Deals",  action: () => nav("products", { flashSale: true }) },
                { label: "New Arrivals", action: () => nav("products") },
                { label: "Best Sellers", action: () => nav("products", { sort: "sales_desc" }) },
                { label: "All Products", action: () => nav("products") },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action} className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors text-left">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-4">Sell</h4>
            <ul className="space-y-2">
              {[
                { label: "Start Selling",   action: () => nav("onboarding") },
                { label: "Seller Hub",      action: () => nav("seller") },
                { label: "Partner Program", action: () => nav("onboarding") },
              ].map(({ label, action }) => (
                <li key={label}>
                  <button onClick={action} className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors text-left">
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-4">Company</h4>
            <ul className="space-y-2">
              {["About Us", "Blog", "Careers", "Privacy Policy"].map(l => (
                <li key={l}><a href="#" className="text-sm hover:text-gray-900 dark:hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-300 dark:border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p>© 2026 Pea<span style={{ color: GOLD }}>Nut</span> Pvt. Ltd. · Registered in Nepal · All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
