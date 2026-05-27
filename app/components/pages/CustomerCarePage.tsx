"use client";
import { useState, useEffect } from "react";
import { useUIStore } from "@/app/lib/store";

const GOLD   = "#C68313";
const BORDER = "#E8D5A8";
const IVORY  = "var(--color-surface-warm)";
const MUTED  = "var(--color-muted)";

const SECTIONS = [
  { key: "help-center",     label: "Help Center",       icon: "❓" },
  { key: "how-to-buy",      label: "How to Buy",        icon: "🛒" },
  { key: "how-to-sell",     label: "Sell on PeaNut",    icon: "🏪" },
  { key: "returns-refunds", label: "Returns & Refunds", icon: "↩️" },
  { key: "contact-us",      label: "Contact Us",        icon: "📞" },
];

// ── Help Center ───────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: "How do I create an account?",
    a: "Click 'Sign in' on the top-right of any page, then select 'Register'. Fill in your name, email, and password. You'll receive a confirmation email to verify your account.",
  },
  {
    q: "How do I track my order?",
    a: "Go to 'My Orders' from your profile menu. Each order has a 'Track' button that shows real-time delivery status and estimated arrival date.",
  },
  {
    q: "What payment methods are accepted?",
    a: "We accept eSewa, Khalti, Visa, Mastercard, and Cash on Delivery (COD). All online payments are secured with 256-bit SSL encryption.",
  },
  {
    q: "Is my personal information safe?",
    a: "Yes. We use industry-standard encryption and never sell your personal data to third parties. Read our Privacy Policy for full details.",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Orders can be changed or cancelled within 1 hour of placing them. Go to 'My Orders', select the order, and click 'Cancel'. After 1 hour the order enters processing and cannot be changed.",
  },
  {
    q: "How do I become a seller?",
    a: "Click your profile icon, select 'Become a Seller', and complete the seller onboarding form. Your store will be reviewed and activated within 24-48 hours.",
  },
];

function HelpCenter() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-heading)" }}>Help Center</h2>
      <p className="mb-8" style={{ color: MUTED }}>Find answers to the most common questions about shopping on PeaNut.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {[
          { icon: "📦", title: "Orders & Shipping", desc: "Track orders, delivery times, shipping costs" },
          { icon: "💳", title: "Payments", desc: "Accepted methods, failed payments, receipts" },
          { icon: "🔒", title: "Account & Security", desc: "Password reset, 2FA, account settings" },
        ].map(card => (
          <div key={card.title} className="rounded-2xl p-5 text-center" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
            <div className="text-4xl mb-3">{card.icon}</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-heading)" }}>{card.title}</p>
            <p className="text-xs" style={{ color: MUTED }}>{card.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="font-black text-lg mb-4" style={{ color: "var(--color-heading)" }}>Frequently Asked Questions</h3>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <button
              className="flex items-center justify-between w-full px-5 py-4 text-left font-semibold text-sm transition-colors"
              style={{ backgroundColor: open === i ? IVORY : "transparent", color: "var(--color-heading)" }}
              onClick={() => setOpen(open === i ? null : i)}
            >
              <span>{faq.q}</span>
              <span className="ml-4 text-lg shrink-0 transition-transform" style={{ transform: open === i ? "rotate(45deg)" : "none", color: GOLD }}>+</span>
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: MUTED }}>
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How to Buy ────────────────────────────────────────────────────────────────
const STEPS = [
  { step: "1", icon: "🔍", title: "Browse & Search", desc: "Use the search bar or browse categories to find what you're looking for. Filter by price, rating, and availability to narrow results." },
  { step: "2", icon: "🛒", title: "Add to Cart", desc: "Click 'Add to bag' on any product you want. You can continue shopping and add multiple items before checkout." },
  { step: "3", icon: "❤️", title: "Save for Later", desc: "Use the wishlist button to save products you love. Your wishlist is synced across devices when you're signed in." },
  { step: "4", icon: "✅", title: "Checkout Securely", desc: "Click your cart, review your items, enter your delivery address, choose a payment method, and confirm your order." },
  { step: "5", icon: "📦", title: "Track Your Order", desc: "After placing your order, go to 'My Orders' to track delivery status in real time. You'll also receive SMS/email updates." },
];

function HowToBuy() {
  return (
    <div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-heading)" }}>How to Buy</h2>
      <p className="mb-8" style={{ color: MUTED }}>Shopping on PeaNut is simple, fast, and secure. Follow these steps to place your first order.</p>

      <div className="space-y-4 mb-10">
        {STEPS.map((s) => (
          <div key={s.step} className="flex gap-5 rounded-2xl p-5" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: GOLD + "20", border: `2px solid ${GOLD}` }}>
              {s.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: GOLD }}>STEP {s.step}</span>
                <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{s.title}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-6" style={{ background: `linear-gradient(135deg, #1C1A16, #2D2418)` }}>
        <h3 className="text-white font-black mb-3">Shopping Tips</h3>
        <ul className="space-y-2">
          {[
            "✅ Always check seller ratings and reviews before buying",
            "✅ Look for the verified seller badge for trusted stores",
            "✅ Orders above रू 1,000 qualify for free shipping",
            "✅ Flash Sale prices are only valid during the sale window",
            "✅ Use eSewa or Khalti for instant payment confirmation",
          ].map(tip => (
            <li key={tip} className="text-sm" style={{ color: "#B8A882" }}>{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ── Returns & Refunds ─────────────────────────────────────────────────────────
function ReturnsRefunds() {
  return (
    <div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-heading)" }}>Returns & Refunds</h2>
      <p className="mb-8" style={{ color: MUTED }}>We want you to be completely satisfied. If something isn't right, we'll make it right.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "📅", title: "7-Day Returns", desc: "Most items can be returned within 7 days of delivery" },
          { icon: "⚡", title: "Fast Refunds", desc: "Refunds processed within 3-5 business days" },
          { icon: "🆓", title: "Free Returns", desc: "Free pickup for defective or wrong items" },
        ].map(c => (
          <div key={c.title} className="rounded-2xl p-5 text-center" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="font-bold text-sm mb-1" style={{ color: "var(--color-heading)" }}>{c.title}</p>
            <p className="text-xs" style={{ color: MUTED }}>{c.desc}</p>
          </div>
        ))}
      </div>

      <h3 className="font-black text-base mb-4" style={{ color: "var(--color-heading)" }}>Return Policy</h3>
      <div className="rounded-2xl overflow-hidden mb-6" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: IVORY }}>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>Category</th>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>Return Window</th>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>Condition</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Electronics", "7 days", "Unused, in original packaging"],
              ["Clothing & Shoes", "14 days", "Unworn, tags attached"],
              ["Cosmetics & Beauty", "7 days", "Unopened, sealed"],
              ["Defective / Wrong Item", "14 days", "Any condition"],
              ["Digital Products", "Non-returnable", "—"],
            ].map(([cat, window, cond], i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-5 py-3" style={{ color: "var(--color-heading)" }}>{cat}</td>
                <td className="px-5 py-3 font-semibold" style={{ color: GOLD }}>{window}</td>
                <td className="px-5 py-3" style={{ color: MUTED }}>{cond}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="font-black text-base mb-4" style={{ color: "var(--color-heading)" }}>How to Request a Return</h3>
      <div className="space-y-3">
        {[
          "Go to 'My Orders' from your profile menu",
          "Select the order containing the item you want to return",
          "Click 'Request Return' and select the reason",
          "Our team will confirm your return within 24 hours",
          "Pack the item securely; our courier will pick it up",
          "Once received and inspected, your refund will be processed",
        ].map((step, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="w-6 h-6 rounded-full text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: GOLD }}>{i + 1}</span>
            <p className="text-sm" style={{ color: "var(--color-heading)" }}>{step}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl p-4" style={{ backgroundColor: "#FEF9EE", border: `1px solid ${BORDER}` }}>
        <p className="text-sm font-semibold" style={{ color: GOLD }}>⚠️ Note</p>
        <p className="text-sm mt-1" style={{ color: MUTED }}>
          Items must be in their original condition. Returns are not accepted for perishable goods,
          intimate apparel, or items marked "non-returnable" on the product page.
        </p>
      </div>
    </div>
  );
}

// ── How to Sell ───────────────────────────────────────────────────────────────
const SELLER_STEPS = [
  {
    step: "1", icon: "👤", title: "Create a PeaNut Account",
    desc: "If you don't have an account yet, click 'Sign In' at the top-right and choose 'Register'. Fill in your name, email, and a strong password. Verify your email by clicking the link we send you — your account won't be active until you do.",
  },
  {
    step: "2", icon: "🏪", title: "Apply to Become a Seller",
    desc: "Once logged in, click your profile avatar (top-right) and select 'Become a Seller' from the dropdown menu. This opens the Seller Onboarding page.",
  },
  {
    step: "3", icon: "📝", title: "Fill in Your Store Details",
    desc: "You'll be asked for: Store Name (your brand/business name, e.g. \"TechZone Nepal\"), Store Slug (a URL-friendly ID, auto-generated from your store name), and a short Description of what you sell. You can also upload a Store Logo and Banner image to make your storefront look professional.",
  },
  {
    step: "4", icon: "⏳", title: "Wait for Approval",
    desc: "After submitting, our team reviews your application within 24–48 hours. You'll receive an email once your seller account is approved and activated. Until then your account is in 'pending' state.",
  },
  {
    step: "5", icon: "📦", title: "Add Your First Product",
    desc: "Once approved, go to your Profile and click 'Seller Dashboard'. Click the '+ Add Product' button. Fill in the product details — see the full product form guide below.",
  },
  {
    step: "6", icon: "🚀", title: "Start Selling",
    desc: "Your product goes live immediately after you save it. Customers can find it through search, category browsing, and the homepage. You'll be notified by email and in your dashboard whenever someone places an order.",
  },
];

const PRODUCT_FIELDS = [
  { field: "Product Name", required: true,  desc: "Clear, descriptive name. E.g. 'Sony WH-1000XM6 Wireless Headphones'. Avoid keyword stuffing." },
  { field: "Category",     required: true,  desc: "Choose the most specific category that fits your product (Electronics, Fashion, Home & Living, etc.)." },
  { field: "Base Price",   required: true,  desc: "Your selling price in NPR (Nepali Rupees). E.g. 38500 for रू 38,500." },
  { field: "Compare Price",required: false, desc: "Original / crossed-out price to show a discount. Leave blank if not on sale." },
  { field: "Stock",        required: true,  desc: "How many units you have available. Set to 0 to mark as out of stock without deleting the listing." },
  { field: "Short Desc.",  required: false, desc: "One or two sentences shown on the product card. Keep it punchy — highlight the key benefit." },
  { field: "Description",  required: true,  desc: "Full product details: features, specs, dimensions, care instructions. Use clear paragraphs." },
  { field: "SKU",          required: false, desc: "Your internal stock-keeping code. Used for your own inventory tracking; not shown to buyers." },
  { field: "Images",       required: true,  desc: "Upload at least one clear product photo. Use a white or neutral background. More images = more trust." },
  { field: "Variants",     required: false, desc: "If your product comes in different sizes, colours, etc., add variants. Each variant can have its own price and stock." },
  { field: "Tags",         required: false, desc: "Keywords that help buyers find your product in search (e.g. 'wireless', 'Nepal', 'gift')." },
  { field: "Free Shipping",required: false, desc: "Toggle on if you cover the shipping cost. Products with free shipping rank higher and sell faster." },
  { field: "Flash Sale",   required: false, desc: "Enable to add your product to the flash sale banner with a countdown timer." },
  { field: "Eco Friendly", required: false, desc: "Badge shown on the product card if your item is sustainably made or packaged." },
];

const SELLER_TIPS = [
  "📸  Use bright, sharp photos — the first image is your first impression",
  "📝  Write descriptions that answer buyer questions before they ask",
  "🏷️  Price competitively — check what similar products cost on PeaNut",
  "⚡  Respond to order status updates quickly — fast dispatch earns better reviews",
  "⭐  Good reviews drive more sales — follow up on every order",
  "📦  Keep your stock count accurate so buyers are never disappointed",
  "🎯  Use all the category tags and keywords relevant to your product",
  "🔄  Update prices and stock regularly, especially during flash sales",
];

const SELLER_FAQS = [
  {
    q: "Is there a fee to sell on PeaNut?",
    a: "Creating a seller account is free. PeaNut currently charges a small platform commission on completed sales. The exact percentage is shown in your Seller Dashboard under Settings.",
  },
  {
    q: "How do I receive my payment?",
    a: "Payments from buyers are held securely and transferred to your registered bank account or Khalti/eSewa wallet after the order is marked Delivered and the return window has passed (7 days). Payouts are processed every Monday.",
  },
  {
    q: "Can I sell from anywhere in Nepal?",
    a: "Yes. You can sell from any province. Just make sure you can arrange delivery — either through your own courier or by using a third-party courier service. Buyers see your estimated delivery time.",
  },
  {
    q: "What happens when I get an order?",
    a: "You'll receive an email notification and see the order in your Seller Dashboard under 'Orders'. Update the status as you pack and ship — use the location field to let the buyer track where their order is.",
  },
  {
    q: "Can I have more than one store?",
    a: "Each PeaNut account can have one seller profile. If you need to manage multiple brands, create separate accounts with separate email addresses.",
  },
  {
    q: "What if a buyer wants to return a product?",
    a: "Returns are handled through PeaNut's return policy. If the item is defective or wrong, you must accept the return. For change-of-mind returns, your store policy applies. Refunds are deducted from your next payout.",
  },
];

function HowToSell() {
  const { nav } = useUIStore();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-heading)" }}>Sell on PeaNut</h2>
      <p className="mb-8" style={{ color: MUTED }}>
        Reach thousands of buyers across Nepal. Setting up your store takes less than 10 minutes.
      </p>

      {/* CTA banner */}
      <div className="rounded-2xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ background: "linear-gradient(135deg, #1C1A16, #2D2418)" }}>
        <div>
          <p className="text-white font-black text-lg mb-1">Ready to start selling?</p>
          <p className="text-sm" style={{ color: "#B8A882" }}>Free to join · Sell nationwide · Get paid weekly</p>
        </div>
        <button
          onClick={() => nav("onboarding")}
          className="px-6 py-3 rounded-xl font-bold text-sm text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: GOLD }}
        >
          Open Seller Account →
        </button>
      </div>

      {/* Step-by-step guide */}
      <h3 className="font-black text-lg mb-4" style={{ color: "var(--color-heading)" }}>Step-by-Step: Becoming a Seller</h3>
      <div className="space-y-4 mb-10">
        {SELLER_STEPS.map(s => (
          <div key={s.step} className="flex gap-5 rounded-2xl p-5" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: GOLD + "20", border: `2px solid ${GOLD}` }}>
              {s.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: GOLD }}>STEP {s.step}</span>
                <span className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{s.title}</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: MUTED }}>{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Product form guide */}
      <h3 className="font-black text-lg mb-2" style={{ color: "var(--color-heading)" }}>Product Form — Field by Field</h3>
      <p className="text-sm mb-5" style={{ color: MUTED }}>
        When you click <strong>+ Add Product</strong> in your Seller Dashboard, you'll see these fields:
      </p>
      <div className="rounded-2xl overflow-hidden mb-10" style={{ border: `1px solid ${BORDER}` }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ backgroundColor: IVORY }}>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>Field</th>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>Required</th>
              <th className="text-left px-5 py-3 font-bold" style={{ color: "var(--color-heading)" }}>What to enter</th>
            </tr>
          </thead>
          <tbody>
            {PRODUCT_FIELDS.map((row, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${BORDER}` }}>
                <td className="px-5 py-3 font-semibold whitespace-nowrap" style={{ color: "var(--color-heading)" }}>{row.field}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${row.required ? "text-white" : ""}`}
                    style={{ backgroundColor: row.required ? GOLD : BORDER, color: row.required ? "white" : MUTED }}>
                    {row.required ? "Required" : "Optional"}
                  </span>
                </td>
                <td className="px-5 py-3 text-xs leading-relaxed" style={{ color: MUTED }}>{row.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tips */}
      <h3 className="font-black text-lg mb-4" style={{ color: "var(--color-heading)" }}>Tips for Selling More</h3>
      <div className="rounded-2xl p-6 mb-10" style={{ background: "linear-gradient(135deg, #1C1A16, #2D2418)" }}>
        <ul className="space-y-2">
          {SELLER_TIPS.map(tip => (
            <li key={tip} className="text-sm" style={{ color: "#B8A882" }}>{tip}</li>
          ))}
        </ul>
      </div>

      {/* Seller FAQs */}
      <h3 className="font-black text-lg mb-4" style={{ color: "var(--color-heading)" }}>Seller FAQs</h3>
      <div className="space-y-2">
        {SELLER_FAQS.map((faq, i) => (
          <div key={i} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${BORDER}` }}>
            <button
              className="flex items-center justify-between w-full px-5 py-4 text-left font-semibold text-sm transition-colors"
              style={{ backgroundColor: openFaq === i ? IVORY : "transparent", color: "var(--color-heading)" }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <span>{faq.q}</span>
              <span className="ml-4 text-lg shrink-0 transition-transform" style={{ transform: openFaq === i ? "rotate(45deg)" : "none", color: GOLD }}>+</span>
            </button>
            {openFaq === i && (
              <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: MUTED }}>{faq.a}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Contact Us ────────────────────────────────────────────────────────────────
function ContactUs() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div>
      <h2 className="text-2xl font-black mb-2" style={{ color: "var(--color-heading)" }}>Contact Us</h2>
      <p className="mb-8" style={{ color: MUTED }}>Have a question or need help? Our support team is here for you.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "📧", label: "Email", value: "support@peanut.com.np", sub: "We reply within 24 hours" },
          { icon: "📞", label: "Phone", value: "+977-01-5555-000", sub: "Mon–Fri, 9am – 6pm NPT" },
          { icon: "📍", label: "Address", value: "Kathmandu, Nepal", sub: "Thamel, Kathmandu 44600" },
        ].map(c => (
          <div key={c.label} className="rounded-2xl p-5" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
            <div className="text-3xl mb-3">{c.icon}</div>
            <p className="text-xs font-bold mb-1" style={{ color: MUTED }}>{c.label}</p>
            <p className="font-bold text-sm" style={{ color: "var(--color-heading)" }}>{c.value}</p>
            <p className="text-xs mt-0.5" style={{ color: MUTED }}>{c.sub}</p>
          </div>
        ))}
      </div>

      <h3 className="font-black text-base mb-4" style={{ color: "var(--color-heading)" }}>Send Us a Message</h3>
      {sent ? (
        <div className="rounded-2xl p-8 text-center" style={{ border: `1px solid ${BORDER}`, backgroundColor: IVORY }}>
          <div className="text-5xl mb-3">✅</div>
          <p className="font-black text-lg mb-1" style={{ color: "var(--color-heading)" }}>Message Sent!</p>
          <p className="text-sm" style={{ color: MUTED }}>Thank you for reaching out. We'll get back to you within 24 hours.</p>
          <button
            onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
            className="mt-4 text-sm font-semibold underline"
            style={{ color: GOLD }}
          >
            Send another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Your Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} placeholder="John Doe" required />
            <Field label="Email Address" type="email" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="you@example.com" required />
          </div>
          <Field label="Subject" value={form.subject} onChange={v => setForm(f => ({ ...f, subject: v }))} placeholder="How can we help?" required />
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-heading)" }}>Message *</label>
            <textarea
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              required
              rows={5}
              placeholder="Describe your issue or question..."
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none transition-colors"
              style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "var(--color-bg)", color: "var(--color-heading)" }}
              onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
              onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
            />
          </div>
          <button
            type="submit"
            className="px-8 py-3 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: GOLD }}
          >
            Send Message
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, type = "text", required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--color-heading)" }}>{label}{required && " *"}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
        style={{ border: `1.5px solid ${BORDER}`, backgroundColor: "var(--color-bg)", color: "var(--color-heading)" }}
        onFocus={e => { e.currentTarget.style.borderColor = GOLD; }}
        onBlur={e => { e.currentTarget.style.borderColor = BORDER; }}
      />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CustomerCarePage() {
  const { pageData, nav } = useUIStore();
  const [activeSection, setActiveSection] = useState(pageData?.section ?? "help-center");

  useEffect(() => {
    if (pageData?.section) setActiveSection(pageData.section);
  }, [pageData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left nav */}
        <aside className="lg:w-56 shrink-0">
          <div className="rounded-2xl overflow-hidden sticky top-24" style={{ border: `1px solid ${BORDER}` }}>
            <div className="px-4 py-3" style={{ backgroundColor: "#1C1A16" }}>
              <p className="text-white font-black text-sm">Customer Care</p>
              <p className="text-[11px]" style={{ color: "#B8A882" }}>How can we help you?</p>
            </div>
            <div className="py-2">
              {SECTIONS.map(s => (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm transition-all duration-150"
                  style={{
                    backgroundColor: activeSection === s.key ? IVORY : "transparent",
                    color: activeSection === s.key ? GOLD : "var(--color-heading)",
                    fontWeight: activeSection === s.key ? 700 : 500,
                    borderLeft: activeSection === s.key ? `3px solid ${GOLD}` : "3px solid transparent",
                  }}
                >
                  <span>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeSection === "help-center"     && <HelpCenter />}
          {activeSection === "how-to-buy"      && <HowToBuy />}
          {activeSection === "how-to-sell"     && <HowToSell />}
          {activeSection === "returns-refunds" && <ReturnsRefunds />}
          {activeSection === "contact-us"      && <ContactUs />}
        </div>
      </div>
    </div>
  );
}
