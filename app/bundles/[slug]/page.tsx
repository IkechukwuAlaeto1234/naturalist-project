"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ArrowLeft, Loader2, Sparkles, Droplet, Heart, ChevronRight, Plus, Minus, Package } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
}

interface Bundle {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  products: Product[];
  isActive: boolean;
}

export default function BundleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // activeTab state removed for vertical editorial rows

  useEffect(() => {
    let titleTimeout: NodeJS.Timeout;
    const fetchBundle = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bundles/${slug}`);
        if (!res.ok) throw new Error("Bundle not found");
        const data = await res.json();
        setBundle(data);
        titleTimeout = setTimeout(() => {
          document.title = `${data.name} | Naturalist`;
        }, 300);
      } catch (err) {
        console.error("Failed to fetch bundle details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBundle();
    return () => {
      if (titleTimeout) clearTimeout(titleTimeout);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Assembling premium curation...</p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <Package className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="font-serif text-xl font-bold">Curation Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This curated skincare ritual bundle does not exist or has been removed.
          </p>
          <Link
            href="/bundles"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md"
          >
            Return to Bundles
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      addToCart({
        productId: bundle._id,
        name: bundle.name,
        slug: bundle.slug,
        price: bundle.price,
        image: bundle.images[0] || "/placeholder.jpg",
        stock: 99,
        isBundle: true,
      }, quantity);
      setAdding(false);
    }, 600);
  };

  const hasDiscount = bundle.compareAtPrice && bundle.compareAtPrice > bundle.price;
  const savings = hasDiscount ? bundle.compareAtPrice! - bundle.price : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 font-sans pb-32">
      <div className="mx-auto max-w-7xl">
        
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <Link
            href="/bundles"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Bundles
          </Link>
        </div>

        {/* Curation Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Curation Image & Actions */}
          <div className="lg:col-span-6 flex flex-col items-center gap-6 justify-center w-full">
            <div className="relative w-full max-w-[500px] aspect-square rounded-[36px] bg-white dark:bg-[#151c18]/40 border border-white/80 dark:border-white/10 shadow-[0_25px_60px_rgba(20,31,25,0.06),inset_0_2px_4px_rgba(255,255,255,0.95)] overflow-hidden w-full">
              <Image
                src={bundle.images[0] || "/placeholder.jpg"}
                alt={bundle.name}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority
              />
              {hasDiscount && (
                <div className="absolute top-6 left-6 bg-[#b07e3a] text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-md animate-pulse">
                  Save ${savings.toFixed(0)}
                </div>
              )}
            </div>
            
            {/* Quantity and Add To Cart Controls */}
            <div className="w-full max-w-[500px] flex flex-col sm:flex-row gap-4 items-center pt-2">
              {/* Quantity controller */}
              <div className="flex items-center border border-[#e2dacd] dark:border-white/10 rounded-full bg-white dark:bg-[#0f1411] p-1 shadow-sm shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-foreground select-none">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full sm:w-auto flex-grow flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.2)] cursor-pointer select-none disabled:opacity-85"
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Add to Cart
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Descriptions & Details */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* Category / Badge */}
            <div>
              <span className="inline-flex px-3 py-1 rounded-full bg-[#f4efe6] dark:bg-[#1e2621] border border-[#b07e3a]/30 text-[10px] font-bold uppercase tracking-wider text-[#b07e3a]">
                EXCLUSIVE CEREMONY
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-tight mt-3">
                {bundle.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-5 border-b border-[#e2dacd]/60 dark:border-white/[0.05]">
              <span className="font-serif text-3xl font-bold text-[#2d4c38] dark:text-white">
                ${bundle.price.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through font-medium">
                  ${bundle.compareAtPrice!.toFixed(2)}
                </span>
              )}
              <span className="text-[10px] font-bold text-[#b07e3a] uppercase tracking-widest bg-[#b07e3a]/10 px-2 py-0.5 rounded ml-2">
                COMPLETE SET DISCOUNT
              </span>
            </div>

            {/* Core Description */}
            <p className="text-sm text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed">
              {bundle.description}
            </p>

            {/* Action buttons moved to left column under curation image */}

            {/* Sequential Details Panel (Included Formulae, Ceremony Flow, Clean Guarantee) */}
            <div className="flex flex-col gap-6 mt-4 pt-6 border-t border-[#e2dacd]/60 dark:border-white/[0.05]">
              
              {/* Included Formulae */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Included Formulae
                </div>
                <div className="grid grid-cols-1 gap-3.5 pl-1">
                  {bundle.products && bundle.products.length > 0 ? (
                    bundle.products.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center gap-4 p-3 rounded-2xl border border-border/40 bg-white/50 dark:bg-[#0a0d0b]/40 hover:border-primary/20 transition-all"
                      >
                        <div className="relative h-12 w-12 rounded-xl bg-muted overflow-hidden border border-border/30 flex-shrink-0">
                          <Image
                            src={item.images[0] || "/placeholder.jpg"}
                            alt={item.name}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-serif text-sm font-bold text-foreground truncate">{item.name}</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                        </div>
                        <Link
                          href={`/shop/${item.slug}`}
                          className="text-[10px] font-bold text-[#b07e3a] uppercase hover:underline shrink-0 px-2"
                        >
                          Explore
                        </Link>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-muted-foreground/60 text-xs">No separate formulas listed.</p>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#e2dacd]/60 dark:bg-white/[0.05]" />

              {/* Ceremony Flow */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Ceremony Flow
                </div>
                <p className="text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed">
                  Begin by cleansing gently to clear away daily impurities. Apply the restorative toners to awaken and refresh the dermis. Conclude by massaging 3-4 drops of active serums and moisturisers to lock in active cellular elements. Repeat every morning and evening as a natural dedication to self.
                </p>
              </div>

              <div className="h-px bg-[#e2dacd]/60 dark:bg-white/[0.05]" />

              {/* Clean Guarantee */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Clean Guarantee
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed pl-1">
                  {[
                    "100% Certified Clean & Organic botanicals",
                    "Traceable supply chain sourced ethically from organic cooperatives",
                    "Third-party clinically tested for high dermal cellular compatibility",
                    "Recyclable gold-accented amber glass containers",
                  ].map((g, i) => (
                    <li key={i} className="flex gap-2 items-start">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] mt-1.5 flex-shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
