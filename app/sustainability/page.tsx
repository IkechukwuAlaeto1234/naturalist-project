"use client";

import React, { useState, useEffect } from "react";

import { Leaf, Recycle, Droplets, Wind, ArrowRight } from "lucide-react";

const PILLAR_ICONS = [Leaf, Recycle, Droplets, Wind];

const DEFAULT_PILLARS = [
  {
    title: "Wild-Harvested Sourcing",
    body: "Every botanical ingredient is sourced from certified organic farms or licensed wild-harvest cooperatives. We conduct annual audits of every supplier in our chain — no exceptions.",
  },
  {
    title: "Zero-Waste Packaging",
    body: "100% of our packaging is recyclable glass, organic wood, or FSC-certified recycled paper. We eliminated the last single-use plastic component from our supply chain in 2023.",
  },
  {
    title: "Water Responsibility",
    body: "Our manufacturing facilities use closed-loop water systems that recycle over 92% of process water. We also offset 100% of our remaining water usage through WaterAid partnerships.",
  },
  {
    title: "Carbon Neutral Operations",
    body: "All Naturalist facilities run on 100% renewable energy. Our logistics are carbon-offset through verified reforestation projects in sub-Saharan Africa and Southeast Asia.",
  },
];

export default function SustainabilityPage() {
  const [mounted, setMounted] = useState(false);
  const [pageContent, setPageContent] = useState<Record<string, any>>({});

  useEffect(() => {
    setMounted(true);
    const titleTimeout = setTimeout(() => {
      document.title = "Sustainability | Naturalist";
    }, 120);

    async function loadContent() {
      try {
        const res = await fetch("/api/content?key=sustainability", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data?.metadata) setPageContent(data.metadata);
        }
      } catch {
        // Fall back to defaults
      }
    }
    loadContent();

    return () => clearTimeout(titleTimeout);
  }, []);

  if (!mounted) return null;

  const getValue = (key: string, defaultValue: string) => {
    if (Object.keys(pageContent).length === 0) return defaultValue;
    const val = pageContent[key];
    return val !== undefined && val !== null ? val : defaultValue;
  };

  const heroBadge = getValue("heroBadge", "Planet First");
  const heroHeadline = getValue("heroHeadline", "Sustainability");
  const heroSubtext = getValue("heroSubtext", "Our pledge to the planet that grows our ingredients and the communities that harvest them.");
  const heroImage = getValue("heroImage", "");

  const pillarsSectionBadge = getValue("pillarsSectionBadge", "Our Commitments");
  const pillarsSectionHeadline = getValue("pillarsSectionHeadline", "Four Pillars of Responsibility");

  const ctaSectionBadge = getValue("ctaSectionBadge", "Customer Care");
  const ctaHeadline = getValue("ctaHeadline", "Questions about returns?");
  const ctaSubtext = getValue("ctaSubtext", "We stand behind every formula. If it doesn't work for you, we make it right — no questions asked.");

  const pillars = Object.keys(pageContent).length > 0
    ? (pageContent.pillars || [])
    : DEFAULT_PILLARS;

  const stats = [
    { value: getValue("stat1Value", "100%"), label: getValue("stat1Label", "Organic Botanicals") },
    { value: getValue("stat2Value", "0"), label: getValue("stat2Label", "Single-Use Plastics") },
    { value: getValue("stat3Value", "92%"), label: getValue("stat3Label", "Water Recycled") },
    { value: getValue("stat4Value", "40+"), label: getValue("stat4Label", "Countries Served") },
  ].filter(stat => stat.value !== "" || stat.label !== "");

  return (
    <div className="flex flex-col w-full pb-32">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "380px" }}>
        {heroImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="sustainPattern" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
                <circle cx="70" cy="70" r="35" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.15" />
                <path d="M70 10 L10 110 L130 110 Z" fill="none" stroke="#b07e3a" strokeWidth="0.5" opacity="0.1" />
                <circle cx="70" cy="75" r="3" fill="#b07e3a" opacity="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#sustainPattern)" />
          </svg>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 75% at 50% 50%, rgba(45,76,56,0.35) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-28">
          {heroBadge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">
              {heroBadge}
            </span>
          )}
          {heroHeadline && (
            <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}>
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

      {/* Sustainability Pillars */}
      {pillars && pillars.length > 0 && (
        <section className="w-full bg-white dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/30 transition-colors duration-300">
          <div className="mx-auto max-w-4xl">
            {(pillarsSectionBadge || pillarsSectionHeadline) && (
              <div className="text-center mb-16">
                {pillarsSectionBadge && (
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                    {pillarsSectionBadge}
                  </span>
                )}
                {pillarsSectionHeadline && (
                  <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-3 tracking-tight">
                    {pillarsSectionHeadline}
                  </h2>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {pillars.map((pillar: any, i: number) => {
                const Icon = PILLAR_ICONS[i % PILLAR_ICONS.length];
                return (
                  <div key={i} className="flex flex-col gap-4 p-7 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] hover:border-[#2d4c38]/40 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-foreground">{pillar.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{pillar.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Stats Bar */}
      {stats.length > 0 && (
        <section className="w-full bg-[#2d4c38] py-14 px-6 sm:px-8">
          <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col gap-1">
                {stat.value && <span className="font-serif text-3xl sm:text-4xl font-black text-white">{stat.value}</span>}
                {stat.label && <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{stat.label}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA to Refund Policy */}
      {(ctaSectionBadge || ctaHeadline || ctaSubtext) && (
        <section className="w-full bg-white dark:bg-[#0f1411] py-20 px-6 sm:px-8 border-t border-border/30 transition-colors duration-300">
          <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-5">
            {ctaSectionBadge && (
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                {ctaSectionBadge}
              </span>
            )}
            {ctaHeadline && (
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {ctaHeadline}
              </h2>
            )}
            {ctaSubtext && (
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {ctaSubtext}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <a href="/p/refund-policy" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-7 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all shadow-sm">
                Refund Policy <ArrowRight className="h-3.5 w-3.5" />
              </a>
              <a href="/p/contact" className="flex h-11 items-center justify-center rounded-full border border-border px-7 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-[#2d4c38]/40 hover:text-foreground transition-all">
                Contact Support
              </a>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
