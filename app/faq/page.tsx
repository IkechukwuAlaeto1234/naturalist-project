"use client";

import React from "react";
import { ArrowRight } from "lucide-react";

const faqs = [
  {
    category: "Products & Ingredients",
    anchor: "products",
    items: [
      {
        q: "Are all Naturalist products 100% organic?",
        a: "Yes. Every formulation is built exclusively from certified organic, wild-harvested botanicals. We never use synthetic fillers, artificial fragrances, parabens, or sulphates. Every batch is third-party tested before it reaches you.",
      },
      {
        q: "Are your products vegan and cruelty-free?",
        a: "Absolutely. No animal-derived ingredients, no animal testing — at any stage of production. We are certified cruelty-free and every product in our range is 100% vegan.",
      },
      {
        q: "What is bakuchiol and why do you use it?",
        a: "Bakuchiol is a plant-derived retinol alternative extracted from the Psoralea corylifolia seed. It delivers the same cell-renewal and anti-ageing benefits as retinol without the irritation, making it suitable for all skin types including sensitive skin.",
      },
      {
        q: "Do your products have expiry dates?",
        a: "Yes. Each product displays a Period After Opening (PAO) symbol — typically 6 to 12 months. Because we use no synthetic preservatives, we recommend storing products away from direct sunlight and using them within the indicated period.",
      },
    ],
  },
  {
    category: "Orders & Shipping",
    anchor: "shipping",
    items: [
      {
        q: "How long does shipping take?",
        a: "Standard domestic orders are dispatched within 1–2 business days and arrive within 3–5 business days. International shipping typically takes 7–14 business days depending on destination and customs processing.",
      },
      {
        q: "Do you offer free shipping?",
        a: "Yes — free standard shipping on all domestic orders above $75. International orders qualify for free shipping above $120.",
      },
      {
        q: "Can I change or cancel my order after placing it?",
        a: "Orders can be modified or cancelled within 2 hours of placement. After that window, fulfilment has usually begun. Contact us immediately at hello@naturalist.com and we will do our best to assist.",
      },
      {
        q: "Do you ship internationally?",
        a: "Yes, we ship to over 40 countries. Shipping fees and delivery estimates are calculated at checkout based on your location. Please note that import duties and taxes may apply and are the responsibility of the recipient.",
      },
    ],
  },
  {
    category: "Returns & Refunds",
    anchor: "returns",
    items: [
      {
        q: "What is your return policy?",
        a: "We offer a 30-day hassle-free return window. If you are not completely satisfied, return the product in its original condition for a full refund. Products must be at least 50% unused to qualify.",
      },
      {
        q: "How do I initiate a return?",
        a: "Visit your account dashboard under 'My Orders', select the item you wish to return, and follow the guided steps. A prepaid return label will be emailed to you within 24 hours.",
      },
      {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 3–5 business days of receiving your return. The funds typically appear on your statement within 5–10 business days depending on your bank or card issuer.",
      },
    ],
  },
  {
    category: "Skin & Usage",
    anchor: "usage",
    items: [
      {
        q: "How do I know which products suit my skin type?",
        a: "Our product pages include detailed skin type guides. As a general rule: our Botanical Cleansing Oil suits dry to normal skin; the White Sage Clarifying Toner works beautifully for oily and combination skin; and our Bakuchiol Serum is suitable for all skin types.",
      },
      {
        q: "Can I use multiple Naturalist products together?",
        a: "Yes — our range is designed to layer. A typical morning ritual: Cleanse → Tone → Serum → Moisturise → SPF. Evening: Cleanse → Tone → Bakuchiol Serum → Face Oil. Avoid layering more than two active serums at once.",
      },
      {
        q: "I have sensitive skin. Are your products safe for me?",
        a: "Most of our range is formulated with sensitive skin in mind. We recommend patch testing any new product on the inner wrist for 24 hours before full application. If irritation occurs, discontinue use and consult a dermatologist.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "420px" }}>
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="botanicalHero" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
              <path d="M30 80 Q55 30 80 30 Q60 58 30 80Z" fill="#b07e3a" opacity="0.18" />
              <path d="M30 80 Q55 130 80 130 Q60 102 30 80Z" fill="#b07e3a" opacity="0.12" />
              <line x1="30" y1="80" x2="80" y2="80" stroke="#b07e3a" strokeWidth="0.8" opacity="0.2" />
              <line x1="55" y1="55" x2="65" y2="80" stroke="#b07e3a" strokeWidth="0.4" opacity="0.15" />
              <line x1="45" y1="68" x2="60" y2="80" stroke="#b07e3a" strokeWidth="0.4" opacity="0.15" />
              <path d="M110 30 Q130 55 140 80 Q120 62 110 30Z" fill="#2d4c38" opacity="0.22" />
              <path d="M110 130 Q130 105 140 80 Q120 98 110 130Z" fill="#2d4c38" opacity="0.16" />
              <line x1="110" y1="30" x2="140" y2="80" stroke="#2d4c38" strokeWidth="0.8" opacity="0.2" />
              <line x1="110" y1="130" x2="140" y2="80" stroke="#2d4c38" strokeWidth="0.8" opacity="0.2" />
              <circle cx="80" cy="80" r="2.5" fill="#b07e3a" opacity="0.25" />
              <circle cx="80" cy="80" r="5" fill="none" stroke="#b07e3a" strokeWidth="0.5" opacity="0.1" />
              <path d="M10 20 Q18 10 26 14 Q18 18 10 20Z" fill="#b07e3a" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#botanicalHero)" />
        </svg>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(45,76,56,0.35) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to right, #0d1510 0%, transparent 20%, transparent 80%, #0d1510 100%)" }} />

        <div className="relative z-10 flex flex-col items-center text-center gap-4 px-6 py-28 md:py-36">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Got Questions?</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(5rem, 14vw, 10rem)" }}>
            FAQ
          </h1>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">
            Everything you need to know about our products, orders, and the Naturalist way.
          </p>
          {/* Scroll anchors */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {faqs.map(section => (
              <a
                key={section.anchor}
                href={`#${section.anchor}`}
                className="px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.06] text-white/60 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
              >
                {section.category}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── BODY — Flowing sections ── */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-20 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-3xl space-y-20">
          {faqs.map((section, si) => (
            <div key={section.category} id={section.anchor} className="scroll-mt-20">
              {/* Section header */}
              <div className="flex items-center gap-4 mb-10">
                <span className="text-xs font-black uppercase tracking-[0.25em] text-[#b07e3a]">
                  {String(si + 1).padStart(2, "0")}
                </span>
                <h2 className="font-serif text-2xl font-bold text-foreground">{section.category}</h2>
                <span className="flex-1 h-px bg-border/50" />
              </div>

              {/* Q&A items — flowing, no toggle */}
              <div className="space-y-8">
                {section.items.map((item, i) => (
                  <div key={i} className="group relative pl-6 border-l-2 border-[#2d4c38]/20 hover:border-[#b07e3a]/50 transition-colors duration-300">
                    <h3 className="text-base font-bold text-foreground leading-snug mb-2 group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors duration-200">
                      {item.q}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom contact CTA */}
          <div className="mt-6 rounded-3xl bg-[#111a14] px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                <pattern id="ctaPattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <path d="M15 40 Q28 15 40 15 Q30 29 15 40Z" fill="#b07e3a" />
                  <path d="M15 40 Q28 65 40 65 Q30 51 15 40Z" fill="#b07e3a" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#ctaPattern)" />
            </svg>
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] mb-1">Still wondering?</p>
              <p className="text-white font-serif text-xl font-bold leading-snug">We&apos;re one message away.</p>
              <p className="text-white/35 text-xs mt-1.5">Our team typically responds within a few hours.</p>
            </div>
            <a
              href="/contact"
              className="relative z-10 flex-shrink-0 flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-8 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Contact Us <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}