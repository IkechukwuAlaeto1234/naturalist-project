"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { ArrowLeft, Loader2, Plus, Minus, ShoppingBag, Check } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description?: string;
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
}

export default function BundleDetailClient({ bundle }: { bundle: Bundle }) {
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      addToCart(
        {
          productId: bundle._id,
          name: bundle.name,
          slug: bundle.slug,
          price: bundle.price,
          image: bundle.images?.[0] || "/placeholder.jpg",
          stock: 99,
          isBundle: true,
        },
        quantity
      );
      setAdding(false);
    }, 600);
  };

  const hasSavings = bundle.compareAtPrice && bundle.compareAtPrice > bundle.price;
  const savingsPercent = hasSavings
    ? Math.round(((bundle.compareAtPrice! - bundle.price) / bundle.compareAtPrice!) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 font-sans pb-32">
      <div className="mx-auto max-w-7xl">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <a
            href="/bundles"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Bundles
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left: Bundle Cover Image */}
          <div className="lg:col-span-6 flex flex-col items-center gap-6 justify-center w-full">
            <div className="relative w-full max-w-[500px] aspect-square rounded-[36px] bg-white dark:bg-[#151c18]/40 border border-white/80 dark:border-white/10 shadow-[0_25px_60px_rgba(20,31,25,0.06),0_0_1px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.95)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
              <Image
                src={bundle.images?.[0] || "/placeholder.jpg"}
                alt={bundle.name}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority
              />
              {hasSavings && (
                <div className="absolute top-6 left-6">
                  <span className="rounded-full bg-[#2d4c38] px-3.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                    Save {savingsPercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Quantity Selector & Add CTA */}
            <div className="w-full max-w-[500px] flex flex-col sm:flex-row gap-4 items-center pt-2">
              <div className="flex items-center border border-[#e2dacd] dark:border-white/10 rounded-full bg-white dark:bg-[#0f1411] p-1 shadow-sm shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-foreground select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="w-full sm:w-auto flex-grow flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.2)] cursor-pointer select-none disabled:opacity-85"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Assembling Ritual...
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    Add Ritual Bundle
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Info, Price & Included Products */}
          <div className="lg:col-span-6 flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b07e3a]">
                Botanical Skincare Ceremony
              </span>
              <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-[#141f19] dark:text-[#f4f6f4] leading-tight">
                {bundle.name}
              </h1>

              {/* Price Display */}
              <div className="flex items-baseline gap-3 mt-2">
                <span className="font-serif text-3xl font-bold text-[#2d4c38] dark:text-emerald-400">
                  {formatPrice(bundle.price)}
                </span>
                {hasSavings && (
                  <>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(bundle.compareAtPrice!)}
                    </span>
                    <span className="text-xs font-bold text-[#b07e3a] uppercase tracking-wider">
                      (Save {formatPrice(bundle.compareAtPrice! - bundle.price)})
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-[#e2dacd]/60 dark:border-white/5 pt-6 flex flex-col gap-4">
              <h3 className="font-serif text-lg font-bold text-foreground">
                Ceremony Description
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bundle.description}
              </p>
            </div>

            {/* Included Products List */}
            <div className="border-t border-[#e2dacd]/60 dark:border-white/5 pt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-foreground">
                  What&apos;s Included
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {bundle.products?.length || 0} Full-Size Formulas
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {bundle.products && bundle.products.length > 0 ? (
                  bundle.products.map((product: Product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/20 hover:border-[#2d4c38]/20 transition-all group"
                    >
                      <div className="relative h-12 w-12 rounded-xl bg-white dark:bg-[#151c18] border border-border/40 overflow-hidden shrink-0">
                        <Image
                          src={product.images?.[0] || "/placeholder.jpg"}
                          alt={product.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-foreground truncate group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors">
                          {product.name}
                        </h4>
                        {product.description && (
                          <p className="text-[11px] text-muted-foreground truncate leading-relaxed mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-[#b07e3a] bg-[#b07e3a]/5 dark:bg-[#b07e3a]/10 border border-[#b07e3a]/20 px-2.5 py-1 rounded-full">
                          Formula Included
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No products cataloged in this ritual bundle.
                  </p>
                )}
              </div>
            </div>

            {/* Ritual Guidelines */}
            <div className="border-t border-[#e2dacd]/60 dark:border-white/5 pt-6 flex flex-col gap-4">
              <h3 className="font-serif text-base font-bold text-foreground">
                Ceremony Highlights
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 shrink-0" />
                  Synergistic product layering
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 shrink-0" />
                  100% wild-harvested actives
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 shrink-0" />
                  Cruelty-free & vegan formulas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 shrink-0" />
                  Sustainably sourced botanicals
                </li>
              </ul>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
