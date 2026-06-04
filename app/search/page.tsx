"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Package, FileText, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const [prodRes, blogRes] = await Promise.all([
        fetch("/api/products?limit=100", { cache: "no-store" }),
        fetch("/api/blogs?limit=100", { cache: "no-store" }),
      ]);
      const prodData = prodRes.ok ? await prodRes.json() : { products: [] };
      const blogData = blogRes.ok ? await blogRes.json() : { posts: [] };

      const t = term.toLowerCase();
      const matchedProducts = (prodData.products || []).filter((p: any) =>
        p.name?.toLowerCase().includes(t) ||
        p.description?.toLowerCase().includes(t) ||
        p.category?.toLowerCase().includes(t) ||
        p.tags?.some((tag: string) => tag.toLowerCase().includes(t))
      );
      const matchedBlogs = (blogData.posts || []).filter((b: any) =>
        b.title?.toLowerCase().includes(t) ||
        b.excerpt?.toLowerCase().includes(t) ||
        b.tags?.some((tag: string) => tag.toLowerCase().includes(t))
      );
      setProducts(matchedProducts);
      setBlogs(matchedBlogs);
    } catch {
      setProducts([]);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = q ? `Search: "${q}" | Naturalist` : "Search | Naturalist";
    if (q) {
      setQuery(q);
      search(q);
    }
  }, [q, search]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const totalResults = products.length + blogs.length;

  return (
    <div className="flex flex-col w-full">
      {/* Hero + Search Bar */}
      <section className="relative w-full bg-[#0d1510] overflow-hidden" style={{ minHeight: "340px" }}>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="searchPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="28" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.1" />
              <path d="M20 60 Q40 20 60 20 Q46 40 20 60Z" fill="#2d4c38" opacity="0.12" />
              <path d="M100 60 Q80 100 60 100 Q74 80 100 60Z" fill="#b07e3a" opacity="0.08" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#searchPattern)" />
        </svg>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 25%, transparent 75%, #0d1510 100%)" }} />

        <div className="relative z-10 flex flex-col items-center text-center gap-6 px-6 py-24 md:py-32">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Search</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3rem, 10vw, 7rem)" }}>
            {q ? <>Results</> : <>Explore</>}
          </h1>
          {q && (
            <p className="text-sm text-white/40">
              {loading ? "Searching…" : hasSearched ? `${totalResults} result${totalResults !== 1 ? "s" : ""} for "${q}"` : ""}
            </p>
          )}
          {/* Search input */}
          <form onSubmit={handleSubmit} className="w-full max-w-xl mt-2">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-[#4a5c50] pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products, articles, ingredients…"
                className="w-full pl-11 pr-24 py-4 bg-white/[0.06] border border-white/10 rounded-full text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#b07e3a]/50 focus:bg-white/[0.08] transition-all backdrop-blur-sm"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2 bg-[#2d4c38] hover:bg-[#3a6349] text-white text-xs font-bold uppercase tracking-wider rounded-full transition-all"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-16 px-6 sm:px-8 transition-colors min-h-[50vh]">
        <div className="mx-auto max-w-5xl">
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
              <p className="text-sm text-muted-foreground">Searching the garden…</p>
            </div>
          )}

          {!loading && hasSearched && totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
              {/* Botanical empty state SVG */}
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="60" cy="60" r="58" stroke="#2d4c38" strokeWidth="0.8" strokeOpacity="0.3" />
                <path d="M35 60 Q52 30 70 28 Q58 46 35 60Z" fill="#2d4c38" fillOpacity="0.25" />
                <path d="M35 60 Q52 90 70 92 Q58 74 35 60Z" fill="#2d4c38" fillOpacity="0.15" />
                <line x1="35" y1="60" x2="70" y2="60" stroke="#2d4c38" strokeWidth="0.8" strokeOpacity="0.4" />
                <path d="M80 45 Q95 60 88 80 Q82 65 80 45Z" fill="#b07e3a" fillOpacity="0.2" />
                <circle cx="60" cy="60" r="4" fill="#b07e3a" fillOpacity="0.4" />
              </svg>
              <div>
                <h2 className="font-serif text-2xl font-bold text-foreground mb-2">Nothing found.</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                  We couldn&apos;t find anything matching &ldquo;{q}&rdquo;. Try different keywords or browse our collections.
                </p>
              </div>
              <div className="flex gap-3 flex-wrap justify-center">
                <a href="/p/shop" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#2d4c38] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#3a6349] transition-all">
                  Browse Shop <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <a href="/p/blog" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-foreground text-xs font-bold uppercase tracking-wider hover:bg-muted transition-all">
                  Read Journal
                </a>
              </div>
            </div>
          )}

          {!loading && hasSearched && totalResults > 0 && (
            <div className="space-y-14">
              {/* Product Results */}
              {products.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <Package className="h-4 w-4 text-[#b07e3a]" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Products — {products.length} found</h2>
                    <span className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((p: any) => (
                      <a key={p._id} href={`/shop/${p.slug || p._id}`} className="group flex flex-col gap-3 p-4 bg-white dark:bg-[#0f1411] border border-border/40 dark:border-[#1a241e] rounded-2xl hover:border-[#b07e3a]/40 hover:shadow-lg transition-all duration-300">
                        {p.images?.[0] && (
                          <div className="rounded-xl overflow-hidden aspect-square bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] mb-1">{p.category}</p>
                          <h3 className="text-sm font-bold text-foreground leading-snug">{p.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">${p.price?.toFixed(2)}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Blog Results */}
              {blogs.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <FileText className="h-4 w-4 text-[#b07e3a]" />
                    <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Journal — {blogs.length} found</h2>
                    <span className="flex-1 h-px bg-border/50" />
                  </div>
                  <div className="flex flex-col gap-4">
                    {blogs.map((b: any) => (
                      <a key={b._id} href={`/blog/${b.slug}`} className="group flex gap-5 p-5 bg-white dark:bg-[#0f1411] border border-border/40 dark:border-[#1a241e] rounded-2xl hover:border-[#b07e3a]/40 transition-all duration-300">
                        {b.coverImage && (
                          <div className="rounded-xl overflow-hidden w-20 h-20 flex-shrink-0 bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={b.coverImage} alt={b.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {b.tags?.slice(0, 2).map((tag: string, i: number) => (
                              <span key={i} className="text-[9px] font-bold uppercase tracking-wider bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">{tag}</span>
                            ))}
                          </div>
                          <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors line-clamp-2">{b.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{b.excerpt}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <p className="text-muted-foreground text-sm">Type something above to search our products and journal.</p>
              <div className="flex gap-3 flex-wrap justify-center mt-2">
                {["bakuchiol", "serum", "ritual", "cleanse", "organic"].map(term => (
                  <button
                    key={term}
                    onClick={() => { setQuery(term); router.push(`/search?q=${encodeURIComponent(term)}`); }}
                    className="px-4 py-2 rounded-full border border-border text-xs font-semibold text-muted-foreground hover:border-[#b07e3a]/40 hover:text-foreground transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0d1510]">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
      </div>
    }>
      <SearchResults />
    </Suspense>
  );
}
