"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowRight, Leaf, Package, Search } from "lucide-react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

export default function BundlesPage() {
  const [mounted, setMounted] = useState(false);
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const [activeCategory, setActiveCategory] = useState("All Sets");
  const [search, setSearch] = useState("");

  const getValue = (key: string, defaultValue: string) => {
    if (Object.keys(pageContent).length === 0) return defaultValue;
    const val = pageContent[key];
    return val !== undefined && val !== null ? val : defaultValue;
  };

  const heroBadge = getValue("heroBadge", "Curated Sets");
  const heroHeadline = getValue("heroHeadline", "Ritual Bundles");
  const heroSubtext = getValue("heroSubtext", "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.");

  useEffect(() => {
    setMounted(true);
    const titleTimeout = setTimeout(() => {
      document.title = "Ritual Bundles | Naturalist";
    }, 120);
    async function loadBundles() {
      try {
        const [bundlesRes, contentRes] = await Promise.all([
          fetch("/api/bundles", { cache: "no-store" }),
          fetch("/api/content?key=bundles", { cache: "no-store" }),
        ]);
        if (bundlesRes.ok) {
          const data = await bundlesRes.json();
          setBundles(data.filter((b: any) => b.isActive));
        }
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData?.metadata) setPageContent(contentData.metadata);
        }
      } catch (err) {
        console.error("Failed to load bundles:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBundles();
    return () => clearTimeout(titleTimeout);
  }, []);

  if (!mounted) return null;

  const filtered = bundles.filter((b) => {
    const matchesCategory =
      activeCategory === "All Sets" || (activeCategory === "Featured" && b.isFeatured);
    const matchesSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.description?.toLowerCase().includes(search.toLowerCase()) ||
      b.products?.some((p: any) => p?.name?.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full bg-[#fcfcfb] dark:bg-[#0a0d0b]">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "320px" }}>
        {pageContent.heroImage ? (
          <ImageWithSkeleton
            src={pageContent.heroImage}
            alt=""
            className="w-full h-full object-cover opacity-25 pointer-events-none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="bundlesPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                <circle cx="60" cy="60" r="30" fill="none" stroke="#b07e3a" strokeWidth="0.5" opacity="0.12" />
                <circle cx="60" cy="60" r="20" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.15" />
                <circle cx="60" cy="60" r="3" fill="#b07e3a" opacity="0.2" />
                <path d="M20 60 Q40 20 60 20 Q45 42 20 60Z" fill="#2d4c38" opacity="0.18" />
                <path d="M100 60 Q80 100 60 100 Q75 78 100 60Z" fill="#b07e3a" opacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#bundlesPattern)" />
          </svg>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(176,126,58,0.15) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 35%, transparent 65%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-24">
          {heroBadge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">{heroBadge}</span>
          )}
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}>
            {heroHeadline}
          </h1>
          {heroSubtext && (
            <p className="text-sm text-white/40 max-w-sm leading-relaxed mt-1">
              {heroSubtext}
            </p>
          )}
        </div>
      </section>

      {/* Filters (Consistent with /shop filter section) */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] border-b border-border/40 px-6 sm:px-8 py-6 sticky top-20 z-20 transition-colors duration-300">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Tabs/Pills */}
          <div className="flex flex-wrap gap-2">
            {["All Sets", "Featured"].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 border-0 cursor-pointer ${
                  activeCategory === cat
                    ? "bg-[#2d4c38] text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-[#2d4c38] hover:bg-[#2d4c38]/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ritual sets..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all text-foreground"
            />
          </div>

        </div>
      </section>

      {/* Bundles Grid */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-16 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 border border-border/20 rounded-3xl animate-pulse bg-muted/10">
                  <div className="aspect-[4/3] w-full rounded-2xl bg-muted" />
                  <div className="h-5 w-2/3 bg-muted rounded-full" />
                  <div className="h-3 w-full bg-muted rounded-full" />
                  <div className="h-3 w-4/5 bg-muted rounded-full" />
                  <div className="flex items-center justify-between mt-4">
                    <div className="h-6 w-1/3 bg-muted rounded-full" />
                    <div className="h-10 w-32 bg-muted rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-[32px] bg-muted/20 max-w-md mx-auto animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-4">
                <Leaf className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">No Sets Found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
                No ritual bundles match your search or filter criteria. Try clearing search filters or browse all sets.
              </p>
              <button
                onClick={() => { setActiveCategory("All Sets"); setSearch(""); }}
                className="mt-6 flex h-10 items-center justify-center rounded-full bg-[#2d4c38] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#203628] transition-all cursor-pointer"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-8 uppercase tracking-wider font-bold">
                {filtered.length} {filtered.length === 1 ? "set" : "sets"} found
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fade-in-up">
                {filtered.map((bundle) => (
                  <a
                    key={bundle._id}
                    href={`/bundles/${bundle.slug}`}
                    className="group flex flex-col rounded-3xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      {bundle.images?.[0] ? (
                        <ImageWithSkeleton
                          src={bundle.images[0]}
                          alt={bundle.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Leaf className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {bundle.compareAtPrice && (
                        <span className="absolute top-4 left-4 bg-[#b07e3a] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          Save ${(bundle.compareAtPrice - bundle.price).toFixed(0)}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-3 p-6 flex-1">
                      <h2 className="font-serif text-lg font-bold text-foreground leading-snug group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors">
                        {bundle.name}
                      </h2>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {bundle.description}
                      </p>

                      {/* Inclusions */}
                      {bundle.products?.length > 0 && (
                        <ul className="flex flex-col gap-1.5 mt-1">
                          {bundle.products.filter(Boolean).slice(0, 3).map((item: any, i: number) => (
                            <li key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="h-1 w-1 rounded-full bg-[#b07e3a] flex-shrink-0" />
                              {item?.name || "Product"}
                            </li>
                          ))}
                          {bundle.products.filter(Boolean).length > 3 && (
                            <li className="text-[11px] text-[#b07e3a] font-semibold">+{bundle.products.filter(Boolean).length - 3} more</li>
                          )}
                        </ul>
                      )}

                      {/* Price + CTA */}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/30 dark:border-[#232c26]/60">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-black text-[#2d4c38] dark:text-emerald-400 font-serif">${bundle.price?.toFixed(2)}</span>
                          {bundle.compareAtPrice && (
                            <span className="text-xs text-muted-foreground line-through">${bundle.compareAtPrice.toFixed(2)}</span>
                          )}
                        </div>
                        <span className="flex h-9 items-center gap-1.5 rounded-full bg-[#2d4c38] px-4 text-[11px] font-bold uppercase tracking-wider text-white group-hover:bg-[#3a6349] transition-colors">
                          View Set <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
