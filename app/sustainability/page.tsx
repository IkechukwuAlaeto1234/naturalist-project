"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Leaf, Recycle, Droplets, Wind, ArrowRight } from "lucide-react";

const pillars = [
  {
    icon: Leaf,
    title: "Wild-Harvested Sourcing",
    body: "Every botanical ingredient is sourced from certified organic farms or licensed wild-harvest cooperatives. We conduct annual audits of every supplier in our chain — no exceptions.",
  },
  {
    icon: Recycle,
    title: "Zero-Waste Packaging",
    body: "100% of our packaging is recyclable glass, organic wood, or FSC-certified recycled paper. We eliminated the last single-use plastic component from our supply chain in 2023.",
  },
  {
    icon: Droplets,
    title: "Water Responsibility",
    body: "Our manufacturing facilities use closed-loop water systems that recycle over 92% of process water. We also offset 100% of our remaining water usage through WaterAid partnerships.",
  },
  {
    icon: Wind,
    title: "Carbon Neutral Operations",
    body: "All Naturalist facilities run on 100% renewable energy. Our logistics are carbon-offset through verified reforestation projects in sub-Saharan Africa and Southeast Asia.",
  },
];

export default function SustainabilityPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const titleTimeout = setTimeout(() => {
      document.title = "Sustainability | Naturalist";
    }, 120);
    return () => clearTimeout(titleTimeout);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col w-full pb-32">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "340px" }}>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="sustainPattern" x="0" y="0" width="140" height="140" patternUnits="userSpaceOnUse">
              <circle cx="70" cy="70" r="40" fill="none" stroke="#2d4c38" strokeWidth="0.6" opacity="0.15" />
              <circle cx="70" cy="70" r="25" fill="none" stroke="#b07e3a" strokeWidth="0.4" opacity="0.1" />
              <circle cx="70" cy="70" r="4" fill="#2d4c38" opacity="0.18" />
              <path d="M20 70 Q45 20 70 20 Q52 47 20 70Z" fill="#2d4c38" opacity="0.15" />
              <path d="M120 70 Q95 120 70 120 Q88 93 120 70Z" fill="#b07e3a" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#sustainPattern)" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 55% 75% at 50% 50%, rgba(45,76,56,0.35) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-28">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Planet First</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}>
            Sustainability
          </h1>
          <p className="text-sm text-white/40 max-w-sm leading-relaxed mt-1">
            Our pledge to the planet that grows our ingredients and the communities that harvest them.
          </p>
        </div>
      </section>

      {/* Sustainability Pillars */}
      <section className="w-full bg-white dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 border-b border-border/30 transition-colors duration-300">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Our Commitments</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mt-3 tracking-tight">Four Pillars of Responsibility</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {pillars.map((pillar, i) => (
              <div key={i} className="flex flex-col gap-4 p-7 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] hover:border-[#2d4c38]/40 hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <pillar.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-foreground">{pillar.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-2">{pillar.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="w-full bg-[#2d4c38] py-14 px-6 sm:px-8">
        <div className="mx-auto max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "100%", label: "Organic Botanicals" },
            { value: "0", label: "Single-Use Plastics" },
            { value: "92%", label: "Water Recycled" },
            { value: "40+", label: "Countries Served" },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="font-serif text-3xl sm:text-4xl font-black text-white">{stat.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA to Refund Policy */}
      <section className="w-full bg-white dark:bg-[#0f1411] py-20 px-6 sm:px-8 border-t border-border/30 transition-colors duration-300">
        <div className="mx-auto max-w-2xl text-center flex flex-col items-center gap-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Customer Care</span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Questions about returns?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
            We stand behind every formula. If it doesn't work for you, we make it right — no questions asked.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link href="/refund-policy" className="flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-7 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all shadow-sm">
              Refund Policy <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/contact" className="flex h-11 items-center justify-center rounded-full border border-border px-7 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:border-[#2d4c38]/40 hover:text-foreground transition-all">
              Contact Support
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
