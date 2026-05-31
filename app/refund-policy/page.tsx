import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | Naturalist",
  description: "Naturalist's 30-day satisfaction guarantee, return process, and refund timeline.",
};

const refundPolicy = [
  {
    title: "30-Day Satisfaction Guarantee",
    body: "If you're not completely satisfied with any Naturalist product, return it within 30 days of delivery for a full refund — no questions asked. The product must be at least 50% unused.",
  },
  {
    title: "How to Initiate a Return",
    body: "Log in to your account and navigate to 'My Orders'. Select the item you wish to return and follow the guided steps. A prepaid return label will be emailed to you within 24 hours.",
  },
  {
    title: "Refund Processing Time",
    body: "Once we receive your return, refunds are processed within 3–5 business days. The funds typically appear on your statement within 5–10 business days depending on your bank or card issuer.",
  },
  {
    title: "Damaged or Incorrect Orders",
    body: "If your order arrives damaged or incorrect, contact us at hello@naturalist.com within 7 days with a photo. We will dispatch a replacement at no cost within 2 business days.",
  },
  {
    title: "Non-Returnable Items",
    body: "For hygiene reasons, opened products that are more than 50% used cannot be returned. Gift cards and downloadable content are also non-refundable.",
  },
  {
    title: "International Returns",
    body: "International customers are responsible for return shipping costs unless the item is damaged or incorrect. Refunds are issued in the original currency of purchase.",
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "300px" }}>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="refundPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="60" cy="60" r="30" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.12" />
              <circle cx="60" cy="60" r="3" fill="#b07e3a" opacity="0.2" />
              <path d="M15 60 Q38 20 60 20 Q44 42 15 60Z" fill="#2d4c38" opacity="0.14" />
              <path d="M105 60 Q82 100 60 100 Q76 78 105 60Z" fill="#b07e3a" opacity="0.1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#refundPattern)" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-24">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Customer Care</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(2.8rem, 8vw, 6rem)" }}>
            Refund Policy
          </h1>
          <p className="text-sm text-white/40 max-w-sm leading-relaxed mt-1">
            We stand behind every formula. If it doesn't work for you, we make it right.
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-24 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-3xl">

          {/* Trust badge */}
          <div className="flex items-center justify-center gap-4 mb-14 p-5 rounded-2xl border border-[#2d4c38]/20 bg-[#2d4c38]/05 dark:bg-[#2d4c38]/10 dark:border-emerald-500/20 w-fit mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">30-Day Guarantee</p>
              <p className="text-xs text-muted-foreground">No questions asked. No hoops to jump through.</p>
            </div>
          </div>

          <div className="rounded-2xl border border-border/40 dark:border-[#232c26] overflow-hidden divide-y divide-border/30 dark:divide-[#232c26]/60">
            {refundPolicy.map((item, i) => (
              <div key={i} className="p-6 hover:bg-muted/20 dark:hover:bg-[#151c18]/40 transition-colors duration-200">
                <h3 className="text-sm font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-xs text-muted-foreground mb-4">Still have questions about a return?</p>
            <Link href="/contact" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-7 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all shadow-sm">
              Contact Support <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}
