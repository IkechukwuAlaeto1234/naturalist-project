import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ShoppingBag, Package, BookOpen, Leaf, HelpCircle,
  Mail, User, ShieldCheck, Lock, Cookie, Map, ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Sitemap | Naturalist",
  description: "A full map of all pages on the Naturalist website.",
};

const sections = [
  {
    label: "Shop",
    color: "#2d4c38",
    links: [
      { href: "/shop", label: "All Products", icon: ShoppingBag, desc: "Browse the full Naturalist range" },
      { href: "/bundles", label: "Ritual Bundles", icon: Package, desc: "Curated sets for complete routines" },
    ],
  },
  {
    label: "Company",
    color: "#b07e3a",
    links: [
      { href: "/story", label: "Our Story", icon: BookOpen, desc: "How Naturalist began and where we're going" },
      { href: "/sustainability", label: "Sustainability", icon: Leaf, desc: "Our planet-first commitments" },
    ],
  },
  {
    label: "Support",
    color: "#2d4c38",
    links: [
      { href: "/faq", label: "FAQ", icon: HelpCircle, desc: "Answers to the most common questions" },
      { href: "/contact", label: "Contact Us", icon: Mail, desc: "Get in touch with our team" },
      { href: "/account", label: "My Account", icon: User, desc: "Orders, settings, and preferences" },
      { href: "/refund-policy", label: "Refund Policy", icon: ShieldCheck, desc: "30-day satisfaction guarantee" },
    ],
  },
  {
    label: "Legal",
    color: "#5e6f64",
    links: [
      { href: "/privacy-policy", label: "Privacy Policy", icon: Lock, desc: "How we handle your personal data" },
      { href: "/terms", label: "Terms of Service", icon: ShieldCheck, desc: "Rules governing use of our website" },
      { href: "/cookie-policy", label: "Cookie Policy", icon: Cookie, desc: "How we use cookies and tracking" },
      { href: "/sitemap", label: "Sitemap", icon: Map, desc: "You're here — all pages listed" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center"
        style={{ minHeight: "260px" }}
      >
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="sitemapPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <circle cx="40" cy="40" r="18" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.13" />
              <circle cx="40" cy="40" r="2" fill="#b07e3a" opacity="0.18" />
              <line x1="40" y1="22" x2="40" y2="58" stroke="#2d4c38" strokeWidth="0.4" opacity="0.1" />
              <line x1="22" y1="40" x2="58" y2="40" stroke="#b07e3a" strokeWidth="0.4" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#sitemapPattern)" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.28) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Navigation</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}>
            Sitemap
          </h1>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">
            Every page on the Naturalist website, in one place.
          </p>
        </div>
      </section>

      {/* Sitemap Grid */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-20 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-5xl flex flex-col gap-14">
          {sections.map((section) => (
            <div key={section.label}>
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.25em]"
                  style={{ color: section.color }}
                >
                  {section.label}
                </span>
                <span className="h-px flex-1 bg-border/50" />
              </div>

              {/* Link cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.links.map(({ href, label, icon: Icon, desc }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group flex items-start gap-4 p-5 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] hover:border-[#2d4c38]/40 hover:shadow-md transition-all duration-200"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors duration-200"
                      style={{ background: `${section.color}18`, color: section.color }}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors">{label}</p>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 duration-200" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1.5 font-mono">{href}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
