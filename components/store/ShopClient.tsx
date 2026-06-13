"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Leaf } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";

interface ShopClientProps {
  initialProducts: any[];
  pageContent: Record<string, string>;
}

export default function ShopClient({ initialProducts, pageContent }: ShopClientProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const getValue = useCallback(
    (key: string, defaultValue: string) => {
      const val = pageContent[key];
      return val !== undefined && val !== null ? val : defaultValue;
    },
    [pageContent]
  );

  const heroBadge = getValue("heroBadge", "Our Collection");
  const heroHeadline = getValue("heroHeadline", "The Shop");
  const heroSubtext = getValue("heroSubtext", "Every formula, every ritual — crafted from wild-harvested botanicals.");
  const emptyStateTitle = getValue("emptyStateTitle", "Garden Under Cultivation");
  const emptyStateBody = getValue("emptyStateBody", "No products match your current filter. Our active botanical formulas are currently being freshly distilled and prepared.");

  // Sync search/category from URL query params on first mount (client only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setSearch(q);
    const cat = params.get("category");
    if (cat) setActiveCategory(cat);
  }, []);

  const categories = [
    "All",
    ...Array.from(new Set(initialProducts.map((p) => p.category).filter(Boolean))) as string[],
  ];

  const filtered = initialProducts.filter((p) => {
    const matchesCategory = activeCategory === "All" || p.category === activeCategory;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "320px" }}>
        {pageContent.heroImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={pageContent.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="shopPattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M30 80 Q55 30 80 30 Q60 58 30 80Z" fill="#b07e3a" opacity="0.15" />
                <path d="M30 80 Q55 130 80 130 Q60 102 30 80Z" fill="#b07e3a" opacity="0.1" />
                <path d="M110 30 Q130 55 140 80 Q120 62 110 30Z" fill="#2d4c38" opacity="0.2" />
                <path d="M110 130 Q130 105 140 80 Q120 98 110 130Z" fill="#2d4c38" opacity="0.14" />
                <circle cx="80" cy="80" r="2.5" fill="#b07e3a" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#shopPattern)" />
          </svg>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 35%, transparent 65%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-24">
          {heroBadge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">{heroBadge}</span>
          )}
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}>
            {heroHeadline}
          </h1>
          {heroSubtext && (
            <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">
              {heroSubtext}
            </p>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] border-b border-border/40 px-6 sm:px-8 py-6 sticky top-20 z-20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-[#2d4c38] text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-[#2d4c38] hover:bg-[#2d4c38]/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search rituals..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all"
            />
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-16 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-[32px] bg-muted/20 max-w-md mx-auto animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-4">
                <Leaf className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">{emptyStateTitle}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
                {emptyStateBody}
              </p>
              <button
                onClick={() => { setActiveCategory("All"); setSearch(""); }}
                className="mt-6 flex h-10 items-center justify-center rounded-full bg-[#2d4c38] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#203628] transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-8 uppercase tracking-wider font-bold">
                {filtered.length} {filtered.length === 1 ? "ritual" : "rituals"} found
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {filtered.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
