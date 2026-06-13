"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface BundlesClientProps {
  initialBundles: any[];
  pageContent: Record<string, string>;
}

function BundleCard({ bundle }: { bundle: any }) {
  const { formatPrice } = useCurrency();
  const primaryImage = bundle.images?.[0];

  return (
    <Link
      href={`/bundles/${bundle.slug}`}
      className="group flex flex-col overflow-hidden rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={primaryImage}
            alt={bundle.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#f5f2ee] dark:bg-[#181e1b]">
            <Package className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        {bundle.compareAtPrice && bundle.compareAtPrice > bundle.price && (
          <div className="absolute top-4 left-4">
            <span className="rounded-full bg-[#2d4c38] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow">
              Save {Math.round(((bundle.compareAtPrice - bundle.price) / bundle.compareAtPrice) * 100)}%
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6 flex-1">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-serif text-xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] group-hover:text-[#2d4c38] transition-colors leading-snug">
            {bundle.name}
          </h3>
          {bundle.description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {bundle.description}
            </p>
          )}
        </div>

        {bundle.products?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bundle.products.slice(0, 3).map((p: any, i: number) => (
              <span
                key={i}
                className="rounded-full bg-[#2d4c38]/5 border border-[#2d4c38]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#2d4c38] dark:text-emerald-300"
              >
                {p.name || p}
              </span>
            ))}
            {bundle.products.length > 3 && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-[9px] font-bold text-muted-foreground">
                +{bundle.products.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold text-[#2d4c38] dark:text-emerald-400">
              {formatPrice(bundle.price)}
            </span>
            {bundle.compareAtPrice && bundle.compareAtPrice > bundle.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatPrice(bundle.compareAtPrice)}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-[#2d4c38] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition-all group-hover:bg-[#3a6349]">
            View Bundle
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function BundlesClient({ initialBundles, pageContent }: BundlesClientProps) {
  const getValue = useCallback(
    (key: string, defaultValue: string) => {
      const val = pageContent[key];
      return val !== undefined && val !== null ? val : defaultValue;
    },
    [pageContent]
  );

  const heroBadge = getValue("heroBadge", "Ritual Collections");
  const heroHeadline = getValue("heroHeadline", "Our Bundles");
  const heroSubtext = getValue("heroSubtext", "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.");
  const emptyStateTitle = getValue("emptyStateTitle", "Rituals Being Assembled");
  const emptyStateBody = getValue("emptyStateBody", "Our curators are carefully selecting the perfect botanical companions for each bundle. Check back shortly.");

  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "320px" }}>
        {pageContent.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pageContent.heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="bundlesPattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M20 80 Q55 25 90 25 Q65 55 20 80Z" fill="#b07e3a" opacity="0.12" />
                <path d="M20 80 Q55 135 90 135 Q65 105 20 80Z" fill="#b07e3a" opacity="0.08" />
                <path d="M120 30 Q145 60 150 80 Q130 65 120 30Z" fill="#2d4c38" opacity="0.18" />
                <path d="M120 130 Q145 100 150 80 Q130 95 120 130Z" fill="#2d4c38" opacity="0.14" />
                <circle cx="90" cy="80" r="3" fill="#b07e3a" opacity="0.18" />
                <circle cx="20" cy="80" r="1.5" fill="#2d4c38" opacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#bundlesPattern)" />
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

      {/* Grid */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-16 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-7xl">
          {initialBundles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-[32px] bg-muted/20 max-w-md mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-4">
                <Package className="h-6 w-6 animate-pulse" />
              </div>
              <h3 className="font-serif text-lg font-bold text-foreground">{emptyStateTitle}</h3>
              <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">{emptyStateBody}</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-8 uppercase tracking-wider font-bold">
                {initialBundles.length} {initialBundles.length === 1 ? "bundle" : "bundles"} available
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {initialBundles.map((bundle) => (
                  <BundleCard key={bundle._id} bundle={bundle} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

    </div>
  );
}
