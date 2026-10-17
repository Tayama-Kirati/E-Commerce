"use client";
import { useState, useEffect, useRef } from "react";
import { useUIStore, apiGet } from "@/app/lib/store";
import { EmojiText } from "@/app/components/ui/EmojiIcon";

const GOLD   = "#C68313";
const IVORY  = "var(--color-surface-warm)";

export function CategorySidebar() {
  const { nav, page, pageData } = useUIStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    apiGet("/api/categories", null).then((d: any) => {
      if (d?.categories) setCategories(d.categories);
    });
  }, []);

  if (page !== "products" && page !== "home") return null;

  const cats = categories;

  const activeCat = cats.find((c: any) => (c.slug || c.id) === hoveredCat);
  const activeSub = activeCat?.children?.find((s: any) => (s.slug || s.id) === hoveredSub);

  const clearLeave = () => clearTimeout(leaveTimer.current);
  const scheduleLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setHoveredCat(null);
      setHoveredSub(null);
    }, 180);
  };

  return (
    <div
      className="hidden lg:block sticky top-16 self-start"
      style={{ width: "210px", flexShrink: 0, height: "calc(100vh - 4rem)", zIndex: hoveredCat ? 40 : "auto" }}
      onMouseLeave={scheduleLeave}
      onMouseEnter={clearLeave}
    >
      {/* Scrollable category list */}
      <div
        className="overflow-y-auto h-full"
        style={{ borderRight: "1px solid #e5e7eb", backgroundColor: "var(--color-bg)" }}
      >
        {/* All Products / Flash Sale */}
        <div className="pt-2 pb-1">
          <CatRow
            label="All Products"
            active={page === "products" && !pageData?.category && !pageData?.flashSale}
            onClick={() => { nav("products"); setHoveredCat(null); }}
          />
          <CatRow
            label="⚡ Flash Sale"
            active={!!pageData?.flashSale}
            onClick={() => { nav("products", { flashSale: true }); setHoveredCat(null); }}
            orange
          />
          <div style={{ borderTop: "1px solid #e5e7eb", margin: "4px 12px" }} />
        </div>

        {cats.map((c: any) => {
          const key = c.slug || c.id;
          return (
            <CatRow
              key={c.id}
              label={`${c.icon ? c.icon + " " : ""}${c.name}`}
              active={pageData?.category === c.slug}
              hasChildren={(c.children?.length ?? 0) > 0}
              hovered={hoveredCat === key}
              onMouseEnter={() => { setHoveredCat(key); setHoveredSub(null); }}
              onClick={() => { nav("products", { category: c.slug }); setHoveredCat(null); }}
            />
          );
        })}
      </div>

      {/* Flyout panel — absolute over main content */}
      {hoveredCat && (activeCat?.children?.length ?? 0) > 0 && (
        <div
          className="absolute top-0 flex shadow-2xl"
          style={{ left: "210px", minHeight: "100%", zIndex: 50 }}
          onMouseEnter={clearLeave}
        >
          {/* Middle column — subcategories */}
          <div
            style={{
              width: "210px",
              backgroundColor: "white",
              borderRight: "1px solid #e5e7eb",
              borderLeft: "1px solid #e5e7eb",
              boxShadow: "6px 0 20px rgba(0,0,0,0.08)",
            }}
          >
            {activeCat.children.map((sub: any) => {
              const subKey = sub.slug || sub.id;
              return (
                <CatRow
                  key={sub.id || sub.slug}
                  label={sub.name}
                  hasChildren={(sub.children?.length ?? 0) > 0}
                  hovered={hoveredSub === subKey}
                  onMouseEnter={() => setHoveredSub(subKey)}
                  onClick={() => { nav("products", { category: sub.slug }); setHoveredCat(null); }}
                />
              );
            })}
          </div>

          {/* Right column — sub-subcategories */}
          {hoveredSub && (activeSub?.children?.length ?? 0) > 0 && (
            <div
              style={{
                width: "210px",
                backgroundColor: "white",
                borderRight: "1px solid #e5e7eb",
                boxShadow: "6px 0 20px rgba(0,0,0,0.08)",
              }}
            >
              {activeSub.children.map((leaf: any) => (
                <CatRow
                  key={leaf.id || leaf.slug}
                  label={leaf.name}
                  onClick={() => { nav("products", { category: leaf.slug }); setHoveredCat(null); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type CatRowProps = {
  label: string;
  active?: boolean;
  orange?: boolean;
  hasChildren?: boolean;
  hovered?: boolean;
  onMouseEnter?: () => void;
  onClick: () => void;
};

function CatRow({ label, active, orange, hasChildren, hovered, onMouseEnter, onClick }: CatRowProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className="flex items-center justify-between w-full text-left transition-colors duration-100"
      style={{
        padding: "9px 16px",
        fontSize: "13px",
        color: active || orange || hovered ? GOLD : "var(--color-heading)",
        fontWeight: active ? 600 : 400,
        backgroundColor: hovered || active ? IVORY : "transparent",
      }}
    >
      <span style={{ flex: 1, lineHeight: "1.4" }}><EmojiText>{label}</EmojiText></span>
      {hasChildren && (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} style={{ flexShrink: 0, opacity: 0.7 }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}
