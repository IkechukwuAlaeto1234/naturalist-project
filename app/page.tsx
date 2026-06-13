"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, Leaf, Eye, ShieldCheck, ArrowRight, Loader2, CalendarDays, Clock3, MessageCircle, BookOpen } from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";
import FormattedDate from "@/components/blog/FormattedDate";

// ─── Word Reveal Component ─────────────────────────────────────────────────────
// Splits text by lines then words; each word slides up with a staggered delay.
function WordReveal({ text, baseDelay = 0 }: { text: string; baseDelay?: number }) {
  const lines = text.split(/\\n|\n/);
  const lineWords = lines.map((line) => line.split(" "));
  let globalWordIdx = 0;

  return (
    <>
      {lineWords.map((words, lineIdx) => (
        <span key={lineIdx} className="block">
          {words.map((word, wIdx) => {
            const delay = baseDelay + globalWordIdx++ * 75;
            return (
              <React.Fragment key={`${lineIdx}-${wIdx}`}>
                <span className="word-reveal-container">
                  <span
                    className="word-reveal-text"
                    style={{ animationDelay: `${delay}ms` }}
                  >
                    {word}
                  </span>
                </span>
                {wIdx < words.length - 1 && (
                  <span className="word-reveal-container">
                    <span className="word-reveal-text" style={{ animationDelay: `${delay}ms` }}>
                      &nbsp;
                    </span>
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </span>
      ))}
    </>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [featuredBundle, setFeaturedBundle] = useState<any>(null);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // ── Mount + Data Fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    setMounted(true);

    async function loadStorefrontData() {
      try {
        setLoading(true);
        const [productsRes, bundlesRes, blogsRes, contentRes] = await Promise.all([
          fetch("/api/products", { cache: "no-store" }),
          fetch("/api/bundles", { cache: "no-store" }),
          fetch("/api/blogs", { cache: "no-store" }),
          fetch("/api/content?key=home", { cache: "no-store" }),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          const featured = productsData.filter((p: any) => p.isActive && p.isFeatured).slice(0, 4);
          setProducts(featured);
        }

        if (bundlesRes.ok) {
          const bundlesData = await bundlesRes.json();
          const featuredB = bundlesData.find((b: any) => b.isActive && b.isFeatured);
          setFeaturedBundle(featuredB || null);
        }

        if (blogsRes.ok) {
          const blogData = await blogsRes.json();
          setBlogs(
            blogData
              .filter((post: any) => post.featured)
              .concat(blogData.filter((post: any) => !post.featured))
              .slice(0, 3)
          );
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData?.metadata) setPageContent(contentData.metadata);
        }
      } catch (err) {
        console.error("Failed to load storefront data dynamically:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStorefrontData();
  }, []);

  // ── Scroll Reveal Observer — runs after all dynamic content is in the DOM ────
  useEffect(() => {
    if (!mounted || loading) return;

    const timer = setTimeout(() => {
      observerRef.current?.disconnect();
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("reveal-active");
              observerRef.current?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.07, rootMargin: "0px 0px -48px 0px" }
      );
      document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    }, 80);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
    };
  }, [mounted, loading]);

  // SSR guard — BrandLoader covers screen during hydration
  if (!mounted) return null;

  // ── CMS Content Helpers ────────────────────────────────────────────────────────
  const getValue = (key: string, defaultValue: string) => {
    if (Object.keys(pageContent).length === 0) return defaultValue;
    const val = pageContent[key];
    return val !== undefined && val !== null && val !== "" ? val : defaultValue;
  };

  const heroBadge        = getValue("heroBadge",        "The Skin Ritual Revolution");
  const heroHeadline     = getValue("heroHeadline",     "Pure Botanicals.\nModern Efficacy.");
  const heroSubtext      = getValue("heroSubtext",      "Formulated with high-efficacy, wild-harvested white sage, bakuchiol, and organic seaweed to unleash your skin's natural radiance.");
  const heroPrimaryCta   = getValue("heroPrimaryCta",   "Shop All Rituals");
  const heroSecondaryCta = getValue("heroSecondaryCta", "Our Botanical Ethos");
  const heroImage        = getValue("heroImage",        "");

  const sectionBadge    = getValue("sectionBadge",    "Formulation Ethos");
  const sectionHeadline = getValue("sectionHeadline", "The Naturalist Standard");
  const sectionSubtext  = getValue("sectionSubtext",  "Experience organic beauty crafted with absolute precision. High efficacy meets planet-first preservation.");

  const philosophyBadge       = getValue("philosophyBadge",       "Our Commitment");
  const philosophyHeadline    = getValue("philosophyHeadline",    "Nourish Your Body.\nRespect Our Planet.");
  const philosophyQuote       = getValue("philosophyQuote",       "We believe that beauty is formed through pure, natural balance. That's why we source our white sage, aloe, and seaweed from local wild farms, utilizing zero-waste packaging to ensure your beauty ritual is perfectly in harmony with nature.");
  const philosophyAttribution = getValue("philosophyAttribution", "The Naturalist Ethos");
  const philosophyImage       = getValue("philosophyImage",       "");

  const standards = [
    { icon: Leaf,       title: getValue("feature1Title", "Wild-Harvested"),          desc: getValue("feature1Body", "Distilled entirely from organic, raw botanicals sourced responsibly from their native habitats.") },
    { icon: Sparkles,   title: getValue("feature2Title", "Clinical Efficacy"),       desc: getValue("feature2Body", "Scientific concentrations of active botanical acids designed to nourish and regenerate skin cells.") },
    { icon: Eye,        title: getValue("feature3Title", "Total Transparency"),      desc: getValue("feature3Body", "Every single batch undergoes rigorous dermatological checks. 100% vegan, clean, and cruelty-free.") },
    { icon: ShieldCheck,title: getValue("feature4Title", "Eco-Conscious Packaging"), desc: getValue("feature4Body", "Presented exclusively in recyclable glass bottles and organic wood caps. Never any single-use plastics.") },
  ].filter((s) => s.title || s.desc);

  // Per-card stagger delays for grid reveals
  const CARD_DELAYS = ["", "reveal-delay-100", "reveal-delay-200", "reveal-delay-300"];
  const BLOG_DELAYS = ["", "reveal-delay-150", "reveal-delay-300"];

  return (
    <div className="flex flex-col w-full min-h-screen">

      {/* ── 1. Hero Spotlight ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e6dfd3] via-[#f5efe6] to-[#fcfcfb] dark:from-[#151c18] dark:via-[#111613] dark:to-[#0f1411] py-24 md:py-36 px-6 sm:px-8 border-b border-border/20 transition-all duration-300">

        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#2d4c38]/5 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-[300px] h-[300px] rounded-full bg-[#b07e3a]/5 dark:bg-amber-500/5 blur-[90px] pointer-events-none" />

        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 items-center gap-16 relative z-10">

          {/* Content Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start animate-fade-in-up">
            {heroBadge && (
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#b07e3a] bg-[#b07e3a]/10 dark:bg-amber-500/10 px-3 py-1 rounded-full">
                {heroBadge}
              </span>
            )}

            {/* ── Hero Word Reveal Headline ── */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-[#2d4c38] dark:text-emerald-400 leading-[1.08] tracking-tight">
              <WordReveal text={heroHeadline} baseDelay={120} />
            </h1>

            {heroSubtext && (
              <p className="max-w-xl text-base sm:text-lg text-[#5e6f64] dark:text-emerald-200/60 leading-relaxed" style={{ animationDelay: "400ms" }}>
                {heroSubtext}
              </p>
            )}

            {/* CTAs with shimmer + icon slide */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6 w-full sm:w-auto">
              {heroPrimaryCta && (
                <a
                  href="/p/shop"
                  className="btn-shimmer btn-icon-slide flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#203628] px-8 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-colors duration-300 active:scale-95"
                >
                  {heroPrimaryCta}
                  <ArrowRight className="btn-arrow h-4 w-4" />
                </a>
              )}
              {heroSecondaryCta && (
                <a
                  href="/p/story"
                  className="btn-icon-slide flex h-12 items-center justify-center rounded-full border border-[#2d4c38]/40 hover:border-[#2d4c38] dark:border-emerald-500/40 px-8 text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-emerald-400 hover:bg-[#2d4c38]/5 transition-all duration-300 active:scale-95"
                >
                  {heroSecondaryCta}
                </a>
              )}
            </div>
          </div>

          {/* Hero Image */}
          {heroImage && (
            <div
              className="lg:col-span-5 relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border-8 border-white/60 dark:border-white/5 card-premium-hover flex-shrink-0 animate-fade-in-up"
              style={{ animationDelay: "200ms" }}
            >
              <ImageWithSkeleton
                src={heroImage}
                alt="Premium organic skincare ritual bottles"
                className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                style={{ width: "100%", height: "100%" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2d4c38]/30 via-transparent to-transparent pointer-events-none" />
            </div>
          )}

        </div>
      </section>

      {/* ── 2. Brand Standards / Values ───────────────────────────────────────── */}
      {standards.length > 0 && (
        <section className="bg-gradient-to-b from-white to-white dark:from-[#0f1411] dark:to-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
          <div className="mx-auto max-w-7xl text-center flex flex-col gap-5">

            {sectionBadge && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a] reveal">
                {sectionBadge}
              </span>
            )}
            {sectionHeadline && (
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-snug reveal reveal-delay-100">
                {sectionHeadline}
              </h2>
            )}
            {sectionSubtext && (
              <p className="max-w-md text-sm text-muted-foreground mx-auto leading-relaxed reveal reveal-delay-200">
                {sectionSubtext}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mt-16 text-left relative z-10">
              {standards.map((standard, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col gap-4 p-6 rounded-3xl border border-border/30 dark:border-[#232c26]/20 bg-white/40 dark:bg-[#151c18]/40 backdrop-blur-md hover:border-[#2d4c38]/40 dark:hover:border-emerald-500/40 card-premium-hover group reveal ${CARD_DELAYS[idx] || ""}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 transition-colors duration-300 group-hover:bg-[#2d4c38] group-hover:text-white">
                    <standard.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground tracking-tight">{standard.title}</h3>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{standard.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Featured Products Grid ─────────────────────────────────────────── */}
      <section className="bg-[#fcfcfb] dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
        <div className="mx-auto max-w-7xl flex flex-col gap-12">

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/30 dark:border-[#232c26]/20 pb-6">
            <div className="reveal">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
                Best Sellers
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-2 tracking-tight">
                Featured Spotlights
              </h2>
            </div>
            <a
              href="/shop"
              className="btn-icon-slide flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-85 border-b border-accent/40 pb-0.5 transition-all w-fit reveal reveal-delay-100"
            >
              Explore Shop
              <ArrowRight className="btn-arrow h-3 w-3" />
            </a>
          </div>

          {/* Product Grid / Skeleton / Empty */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex flex-col gap-4 p-4 border border-border/20 rounded-3xl animate-pulse bg-muted/10">
                  <div className="aspect-square w-full rounded-2xl bg-muted" />
                  <div className="h-4 w-2/3 bg-muted rounded-full" />
                  <div className="h-3 w-full bg-muted rounded-full" />
                  <div className="flex items-center justify-between mt-2">
                    <div className="h-4 w-1/4 bg-muted rounded-full" />
                    <div className="h-8 w-8 bg-muted rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-[32px] bg-muted/20 max-w-xl mx-auto w-full animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary dark:bg-emerald-500/10 dark:text-emerald-400 mb-4">
                <Leaf className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">Garden Under Cultivation</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-2 leading-relaxed">
                Our active botanical formulas are currently being freshly distilled and prepared. Check back shortly for our curated collection of best sellers.
              </p>
              <a
                href="/shop"
                className="btn-shimmer mt-6 flex h-10 items-center justify-center rounded-full bg-[#2d4c38] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#203628] shadow-sm transition-colors active:scale-95"
              >
                Explore Catalog
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {products.map((product, idx) => (
                <div key={product._id} className={`reveal ${CARD_DELAYS[idx] || ""}`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* ── 4. Ritual Bundle Highlight ────────────────────────────────────────── */}
      {!loading && featuredBundle && (
        <section className="bg-white dark:bg-[#0f1411] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
          <div className="mx-auto max-w-7xl">
            <div className="relative rounded-[36px] overflow-hidden border border-border/30 dark:border-[#232c26]/20 bg-gradient-to-br from-white/90 via-white/40 to-transparent dark:from-[#151c18]/90 dark:via-[#151c18]/40 dark:to-transparent p-8 sm:p-12 md:p-16 grid grid-cols-1 md:grid-cols-12 items-center gap-12 shadow-2xl backdrop-blur-lg reveal">

              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#b07e3a]/5 dark:bg-amber-500/5 blur-[50px] pointer-events-none" />

              {/* Image */}
              <div className="md:col-span-5 relative w-full aspect-square rounded-2xl overflow-hidden bg-muted border border-border/20 shadow-lg group card-premium-hover">
                <Image
                  src={featuredBundle.images[0] || "/placeholder.jpg"}
                  alt={featuredBundle.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-w-7xl) 33vw, 50vw"
                />
              </div>

              {/* Text */}
              <div className="md:col-span-7 flex flex-col gap-6 text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a] bg-[#b07e3a]/10 px-3 py-1 rounded-full w-fit">
                  Limited Ritual Sets
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-primary dark:text-emerald-400 leading-tight">
                  {featuredBundle.name}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {featuredBundle.description}
                </p>

                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ritual Inclusions:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {featuredBundle.products.filter(Boolean).map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a]" />
                        {item?.name || "Product"}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-4 border-t border-border/30 dark:border-[#232c26]/20 pt-6 mt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-baseline gap-3 whitespace-nowrap">
                    <span className="text-2xl font-black text-[#2d4c38] dark:text-emerald-400 font-serif">
                      ${featuredBundle.price.toFixed(2)}
                    </span>
                    {featuredBundle.compareAtPrice && (
                      <span className="text-lg sm:text-base font-semibold text-muted-foreground line-through">
                        ${featuredBundle.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <a
                    href={`/bundles/${featuredBundle.slug}`}
                    className="btn-shimmer btn-icon-slide inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#203628] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors shadow-md sm:w-auto active:scale-95"
                  >
                    View Ritual Set
                    <ArrowRight className="btn-arrow h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── 5. Blog / Journal Section ─────────────────────────────────────────── */}
      {!loading && blogs.length > 0 && (
        <section className="bg-gradient-to-b from-[#f8f5ef] to-white dark:from-[#0f1411] dark:to-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
          <div className="mx-auto max-w-7xl flex flex-col gap-12">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/30 dark:border-[#232c26]/20 pb-6 reveal">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
                  Naturalist Journal
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-2 tracking-tight flex items-center gap-3">
                  From the Blog
                  <BookOpen className="h-6 w-6 text-[#b07e3a]" />
                </h2>
              </div>
              <a
                href="/blog"
                className="btn-icon-slide flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-85 border-b border-accent/40 pb-0.5 transition-all w-fit"
              >
                Explore Journal
                <ArrowRight className="btn-arrow h-3 w-3" />
              </a>
            </div>

            {/* Blog Cards */}
            {blogs.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {blogs.map((post, idx) => (
                  <a
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className={`group overflow-hidden rounded-[28px] border border-border/30 dark:border-[#232c26]/20 bg-white dark:bg-[#151c18] shadow-sm card-premium-hover flex flex-col reveal ${BLOG_DELAYS[idx] || ""}`}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={post.coverImage}
                        alt={post.coverImageAlt || post.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex flex-col flex-1 p-5 gap-3">
                      {/* Category badge */}
                      {post.category && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] bg-[#b07e3a]/8 px-2.5 py-1 rounded-full w-fit">
                          {post.category}
                        </span>
                      )}

                      <div className="flex-1">
                        <h3 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors duration-300 leading-snug line-clamp-2">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">
                            {post.excerpt}
                          </p>
                        )}
                      </div>

                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          {post.tags.slice(0, 3).map((tag: string) => (
                            <button
                              key={tag}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/blog?tag=${encodeURIComponent(tag)}`;
                              }}
                              className="inline-flex rounded-full bg-[#2d4c38]/5 hover:bg-[#2d4c38]/10 border border-[#2d4c38]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#2d4c38] dark:text-emerald-300 transition-colors cursor-pointer"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/30 dark:border-[#232c26]/20 text-xs font-bold text-foreground">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-5 w-5 rounded-full bg-[#2d4c38] text-white flex items-center justify-center font-serif text-[9px] font-black uppercase shadow-sm flex-shrink-0">
                            {post.authorName?.[0]?.toUpperCase() || "N"}
                          </span>
                          <span className="font-bold text-[#2d4c38] dark:text-emerald-400 uppercase tracking-wider text-[10px] truncate">
                            {post.authorName}
                          </span>
                        </div>
                        <div className="flex flex-col items-end text-right flex-shrink-0">
                          <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">
                            <FormattedDate date={post.publishedAt} type="date" />
                          </span>
                          <span className="text-[9px] opacity-70 font-semibold text-muted-foreground/80 tracking-wide mt-0.5">
                            <FormattedDate date={post.publishedAt} type="time" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

          </div>
        </section>
      )}

      {/* ── 6. Philosophy / Editorial Quote ──────────────────────────────────── */}
      {philosophyQuote && (
        <section className="bg-[#fcfcfb] dark:bg-[#0a0d0b] py-28 px-6 sm:px-8 transition-colors duration-300 relative overflow-hidden">

          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-[#e2dacd] to-transparent" />

          {philosophyImage ? (
            <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 items-center gap-12 relative z-10">
              <div className="flex flex-col gap-6 text-left reveal">
                {philosophyBadge && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
                    {philosophyBadge}
                  </span>
                )}
                {philosophyHeadline && (
                  <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-[1.15] tracking-tight">
                    <WordReveal text={philosophyHeadline} baseDelay={0} />
                  </h2>
                )}
                <p className="text-base text-muted-foreground leading-relaxed italic font-serif">
                  {philosophyQuote.startsWith('"') ? philosophyQuote : `"${philosophyQuote}"`}
                </p>
                <div className="flex items-center gap-3">
                  <span className="h-px w-8 bg-border" />
                  <span className="font-serif italic text-sm text-muted-foreground/80">{philosophyAttribution || "The Naturalist Ethos"}</span>
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden border border-border/30 shadow-2xl card-premium-hover reveal reveal-delay-200">
                <ImageWithSkeleton
                  src={philosophyImage}
                  alt="Philosophy section visual"
                  className="w-full object-cover max-h-[520px] transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl text-center flex flex-col gap-6 relative z-10 reveal">
              {philosophyBadge && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
                  {philosophyBadge}
                </span>
              )}
              {philosophyHeadline && (
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-[1.15] tracking-tight">
                  <WordReveal text={philosophyHeadline} baseDelay={0} />
                </h2>
              )}
              <p className="text-base text-muted-foreground leading-relaxed mt-2 italic font-serif max-w-2xl mx-auto">
                {philosophyQuote.startsWith('"') ? philosophyQuote : `"${philosophyQuote}"`}
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <span className="h-px w-8 bg-border" />
                <span className="font-serif italic text-sm text-muted-foreground/80">{philosophyAttribution || "The Naturalist Ethos"}</span>
                <span className="h-px w-8 bg-border" />
              </div>
            </div>
          )}

        </section>
      )}

    </div>
  );
}
