"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    category: "Products & Ingredients",
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

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`transition-colors duration-200 ${open ? "bg-[#f4efe6]/60 dark:bg-[#151c18]/60" : ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 py-5 px-6 text-left group"
      >
        <span
          className={`text-sm font-semibold leading-relaxed transition-colors duration-200 ${
            open
              ? "text-[#2d4c38] dark:text-emerald-400"
              : "text-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400"
          }`}
        >
          {q}
        </span>
        <span
          className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center transition-all duration-300 ${
            open
              ? "bg-[#2d4c38] text-white"
              : "bg-muted text-muted-foreground group-hover:bg-[#2d4c38]/10 group-hover:text-[#2d4c38]"
          }`}
        >
          {open ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          open ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-sm text-muted-foreground leading-relaxed px-6 pr-14">{a}</p>
      </div>
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(faqs[0].category);

  return (
    <div className="flex flex-col w-full">

      {/* ── HERO ── */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "420px" }}>

        {/* Tiled botanical SVG pattern */}
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id="botanicalHero" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
              {/* Large leaf pair — gold */}
              <path d="M30 80 Q55 30 80 30 Q60 58 30 80Z" fill="#b07e3a" opacity="0.18" />
              <path d="M30 80 Q55 130 80 130 Q60 102 30 80Z" fill="#b07e3a" opacity="0.12" />
              <line x1="30" y1="80" x2="80" y2="80" stroke="#b07e3a" strokeWidth="0.8" opacity="0.2" />
              {/* Vein lines on gold leaf */}
              <line x1="55" y1="55" x2="65" y2="80" stroke="#b07e3a" strokeWidth="0.4" opacity="0.15" />
              <line x1="45" y1="68" x2="60" y2="80" stroke="#b07e3a" strokeWidth="0.4" opacity="0.15" />

              {/* Large leaf pair — green, offset to top-right */}
              <path d="M110 30 Q130 55 140 80 Q120 62 110 30Z" fill="#2d4c38" opacity="0.22" />
              <path d="M110 130 Q130 105 140 80 Q120 98 110 130Z" fill="#2d4c38" opacity="0.16" />
              <line x1="110" y1="30" x2="140" y2="80" stroke="#2d4c38" strokeWidth="0.8" opacity="0.2" />
              <line x1="110" y1="130" x2="140" y2="80" stroke="#2d4c38" strokeWidth="0.8" opacity="0.2" />

              {/* Small centre dot cluster */}
              <circle cx="80" cy="80" r="2.5" fill="#b07e3a" opacity="0.25" />
              <circle cx="80" cy="80" r="5" fill="none" stroke="#b07e3a" strokeWidth="0.5" opacity="0.1" />
              <circle cx="140" cy="80" r="2" fill="#2d4c38" opacity="0.2" />

              {/* Tiny sprig top-left */}
              <path d="M10 20 Q18 10 26 14 Q18 18 10 20Z" fill="#b07e3a" opacity="0.12" />
              <line x1="10" y1="20" x2="26" y2="14" stroke="#b07e3a" strokeWidth="0.5" opacity="0.15" />

              {/* Tiny sprig bottom-right */}
              <path d="M150 140 Q158 130 166 134 Q158 138 150 140Z" fill="#2d4c38" opacity="0.12" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill="url(#botanicalHero)" />
        </svg>

        {/* Radial centre glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(45,76,56,0.35) 0%, transparent 70%)",
          }}
        />
        {/* Top + bottom vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)",
          }}
        />
        {/* Side vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #0d1510 0%, transparent 20%, transparent 80%, #0d1510 100%)",
          }}
        />

        {/* Hero text */}
        <div className="relative z-10 flex flex-col items-center text-center gap-4 px-6 py-28 md:py-36">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">
            Got Questions?
          </span>
          <h1
            className="font-serif font-black text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(5rem, 14vw, 10rem)" }}
          >
            FAQ
          </h1>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">
            Everything you need to know about our products, orders, and the Naturalist way.
          </p>
        </div>
      </section>

      {/* ── BODY ── */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-20 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-3xl">

          {/* Category pill tabs */}
          <div className="flex flex-wrap gap-2 mb-12">
            {faqs.map((section) => (
              <button
                key={section.category}
                onClick={() => setActiveCategory(section.category)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  activeCategory === section.category
                    ? "bg-[#2d4c38] text-white shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-[#2d4c38] hover:bg-[#2d4c38]/10"
                }`}
              >
                {section.category}
              </button>
            ))}
          </div>

          {/* Active FAQ section */}
          {faqs
            .filter((s) => s.category === activeCategory)
            .map((section) => (
              <div key={section.category} className="animate-fade-in-up">

                {/* Section label */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="h-px flex-1 bg-border/50" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">
                    {section.category}
                  </span>
                  <span className="h-px flex-1 bg-border/50" />
                </div>

                {/* FAQ accordion card */}
                <div className="rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] shadow-sm overflow-hidden divide-y divide-border/30 dark:divide-[#232c26]/60">
                  {section.items.map((item, i) => (
                    <FaqItem key={i} q={item.q} a={item.a} />
                  ))}
                </div>
              </div>
            ))}

          {/* Bottom contact CTA */}
          <div className="mt-14 rounded-3xl bg-[#111a14] px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            {/* subtle pattern echo */}
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
              <p className="text-white font-serif text-xl font-bold leading-snug">We're one message away.</p>
              <p className="text-white/35 text-xs mt-1.5">Our team typically responds within a few hours.</p>
            </div>
            <a
              href="/contact"
              className="relative z-10 flex-shrink-0 flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-8 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Contact Us
            </a>
          </div>

        </div>
      </section>

    </div>
  );
}