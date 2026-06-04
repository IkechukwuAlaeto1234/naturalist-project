"use client";

import React, { useState, useEffect } from "react";

import { ArrowRight } from "lucide-react";
import ImageWithSkeleton from "@/components/ui/ImageWithSkeleton";

const DEFAULT_MILESTONES = [
  {
    year: "2018",
    title: "The Seed",
    body: "Founded in a small home kitchen in Portland, Naturalist began as one person's frustration with toxic ingredient lists. The first formula — a white sage facial oil — was made in batches of twelve.",
  },
  {
    year: "2020",
    title: "First Harvest Partnership",
    body: "We established our first direct partnership with a certified organic white sage farm in Southern California, locking in our wild-harvesting ethics and supply chain integrity.",
  },
  {
    year: "2021",
    title: "Bakuchiol Breakthrough",
    body: "Our signature Bakuchiol Serum launched and sold out within 72 hours. It put Naturalist on the map as a serious alternative to synthetic retinol — without a single irritant.",
  },
  {
    year: "2023",
    title: "Zero Waste Certified",
    body: "We completed our transition to 100% recyclable glass and organic wood packaging, eliminating the last traces of single-use plastic from our entire supply chain.",
  },
  {
    year: "2025",
    title: "Today",
    body: "Naturalist now serves over 80,000 customers across 40 countries. Every formula is still made in small batches, third-party tested, and built around the same founding principle: pure is powerful.",
  },
];

const DEFAULT_VALUES = [
  {
    label: "Radical Transparency",
    body: "Every ingredient, every supplier, every test result — available on request. No proprietary blend smokescreens. No hidden fillers.",
  },
  {
    label: "Wild-Harvested Only",
    body: "We never use lab-synthesized substitutes where a living plant exists. Our botanicals come directly from organic farms and certified wild-harvest cooperatives.",
  },
  {
    label: "Small Batch Always",
    body: "Mass production compromises freshness and potency. Every Naturalist formula is made in controlled small batches and tested before it ships.",
  },
  {
    label: "Planet-First Packaging",
    body: "Glass. Wood. Recycled paper. Nothing that outlives a human lifespan in a landfill. We absorbed the cost increase ourselves — not passed to you.",
  },
];

export default function StoryPage() {
  const [mounted, setMounted] = useState(false);
  const [pageContent, setPageContent] = useState<Record<string, any>>({});

  const getValue = (key: string, defaultValue: string) => {
    if (Object.keys(pageContent).length === 0) return defaultValue;
    const val = pageContent[key];
    return val !== undefined && val !== null && val !== "" ? val : defaultValue;
  };

  const heroBadge = getValue("heroBadge", "The Naturalist Origin");
  const heroHeadline = getValue("heroHeadline", "Our Story");
  const heroSubtext = getValue("heroSubtext", "Built on the belief that pure is powerful — and that skin deserves honesty.");
  const heroImage = getValue("heroImage", "");

  const openingQuote = getValue("openingQuote", "We started because we couldn't find a single skincare brand that told us the whole truth.");
  const openingAttribution = getValue("openingAttribution", "— Founders, Naturalist");
  const openingBody = getValue("openingBody", 'Every bottle on the market had a story — an aspirational pastoral image, a celebrity endorsement, a word like "natural" printed next to an ingredient list that read like a chemistry exam. We decided to build something different: a brand where the ingredient list is the whole point, and every botanical has a traceable origin.');
  const openingImage = getValue("openingImage", "");

  const timelineSectionBadge = getValue("timelineSectionBadge", "How We Got Here");
  const timelineSectionHeadline = getValue("timelineSectionHeadline", "Five Years, One Standard");
  
  const valuesSectionBadge = getValue("valuesSectionBadge", "What Drives Us");
  const valuesSectionHeadline = getValue("valuesSectionHeadline", "Our Founding Principles");

  const ctaBadge = getValue("ctaBadge", "Ready to Begin?");
  const ctaHeadline = getValue("ctaHeadline", "Experience the Ritual.");
  const ctaSubtext = getValue("ctaSubtext", "Every product is an extension of this story. Small batch. Third-party tested. Botanically honest.");
  const ctaImage = getValue("ctaImage", "");

  const milestones = Object.keys(pageContent).length > 0
    ? (pageContent.milestones || [])
    : DEFAULT_MILESTONES;

  const values = Object.keys(pageContent).length > 0
    ? (pageContent.values || [])
    : DEFAULT_VALUES;

  useEffect(() => {
    setMounted(true);
    const titleTimeout = setTimeout(() => {
      document.title = "Our Story | Naturalist";
    }, 120);

    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=story", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.metadata) setPageContent(data.metadata);
        }
      } catch {
        // Fall back to defaults silently
      }
    }
    loadContent();

    return () => clearTimeout(titleTimeout);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full pb-32">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "380px" }}>
        {heroImage ? (
          <ImageWithSkeleton
            src={heroImage}
            alt=""
            className="w-full h-full object-cover opacity-25 pointer-events-none"
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="storyPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M40 100 Q80 20 120 20 Q90 60 40 100Z" fill="#b07e3a" opacity="0.1" />
                <path d="M40 100 Q80 180 120 180 Q90 140 40 100Z" fill="#b07e3a" opacity="0.07" />
                <line x1="40" y1="100" x2="120" y2="100" stroke="#b07e3a" strokeWidth="0.5" opacity="0.12" />
                <path d="M160 40 Q180 80 190 100 Q170 75 160 40Z" fill="#2d4c38" opacity="0.18" />
                <path d="M160 160 Q180 120 190 100 Q170 125 160 160Z" fill="#2d4c38" opacity="0.14" />
                <circle cx="120" cy="100" r="3" fill="#b07e3a" opacity="0.2" />
                <circle cx="40" cy="100" r="1.5" fill="#2d4c38" opacity="0.15" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#storyPattern)" />
          </svg>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-28">
          {heroBadge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">
              {heroBadge}
            </span>
          )}
          {heroHeadline && (
            <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}>
              {heroHeadline}
            </h1>
          )}
          {heroSubtext && (
            <p className="text-sm text-white/40 max-w-sm leading-relaxed mt-1">
              {heroSubtext}
            </p>
          )}
        </div>
      </section>

      {/* Opening Statement */}
      {(openingQuote || openingBody || openingImage) && (
        <section className="w-full bg-white dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/30 transition-colors duration-300">
          <div className="mx-auto max-w-3xl text-center flex flex-col gap-6">
            {openingQuote && (
              <p className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[#2d4c38] dark:text-emerald-400 leading-[1.3] tracking-tight">
                {openingQuote}
              </p>
            )}
            {openingAttribution && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="h-px w-8 bg-border" />
                <span className="font-serif italic text-sm text-muted-foreground">
                  {openingAttribution}
                </span>
                <span className="h-px w-8 bg-border" />
              </div>
            )}
            {openingBody && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto mt-4">
                {openingBody}
              </p>
            )}
            {openingImage && (
              <div className="mt-8 rounded-3xl overflow-hidden border border-border/30 max-w-2xl mx-auto shadow-lg">
                <ImageWithSkeleton src={openingImage} alt="Founders story visual" className="w-full object-cover max-h-96 animate-fade-in" />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Timeline */}
      {milestones && milestones.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0f1411] py-24 px-6 sm:px-8 border-b border-border/30 transition-colors duration-300">
          <div className="mx-auto max-w-3xl">
            {(timelineSectionBadge || timelineSectionHeadline) && (
              <div className="text-center mb-16">
                {timelineSectionBadge && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                    {timelineSectionBadge}
                  </span>
                )}
                {timelineSectionHeadline && (
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-3 tracking-tight">
                    {timelineSectionHeadline}
                  </h2>
                )}
              </div>
            )}

            <div className="relative flex flex-col gap-0">
              {/* Vertical line */}
              <div className="absolute left-[68px] top-0 bottom-0 w-px bg-border/50 dark:bg-[#232c26]" />

              {milestones.map((m: any, i: number) => (
                <div key={i} className="flex gap-8 group pb-12 last:pb-0 animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                  {/* Year badge */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0 w-[68px] relative z-10">
                    <div className="h-10 w-10 rounded-full bg-[#2d4c38]/10 dark:bg-emerald-500/10 border border-[#2d4c38]/20 dark:border-emerald-500/20 flex items-center justify-center group-hover:bg-[#2d4c38] group-hover:border-[#2d4c38] transition-all duration-300 -ml-[1px]">
                      <span className="text-[9px] font-black text-[#2d4c38] dark:text-emerald-400 group-hover:text-white transition-colors">{m.year}</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex flex-col gap-2 pb-2">
                    <h3 className="font-serif text-lg font-bold text-foreground leading-snug">{m.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Values */}
      {values && values.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/30 transition-colors duration-300">
          <div className="mx-auto max-w-4xl">
            {(valuesSectionBadge || valuesSectionHeadline) && (
              <div className="text-center mb-16">
                {valuesSectionBadge && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                    {valuesSectionBadge}
                  </span>
                )}
                {valuesSectionHeadline && (
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-3 tracking-tight">
                    {valuesSectionHeadline}
                  </h2>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map((v: any, i: number) => (
                <div key={i} className="flex flex-col gap-3 p-7 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] hover:border-[#2d4c38]/40 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">{v.label}</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      {(ctaBadge || ctaHeadline || ctaSubtext || ctaImage) && (
        <section className="relative w-full bg-[#111a14] py-20 px-6 sm:px-8 overflow-hidden">
          {ctaImage && (
            <ImageWithSkeleton
              src={ctaImage}
              alt=""
              className="w-full h-full object-cover opacity-15 pointer-events-none"
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            />
          )}
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-6">
            {ctaBadge && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                {ctaBadge}
              </span>
            )}
            {ctaHeadline && (
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white leading-snug">
                {ctaHeadline}
              </h2>
            )}
            {ctaSubtext && (
              <p className="text-sm text-white/40 leading-relaxed max-w-sm">
                {ctaSubtext}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <a href="/p/shop" className="flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-8 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md">
                Shop All Rituals <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/p/sustainability" className="flex h-12 items-center justify-center rounded-full border border-white/20 hover:border-white/40 px-8 text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white transition-all">
                Our Sustainability Pledge
              </a>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
