import Link from "next/link";

const LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Returns & Refunds" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <header className="border-b" style={{ borderColor: "#E8D5A8" }}>
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/" className="text-2xl font-black" style={{ color: "var(--color-heading)" }}>
            Pea<span style={{ color: "#C68313" }}>Nut</span>
          </Link>
          <nav className="flex gap-4 text-sm flex-wrap">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:underline" style={{ color: "var(--color-muted)" }}>{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <article className="legal space-y-4 text-[15px] leading-relaxed" style={{ color: "var(--color-heading)" }}>{children}</article>
      </main>
    </div>
  );
}
