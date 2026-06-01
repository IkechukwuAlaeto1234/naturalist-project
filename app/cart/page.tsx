"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShieldCheck, Truck, RotateCcw } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
  } = useCart();
  const [mounted, setMounted] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    const mountedTimer = setTimeout(() => setMounted(true), 0);
    const titleTimeout = setTimeout(() => {
      document.title = "Shopping Cart | Naturalist";
    }, 120);
    return () => {
      clearTimeout(mountedTimer);
      clearTimeout(titleTimeout);
    };
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShoppingBag className="h-8 w-8 text-primary/40" />
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Loading Ritual...</p>
        </div>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete);
      setItemToDelete(null);
    }
  };

  const finalTotal = cartSubtotal;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-12 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="mx-auto max-w-5xl">
        
        {/* Breadcrumb / Title */}
        <div className="mb-10">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors mb-3 group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Continue Shopping
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black text-[#141f19] dark:text-[#f4f6f4] tracking-tight leading-none mt-2">
              Your Cart
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-2.5">
              {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"} in Cart
            </p>
          </div>
        </div>

        {cartItems.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-[#151c18]/30 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] shadow-[0_8px_30px_rgba(20,31,25,0.03)] max-w-2xl mx-auto gap-5 p-8 animate-fade-in-up">
            <div className="h-20 w-20 rounded-full bg-[#f4efe6] dark:bg-[#1e2621] border border-[#b07e3a]/40 flex items-center justify-center text-[#2d4c38] dark:text-[#456f54] shadow-sm">
              <ShoppingBag className="h-10 w-10 text-[#2d4c38] dark:text-[#456f54]" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground">Your cart is empty</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-sm leading-relaxed">
                Nourish your skin. Add botanical cleansers, restorative tonics, and sets to your daily ritual.
              </p>
            </div>
            <Link
              href="/shop"
              className="mt-2 inline-flex items-center justify-center h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md select-none cursor-pointer"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          /* Main Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Cart items */}
            <div className="lg:col-span-8 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 p-4 rounded-3xl border border-[#e2dacd] dark:border-white/[0.08] bg-white dark:bg-[#151c18]/30 hover:border-[#b07e3a]/40 dark:hover:border-white/20 transition-all shadow-[0_4px_20px_rgba(20,31,25,0.02)] relative"
                >
                  {/* Image wrapper */}
                  <div className="relative h-24 w-24 sm:h-28 sm:w-28 flex-shrink-0 overflow-hidden rounded-2xl bg-[#f4efe6] dark:bg-[#1e2621] border border-[#e2dacd]/60 dark:border-white/[0.08] shadow-sm">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 w-full min-w-0 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground leading-tight">
                          {item.name}
                        </h3>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-[#f4efe6] dark:bg-[#1e2621] border border-[#b07e3a]/30 text-[9px] font-bold uppercase tracking-wider text-[#b07e3a]">
                          {item.isBundle ? "Ritual Set" : "Botanical Single"}
                        </span>
                      </div>
                      
                      {/* Price (Desktop) */}
                      <span className="hidden sm:inline text-lg font-bold text-[#2d4c38] dark:text-[#f4f6f4] font-serif leading-none shrink-0">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#e2dacd]/40 dark:border-white/[0.05] gap-4">
                      {/* Quantity Controller */}
                      <div className="flex items-center border border-[#e2dacd] dark:border-white/10 rounded-full bg-white dark:bg-[#0f1411] p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Pricing / Remove row */}
                      <div className="flex items-center gap-4">
                        <span className="text-base font-bold text-[#2d4c38] dark:text-[#f4f6f4] font-serif sm:hidden">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <span className="hidden sm:inline text-base font-bold text-[#b07e3a] font-serif">
                          Subtotal: ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => setItemToDelete(item.id)}
                          className="h-8 w-8 rounded-full border border-red-500/20 hover:border-red-500 hover:bg-red-500/5 text-red-500/60 hover:text-red-500 flex items-center justify-center transition-all duration-300 cursor-pointer shadow-sm"
                          data-tooltip="Remove Item"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Trust assurances block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
                {[
                  { icon: ShieldCheck, title: "100% Organic Recipes", desc: "Eco-certified clean botanical skincare" },
                  { icon: Truck, title: "Carbon Neutral Delivery", desc: "Free standard shipping over $75" },
                  { icon: RotateCcw, title: "30-Day Ritual Return", desc: "No-questions exchange and full refunds" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 p-4 rounded-2xl border border-[#e2dacd]/70 dark:border-white/[0.06] bg-white/50 dark:bg-[#151c18]/10 items-start">
                    <Icon className="h-5 w-5 text-[#b07e3a] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-foreground leading-normal">{title}</h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Floating Order Summary */}
            <div className="lg:col-span-4 lg:sticky lg:top-28">
              <div className="relative bg-white/90 dark:bg-[#151c18]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[32px] p-6 sm:p-7 shadow-[0_15px_50px_rgba(20,31,25,0.06),inset_0_2px_3px_rgba(255,255,255,0.95)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col gap-6">

                <h3 className="font-serif text-xl font-bold tracking-tight text-foreground">
                  Order Summary
                </h3>

                {/* Subtotals list */}
                <div className="space-y-3.5 text-sm border-b border-[#e2dacd]/60 dark:border-white/[0.05] pb-5">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Ritual Subtotal</span>
                    <span className="font-semibold text-foreground">${cartSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b07e3a]">
                      {cartSubtotal >= 75 ? "Free Shipping" : "$9.00"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Estimated Tax</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/60">Calculated Next</span>
                  </div>
                </div>

                {/* Final Total */}
                <div className="flex items-center justify-between text-base font-semibold pt-1">
                  <span className="text-foreground">Total Ritual Price</span>
                  <span className="text-xl font-bold text-[#2d4c38] dark:text-white font-serif">
                    ${(finalTotal + (cartSubtotal >= 75 ? 0 : 9)).toFixed(2)}
                  </span>
                </div>

                {/* Secure Checkout Button */}
                <button
                  onClick={() => router.push("/checkout")}
                  className="w-full flex h-12 items-center justify-center gap-2.5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-widest text-white transition-all duration-300 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.2)] cursor-pointer select-none shrink-0"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-full max-w-[14px]" />
                </button>
                
                <p className="text-[10px] text-center text-muted-foreground mt-1">
                  By clicking, you accept our standard Shipping & Return policies.
                </p>

              </div>
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-toast-pop">
          <div className="relative bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-[28px] p-6 max-w-sm w-full text-center shadow-2xl flex flex-col items-center gap-4">
            
            <h3 className="font-serif text-lg font-bold text-foreground mt-2">
              Remove from Cart?
            </h3>
            
            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to remove this botanical formula from your cart?
            </p>
            
            <div className="flex gap-3 w-full mt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-full border border-border/80 hover:border-foreground text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Keep It
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
