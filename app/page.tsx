"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, Leaf, Eye, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import ProductCard from "../components/store/ProductCard";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [featuredBundle, setFeaturedBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 100% Dynamic Client-Side Hydration Guard
  useEffect(() => {
    setMounted(true);

    async function loadStorefrontData() {
      try {
        setLoading(true);
        const [productsRes, bundlesRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/bundles"),
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
      } catch (err) {
        console.error("Failed to load storefront data dynamically:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStorefrontData();
  }, []);

  // Server-Side Rendering Guard: Returns a clean empty shell during SSR.
  // The global BrandLoader in root layout covers the screen during hydration.
  if (!mounted) {
    return null;
  }

  const standards = [
    {
      icon: Leaf,
      title: "Wild-Harvested",
      desc: "Distilled entirely from organic, raw botanicals sourced responsibly from their native habitats.",
    },
    {
      icon: Sparkles,
      title: "Clinical Efficacy",
      desc: "Scientific concentrations of active botanical acids designed to nourish and regenerate skin cells.",
    },
    {
      icon: Eye,
      title: "Total Transparency",
      desc: "Every single batch undergoes rigorous dermatological checks. 100% vegan, clean, and cruelty-free.",
    },
    {
      icon: ShieldCheck,
      title: "Eco-Conscious Packaging",
      desc: "Presented exclusively in recyclable glass bottles and organic wood caps. Never any single-use plastics.",
    },
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      
      {/* 1. Hero Spotlight Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#e6dfd3] via-[#f5efe6] to-[#fcfcfb] dark:from-[#151c18] dark:via-[#111613] dark:to-[#0f1411] py-24 md:py-36 px-6 sm:px-8 border-b border-border/20 transition-all duration-300">
        
        {/* Decorative Ambient Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#2d4c38]/5 dark:bg-emerald-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-10 w-[300px] h-[300px] rounded-full bg-[#b07e3a]/5 dark:bg-amber-500/5 blur-[90px] pointer-events-none" />

        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 items-center gap-16 relative z-10">
          
          {/* Content Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start animate-fade-in-up">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#b07e3a] bg-[#b07e3a]/10 dark:bg-amber-500/10 px-3 py-1 rounded-full">
              The Skin Ritual Revolution
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7.5xl font-black text-[#2d4c38] dark:text-emerald-400 leading-[1.08] tracking-tight">
              Pure Botanicals.<br />
              Modern Efficacy.
            </h1>
            <p className="max-w-xl text-base sm:text-lg text-[#5e6f64] dark:text-emerald-200/60 leading-relaxed">
              Formulated with high-efficacy, wild-harvested white sage, bakuchiol, and organic seaweed to unleash your skin's natural radiance. 
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-6 w-full sm:w-auto">
              <Link
                href="/shop"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#203628] px-8 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-1px]"
              >
                Shop All Rituals
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/story"
                className="flex h-12 items-center justify-center rounded-full border border-[#2d4c38]/40 hover:border-[#2d4c38] dark:border-emerald-500/40 px-8 text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-emerald-400 hover:bg-[#2d4c38]/5 transition-all duration-300"
              >
                Our Botanical Ethos
              </Link>
            </div>
          </div>

          {/* Large Editorial Hero Image Column */}
          <div className="lg:col-span-5 relative w-full aspect-[4/5] rounded-[32px] overflow-hidden shadow-2xl border-8 border-white/60 dark:border-white/5 hover:scale-[1.01] hover:rotate-[0.5deg] hover:shadow-3xl transition-all duration-700 flex-shrink-0 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <Image
              src="/cdn/hero-banner.jpg"
              alt="Premium organic skincare ritual bottles"
              fill
              priority
              className="object-cover transition-transform duration-1000 hover:scale-105"
              sizes="(max-w-7xl) 33vw, 50vw"
            />
            {/* Ambient shadow gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#2d4c38]/30 via-transparent to-transparent pointer-events-none" />
          </div>

        </div>
      </section>

      {/* 2. Brand Standard / Values Section */}
      <section className="bg-gradient-to-b from-white to-white dark:from-[#0f1411] dark:to-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
        <div className="mx-auto max-w-7xl text-center flex flex-col gap-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
            Formulation Ethos
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-snug">
            The Naturalist Standard
          </h2>
          <p className="max-w-md text-sm text-muted-foreground mx-auto leading-relaxed">
            Experience organic beauty crafted with absolute precision. High efficacy meets planet-first preservation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 mt-16 text-left relative z-10">
            {standards.map((standard, idx) => (
              <div 
                key={idx} 
                className="flex flex-col gap-4 p-6 rounded-3xl border border-border/30 dark:border-[#232c26]/20 bg-white/40 dark:bg-[#151c18]/40 backdrop-blur-md hover:translate-y-[-6px] hover:shadow-xl hover:border-[#2d4c38]/40 dark:hover:border-emerald-500/40 transition-all duration-300 group"
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

      {/* 3. Featured Products Grid Section */}
      <section className="bg-[#fcfcfb] dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
        <div className="mx-auto max-w-7xl flex flex-col gap-12">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-border/30 dark:border-[#232c26]/20 pb-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
                Best Sellers
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-2 tracking-tight">
                Featured Spotlights
              </h2>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:opacity-85 border-b border-accent/40 pb-0.5 transition-all w-fit"
            >
              Explore Shop
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Product Grid / Skeleton Loaders */}
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
              <Link
                href="/shop"
                className="mt-6 flex h-10 items-center justify-center rounded-full bg-[#2d4c38] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#203628] shadow-sm transition-all"
              >
                Explore Catalog
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 animate-fade-in-up">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* 4. Special Ritual Bundle Highlight Section */}
      {!loading && featuredBundle && (
        <section className="bg-white dark:bg-[#0f1411] py-24 px-6 sm:px-8 border-b border-border/40 transition-colors duration-300">
          <div className="mx-auto max-w-7xl">
            
            {/* Multi-layered Glassmorphic Promotional showcase */}
            <div className="relative rounded-[36px] overflow-hidden border border-border/30 dark:border-[#232c26]/20 bg-gradient-to-br from-white/90 via-white/40 to-transparent dark:from-[#151c18]/90 dark:via-[#151c18]/40 dark:to-transparent p-8 sm:p-12 md:p-16 grid grid-cols-1 md:grid-cols-12 items-center gap-12 shadow-2xl backdrop-blur-lg">
              
              <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-[#b07e3a]/5 dark:bg-amber-500/5 blur-[50px] pointer-events-none" />

              {/* Image Column */}
              <div className="md:col-span-5 relative w-full aspect-square rounded-2xl overflow-hidden bg-muted border border-border/20 shadow-lg group">
                <Image
                  src={featuredBundle.images[0] || "/placeholder.jpg"}
                  alt={featuredBundle.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-103"
                  sizes="(max-w-7xl) 33vw, 50vw"
                />
              </div>

              {/* Text Column */}
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

                {/* Bundle Inclusions */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Ritual Inclusions:
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {featuredBundle.products.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a]" />
                        {item.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Pricing & CTA */}
                <div className="flex flex-col gap-4 border-t border-border/30 dark:border-[#232c26]/20 pt-6 mt-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="text-2xl font-black text-[#2d4c38] dark:text-emerald-400 font-serif">
                      ${featuredBundle.price.toFixed(2)}
                    </span>
                    {featuredBundle.compareAtPrice && (
                      <span className="w-full text-sm text-muted-foreground line-through sm:w-auto">
                        ${featuredBundle.compareAtPrice.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/bundles/${featuredBundle.slug}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#203628] px-6 text-xs font-bold uppercase tracking-wider text-white hover:translate-y-[-1px] transition-all shadow-md sm:w-auto"
                  >
                    View Ritual Set
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

              </div>

            </div>
          </div>
        </section>
      )}

      {/* 5. Editorial Story / Philosophy Quote Panel */}
      <section className="bg-[#fcfcfb] dark:bg-[#0a0d0b] py-28 px-6 sm:px-8 transition-colors duration-300 relative overflow-hidden">
        
        {/* Soft Organic Line Divider decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1px] bg-gradient-to-r from-transparent via-[#e2dacd] to-transparent" />

        <div className="mx-auto max-w-3xl text-center flex flex-col gap-6 relative z-10 animate-fade-in-up">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#b07e3a]">
            Our Commitment
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-[1.15] tracking-tight">
            Nourish Your Body.<br />
            Respect Our Planet.
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed mt-2 italic font-serif max-w-2xl mx-auto">
            "We believe that beauty is formed through pure, natural balance. That’s why we source our white sage, aloe, and seaweed from local wild farms, utilizing zero-waste packaging to ensure your beauty ritual is perfectly in harmony with nature."
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-border" />
            <span className="font-serif italic text-sm text-muted-foreground/80">The Naturalist Ethos</span>
            <span className="h-px w-8 bg-border" />
          </div>
        </div>
      </section>

    </div>
  );
}
