"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ShoppingBag, ArrowLeft, Loader2, Sparkles, Droplet, Heart, ChevronRight, Plus, Minus } from "lucide-react";
import { useToast } from "@/context/ToastContext";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  benefits?: string[];
  ingredients?: string[];
  usage?: string;
}

export default function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const { slug } = use(params);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // activeTab state removed for vertical editorial rows

  useEffect(() => {
    let titleTimeout: NodeJS.Timeout;
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${slug}`);
        if (!res.ok) throw new Error("Product not found");
        const data = await res.json();
        setProduct(data);
        titleTimeout = setTimeout(() => {
          document.title = `${data.name} | Naturalist`;
        }, 300);
      } catch (err) {
        console.error("Failed to fetch product details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    return () => {
      if (titleTimeout) clearTimeout(titleTimeout);
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Unveiling botanical formula...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0f1411] flex flex-col items-center justify-center p-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/60" />
          <h2 className="font-serif text-xl font-bold">Formula Not Found</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This botanical recipe does not exist or has been removed from our catalog.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md"
          >
            Return to Shop
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    setAdding(true);
    setTimeout(() => {
      addToCart({
        productId: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images[0] || "/placeholder.jpg",
        stock: product.stock,
        isBundle: false,
      }, quantity);
      setAdding(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 font-sans pb-32">
      <div className="mx-auto max-w-7xl">
        
        {/* Breadcrumb Header */}
        <div className="mb-8">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Shop
          </Link>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Product Image (raised, floating beveled 3D look) & Actions */}
          <div className="lg:col-span-6 flex flex-col items-center gap-6 justify-center w-full">
            <div className="relative w-full max-w-[500px] aspect-square rounded-[36px] bg-white dark:bg-[#151c18]/40 border border-white/80 dark:border-white/10 shadow-[0_25px_60px_rgba(20,31,25,0.06),0_0_1px_rgba(0,0,0,0.1),inset_0_2px_4px_rgba(255,255,255,0.95)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden w-full">
              <Image
                src={product.images[0] || "/placeholder.jpg"}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 500px"
                className="object-cover"
                priority
              />
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
                {product.category}
              </span>
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-tight mt-3">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 pb-5 border-b border-[#e2dacd]/60 dark:border-white/[0.05]">
              <span className="font-serif text-3xl font-bold text-[#2d4c38] dark:text-white">
                ${product.price.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                TAX CALCULATED NEXT
              </span>
            </div>

            {/* Core Description */}
            <p className="text-sm text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed">
              {product.description}
            </p>



            {/* Sequential Details Panel (Benefits, Ingredients, Usage) */}
            <div className="flex flex-col gap-6 mt-4 pt-6 border-t border-[#e2dacd]/60 dark:border-white/[0.05]">
              
              {/* Benefits */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Key Benefits
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed pl-1">
                  {product.benefits && product.benefits.length > 0 ? (
                    product.benefits.map((benefit, i) => (
                      <li key={i} className="flex gap-2 items-start">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] mt-1.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))
                  ) : (
                    <li className="italic text-muted-foreground/60">No specific benefits listed. Nourishes and cleanses naturally.</li>
                  )}
                </ul>
              </div>

              <div className="h-px bg-[#e2dacd]/60 dark:bg-white/[0.05]" />

              {/* Ingredients */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Botanical Ingredients
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {product.ingredients && product.ingredients.length > 0 ? (
                    product.ingredients.map((ing, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 rounded-xl border border-[#e2dacd]/70 dark:border-white/[0.05] bg-[#fcfcfb] dark:bg-[#0f1411] text-foreground/80 font-medium"
                      >
                        {ing}
                      </span>
                    ))
                  ) : (
                    <span className="italic text-muted-foreground/60 text-xs">100% natural organic recipe elements.</span>
                  )}
                </div>
              </div>

              <div className="h-px bg-[#e2dacd]/60 dark:bg-white/[0.05]" />

              {/* Application Ceremony / Ritual */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white font-sans">
                  Application Ceremony
                </div>
                <p className="text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed">
                  {product.usage || "Apply 2-3 drops onto freshly cleansed face. Massaging gently in upward circular motions until fully absorbed. Best used every morning and evening before rest."}
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
