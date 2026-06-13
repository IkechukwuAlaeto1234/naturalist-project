"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import { X, Plus, Minus, Trash2, ArrowRight, Loader2, ShoppingBag } from "lucide-react";

export default function CartPanel() {
  const router = useRouter();
  const {
    cartItems,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
  } = useCart();
  const { formatPrice } = useCurrency();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckoutClick = () => {
    setCheckingOut(true);
    setTimeout(() => {
      const token = "chk_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem("naturalist_checkout_token", token);
      window.dispatchEvent(new Event("naturalist:navigation-start"));
      setIsCartOpen(false);
      router.push(`/checkout?token=${token}`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-modal="true" role="dialog">
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in"
      />

      <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md transform bg-card shadow-2xl border-l border-border/40 flex flex-col h-full animate-slide-in-right">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground font-serif">Your Skincare Ritual</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="rounded-full h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Your cart is empty</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                    Nourish your skin. Add botanical cleansers and serums to your daily ritual.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 text-xs font-semibold uppercase tracking-wider text-primary border-b-2 border-primary/40 hover:border-primary pb-0.5 transition-all"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-3 rounded-xl border border-border/30 bg-muted/30 hover:border-border/60 transition-colors"
                >
                  {/* Image */}
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted border border-border/20">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground truncate leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.isBundle ? "Ritual Set" : "Single Product"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {/* Quantity Toggles */}
                      <div className="flex items-center border border-border/60 rounded-lg bg-card p-0.5 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          data-tooltip="Decrease"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                          data-tooltip="Increase"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Pricing / Remove */}
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-primary">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-muted-foreground/60 hover:text-destructive transition-colors p-1 rounded-md"
                          data-tooltip="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer checkout card */}
          {cartItems.length > 0 && (
            <div className="border-t border-border/50 bg-muted/20 px-6 py-6 space-y-4">
              <div className="flex items-center justify-between text-base font-medium">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-lg font-bold text-primary font-serif">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-normal">
                Shipping, taxes, and promotional discounts calculated at checkout.
              </p>
              
              <button
                onClick={handleCheckoutClick}
                disabled={checkingOut}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-semibold tracking-wide text-primary-foreground hover:opacity-95 disabled:opacity-50 transition-all shadow-md mt-2"
              >
                {checkingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
