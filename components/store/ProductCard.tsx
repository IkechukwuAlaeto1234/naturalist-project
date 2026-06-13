"use client";

import React from "react";
import Image from "next/image";
import { useCurrency } from "@/context/CurrencyContext";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    category: string;
    stock: number;
    isBundle?: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { formatPrice } = useCurrency();
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/30 bg-card card-premium-hover">

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={product.images[0] || "/placeholder.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 7xl) 33vw, 50vw"
          className="object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
        />
        {/* Category Tag */}
        <span className="absolute left-4 top-4 rounded-full bg-white/95 dark:bg-zinc-950/95 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm">
          {product.category}
        </span>
        {hasDiscount && (
          <span className="absolute right-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-sm">
            Save
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </div>

        {/* Action / Pricing footer */}
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40 gap-3">

          {/* Price stacked — current on top, strikethrough below — never truncates */}
          <div className="flex flex-col gap-0.5">
            <span className="text-base font-bold text-primary font-serif whitespace-nowrap">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through whitespace-nowrap">
                {formatPrice(product.compareAtPrice!)}
              </span>
            )}
          </div>

          <a
            href={`/shop/${product.slug}`}
            className="inline-flex h-9 px-4 items-center justify-center rounded-full bg-primary hover:bg-[#b07e3a] text-primary-foreground hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer select-none btn-shimmer active:scale-95 whitespace-nowrap flex-shrink-0"
          >
            View Formula
          </a>
        </div>
      </div>
    </div>
  );
}
