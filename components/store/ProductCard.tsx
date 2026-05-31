"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

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
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/30 bg-card transition-all duration-300 hover:border-border/80 hover:shadow-lg hover:translate-y-[-4px]">
      
      {/* Image Spotlight Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={product.images[0] || "/placeholder.jpg"}
          alt={product.name}
          fill
          sizes="(max-width: 7xl) 33vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
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
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/40 gap-4">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-primary font-serif">
              ${product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-muted-foreground line-through">
                ${product.compareAtPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {/* View Formula Detail Link */}
          <Link
            href={`/shop/${product.slug}`}
            className="inline-flex h-9 px-4 items-center justify-center rounded-full bg-primary hover:bg-[#b07e3a] text-primary-foreground hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all duration-300 shadow-sm cursor-pointer select-none"
          >
            View Formula
          </Link>
        </div>
      </div>
    </div>
  );
}
