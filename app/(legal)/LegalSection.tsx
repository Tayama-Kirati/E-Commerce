export function LegalHeader({ title, updated }: { title: string; updated: string }) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-black mb-2">{title}</h1>
      <p className="text-sm" style={{ color: "var(--color-muted)" }}>Last updated {updated}</p>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 pt-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <div className="space-y-2" style={{ color: "var(--color-muted)" }}>{children}</div>
    </section>
  );
}
