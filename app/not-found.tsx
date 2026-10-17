import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-16 text-center" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="max-w-md">
        <p className="text-7xl font-black mb-2" style={{ color: "#C68313" }}>404</p>
        <h1 className="text-2xl font-black mb-3" style={{ color: "var(--color-heading)" }}>We couldn&apos;t find that page</h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-muted)" }}>
          The link may be broken, or the product may no longer be available.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/" className="px-6 py-3 rounded-full text-white text-sm font-bold" style={{ backgroundColor: "#C68313" }}>
            Back to shopping
          </Link>
          <Link href="/?page=customer-care" className="px-6 py-3 rounded-full text-sm font-bold border" style={{ borderColor: "#E8D5A8", color: "var(--color-heading)" }}>
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
