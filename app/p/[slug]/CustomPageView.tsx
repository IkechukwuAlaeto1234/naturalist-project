"use client";

import React, { useState, useEffect } from "react";

interface Section {
  type: "text" | "image" | "richtext" | "cta";
  label: string;
  value: string;
  image?: string;
}

interface CustomPageContent {
  title: string;
  metadata: {
    slug: string;
    heroHeadline?: string;
    heroSubtext?: string;
    heroImage?: string;
    sections?: Section[];
    publishedAt?: string;
  };
}

// Very lightweight markdown renderer — supports **bold**, *italic*, [text](url), newlines
function renderMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").map((line, i) => {
    const parts: React.ReactNode[] = [];
    // Bold
    let remaining = line;
    const regex = /\*\*(.+?)\*\*|\*(.+?)\*|\[(.+?)\]\((.+?)\)/g;
    let lastIdx = 0;
    let match;
    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIdx) parts.push(remaining.slice(lastIdx, match.index));
      if (match[1]) parts.push(<strong key={match.index}>{match[1]}</strong>);
      else if (match[2]) parts.push(<em key={match.index}>{match[2]}</em>);
      else if (match[3] && match[4]) parts.push(<a key={match.index} href={match[4]} className="text-[#2d4c38] underline">{match[3]}</a>);
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < remaining.length) parts.push(remaining.slice(lastIdx));
    return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{parts}</p>;
  });
}

export default function CustomPageView({ content }: { content: CustomPageContent }) {
  const { title, metadata } = content;
  const sections = metadata.sections || [];

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="flex flex-col w-full pb-32 min-h-screen" />;
  }

  return (
    <div className="flex flex-col w-full pb-32">

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center"
        style={{ minHeight: "300px" }}
      >
        {/* Background image if set */}
        {metadata.heroImage && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={metadata.heroImage}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
          </>
        )}

        {/* Default SVG pattern when no image */}
        {!metadata.heroImage && (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="pagePattern" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
                <path d="M30 80 Q55 30 80 30 Q60 58 30 80Z" fill="#b07e3a" opacity="0.12" />
                <path d="M30 80 Q55 130 80 130 Q60 102 30 80Z" fill="#b07e3a" opacity="0.08" />
                <path d="M110 30 Q130 55 140 80 Q120 62 110 30Z" fill="#2d4c38" opacity="0.16" />
                <path d="M110 130 Q130 105 140 80 Q120 98 110 130Z" fill="#2d4c38" opacity="0.12" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#pagePattern)" />
          </svg>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />

        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-24">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Naturalist</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(2.5rem, 8vw, 5.5rem)" }}>
            {metadata.heroHeadline || title}
          </h1>
          {metadata.heroSubtext && (
            <p className="text-sm text-white/40 max-w-sm leading-relaxed mt-1">{metadata.heroSubtext}</p>
          )}
        </div>
      </section>

      {/* Content Sections */}
      {sections.length > 0 && (
        <div className="mx-auto max-w-3xl w-full px-6 sm:px-8 py-16 flex flex-col gap-12">
          {sections.map((section, i) => (
            <div key={i}>
              {section.label && (
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] mb-3 block">
                  {section.label}
                </span>
              )}
              {(section.type === "text" || section.type === "richtext") && section.value && (
                <div className={`grid grid-cols-1 ${section.image ? "md:grid-cols-2 gap-8 items-center" : "max-w-none"}`}>
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(section.value)}
                  </div>
                  {section.image && (
                    <div className="rounded-2xl overflow-hidden border border-border/30 shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={section.image}
                        alt={section.label || ""}
                        className="w-full object-cover max-h-[350px]"
                      />
                    </div>
                  )}
                </div>
              )}
              {section.type === "image" && section.value && (
                <div className="rounded-2xl overflow-hidden border border-border/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={section.value}
                    alt={section.label || ""}
                    className="w-full object-cover"
                  />
                </div>
              )}
              {section.type === "cta" && section.value && (() => {
                let ctaData = { headline: "", subtext: "", buttonText: "", buttonUrl: "" };
                try {
                  ctaData = JSON.parse(section.value);
                } catch (e) {}
                return (
                  <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#fcfbf9] to-[#f7f5ef] dark:from-[#111613] dark:to-[#0a0d0b] border border-[#2d4c38]/10 dark:border-white/5 shadow-lg flex flex-col md:flex-row items-center gap-6 md:gap-10 p-6 md:p-8">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#2d4c38]/5 blur-[70px] pointer-events-none" />
                    {section.image && (
                      <div className="w-full md:w-1/2 h-48 md:h-64 rounded-2xl overflow-hidden border border-border/20 flex-shrink-0 relative z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={section.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`flex flex-col items-center md:items-start text-center md:text-left gap-4 flex-1 relative z-10 ${!section.image ? "w-full items-center text-center py-4" : ""}`}>
                      {ctaData.headline && (
                        <h3 className="font-serif text-2xl font-black text-[#2d4c38] dark:text-[#b3dfc1] leading-tight">
                          {ctaData.headline}
                        </h3>
                      )}
                      {ctaData.subtext && (
                        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                          {ctaData.subtext}
                        </p>
                      )}
                      {ctaData.buttonText && ctaData.buttonUrl && (
                        <a
                          href={ctaData.buttonUrl}
                          className="inline-flex h-11 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#203628] dark:bg-emerald-600 dark:hover:bg-emerald-700 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all duration-300 mt-2 hover:translate-y-[-1px]"
                        >
                          {ctaData.buttonText}
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="mx-auto max-w-xl px-6 py-24 text-center">
          <p className="text-sm text-muted-foreground">This page has no content sections yet.</p>
        </div>
      )}

    </div>
  );
}
