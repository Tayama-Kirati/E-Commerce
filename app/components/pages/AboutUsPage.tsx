"use client";
import { useUIStore } from "@/app/lib/store";

const GOLD     = "#C68313";
const CHARCOAL = "var(--color-heading)";
const MUTED    = "var(--color-muted)";
const BORDER   = "#E8D5A8";

const TRUST_BADGES = [
  { icon: "🛡️", t: "Buyer Protection",  s: "100% safe shopping — every purchase is covered." },
  { icon: "🚚", t: "Fast Delivery",      s: "2-3 days nationwide across Nepal."               },
  { icon: "↩️", t: "Easy Returns",       s: "7-day hassle-free returns, no questions asked."  },
  { icon: "💳", t: "Secure Payment",     s: "Multiple secure payment methods accepted."       },
];

const TEAM = [
  { name: "Anish Shrestha",  role: "CEO & Co-Founder",      avatar: "AS" },
  { name: "Priya Tamang",    role: "CTO & Co-Founder",      avatar: "PT" },
  { name: "Rohan Karki",     role: "Head of Operations",    avatar: "RK" },
  { name: "Sita Maharjan",   role: "Head of Customer Care", avatar: "SM" },
];

export function AboutUsPage() {
  const { nav } = useUIStore();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>

      {/* Hero */}
      <div className="py-16 px-4 text-center" style={{ background: `linear-gradient(135deg, ${GOLD}18 0%, transparent 60%)` }}>
        <h1 className="text-4xl font-black mb-3" style={{ color: CHARCOAL }}>
          About <span style={{ color: GOLD }}>PeaNut</span>
        </h1>
        <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: MUTED }}>
          Nepal's fastest-growing AI-powered marketplace — connecting buyers and sellers across every province.
        </p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-16 space-y-12">

        {/* Mission */}
        <div className="bg-white dark:bg-[#1A1814] rounded-2xl p-8" style={{ border: `1px solid ${BORDER}` }}>
          <h2 className="text-xl font-black mb-3" style={{ color: CHARCOAL }}>Our Mission</h2>
          <p className="text-sm leading-relaxed" style={{ color: MUTED }}>
            PeaNut was founded with a single mission: make quality products accessible to every Nepali, wherever they are.
            We partner with local sellers, artisans, and national brands to bring you a curated marketplace that is fast,
            transparent, and trustworthy. From Kathmandu to Karnali — we deliver.
          </p>
        </div>

        {/* Why shop with us */}
        <div>
          <h2 className="text-xl font-black mb-4" style={{ color: CHARCOAL }}>Why Shop With Us</h2>
          <div className="bg-white dark:bg-[#1A1814] rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <ul className="divide-y" style={{ borderColor: BORDER }}>
              {TRUST_BADGES.map(item => (
                <li key={item.t} className="flex items-center gap-4 px-6 py-4">
                  <span className="text-3xl shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{item.t}</p>
                    <p className="text-xs mt-0.5" style={{ color: MUTED }}>{item.s}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { n: "500K+", label: "Happy Customers" },
            { n: "12K+",  label: "Products Listed" },
            { n: "77",    label: "Districts Covered" },
            { n: "2K+",   label: "Active Sellers" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-[#1A1814] rounded-2xl p-5 text-center" style={{ border: `1px solid ${BORDER}` }}>
              <p className="text-2xl font-black" style={{ color: GOLD }}>{s.n}</p>
              <p className="text-xs mt-1" style={{ color: MUTED }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Team */}
        <div>
          <h2 className="text-xl font-black mb-4" style={{ color: CHARCOAL }}>Meet the Team</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {TEAM.map(m => (
              <div key={m.name} className="bg-white dark:bg-[#1A1814] rounded-2xl p-5 text-center" style={{ border: `1px solid ${BORDER}` }}>
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-base mx-auto mb-3"
                  style={{ backgroundColor: GOLD }}
                >
                  {m.avatar}
                </div>
                <p className="text-sm font-bold" style={{ color: CHARCOAL }}>{m.name}</p>
                <p className="text-xs mt-0.5" style={{ color: MUTED }}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={() => nav("products")}
            className="px-8 py-3.5 rounded-full text-white font-black text-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: GOLD }}
          >
            Start Shopping
          </button>
          <button
            onClick={() => nav("customer-care")}
            className="ml-4 px-8 py-3.5 rounded-full text-sm font-bold hover:underline"
            style={{ color: GOLD }}
          >
            Contact Us
          </button>
        </div>

      </div>
    </div>
  );
}
