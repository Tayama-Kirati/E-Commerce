"use client";
import { useState, useEffect } from "react";
import { useUIStore, apiGet, MOCK_CATEGORIES } from "@/app/lib/store";

const GOLD    = "#C68313";
const BORDER  = "#E8D5A8";
const CHARCOAL = "var(--color-heading)";
const MUTED   = "var(--color-muted)";
const IVORY   = "var(--color-surface-warm)";

const CAT_ICONS: Record<string, string> = {
  electronics: "📱", smartphones: "📱", laptops: "💻", accessories: "🎧",
  cosmetics: "💄", skincare: "🧴", fragrance: "🌸", makeup: "💋",
  clothes: "👗", "mens-fashion": "👔", "womens-fashion": "👚", footwear: "👟",
};

export function CategorySidebar() {
  const { nav, page, pageData } = useUIStore();
  const [categories, setCategories] = useState<any[]>([]);
  const activeSlug = pageData?.category as string | undefined;
  const flashActive = !!pageData?.flashSale;

  useEffect(() => {
    apiGet("/api/categories", null).then((d: any) => {
      if (d?.categories) setCategories(d.categories);
    });
  }, []);

  if (page !== "products") return null;

  const cats = categories.length > 0 ? categories : MOCK_CATEGORIES;

  return (
    <aside
      className="hidden lg:flex flex-col w-52 shrink-0 sticky top-16 self-start overflow-y-auto"
      style={{
        height: "calc(100vh - 4rem)",
        borderRight: `1px solid ${BORDER}`,
        backgroundColor: "var(--color-bg)",
      }}
    >
      <div className="p-3 pt-5 pb-6">
        <p
          className="text-[10px] font-black tracking-widest mb-3 px-2"
          style={{ color: MUTED }}
        >
          CATEGORIES
        </p>

        {/* All Products */}
        <NavBtn
          icon="🛍️"
          label="All Products"
          active={page === "products" && !activeSlug && !flashActive}
          onClick={() => nav("products")}
        />

        {/* Flash Sale */}
        <NavBtn
          icon="⚡"
          label="Flash Sale"
          active={flashActive}
          onClick={() => nav("products", { flashSale: true })}
          forceGold
        />

        <div className="mx-2 my-2" style={{ borderTop: `1px solid ${BORDER}` }} />

        {/* Categories from API */}
        {cats.map((c: any) => {
          const icon = CAT_ICONS[c.slug] ?? c.icon ?? "📦";
          const isActive = activeSlug === c.slug;
          return (
            <div key={c.id}>
              <NavBtn
                icon={icon}
                label={c.name}
                count={c._count?.products}
                active={isActive}
                onClick={() => nav("products", { category: c.slug })}
              />
              {/* Subcategories */}
              {isActive && Array.isArray(c.children) && c.children.length > 0 && (
                <div className="ml-5 mt-0.5 space-y-0.5">
                  {c.children.map((sub: any) => (
                    <NavBtn
                      key={sub.id}
                      icon={CAT_ICONS[sub.slug] ?? "›"}
                      label={sub.name}
                      count={sub._count?.products}
                      active={activeSlug === sub.slug}
                      onClick={() => nav("products", { category: sub.slug })}
                      small
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

type NavBtnProps = {
  icon: string;
  label: string;
  count?: number;
  active?: boolean;
  onClick: () => void;
  forceGold?: boolean;
  small?: boolean;
};

function NavBtn({ icon, label, count, active, onClick, forceGold, small }: NavBtnProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="flex items-center gap-2.5 w-full rounded-xl text-left transition-all duration-150"
      style={{
        padding: small ? "6px 10px" : "8px 10px",
        backgroundColor: active || hovered ? IVORY : "transparent",
        color: active || forceGold ? GOLD : CHARCOAL,
        fontWeight: active ? 700 : 500,
      }}
    >
      <span className={small ? "text-sm" : "text-base"}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className="truncate"
          style={{ fontSize: small ? "12px" : "13px", lineHeight: "1.4" }}
        >
          {label}
        </p>
        {count !== undefined && count > 0 && (
          <p className="text-[10px]" style={{ color: "var(--color-muted)" }}>
            {count} items
          </p>
        )}
      </div>
    </button>
  );
}
