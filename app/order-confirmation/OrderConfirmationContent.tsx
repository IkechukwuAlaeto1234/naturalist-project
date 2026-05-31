"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ShoppingBag, ArrowRight, ShieldCheck, Mail, Calendar } from "lucide-react";
import { useCart } from "../../context/CartContext";

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [mounted, setMounted] = useState(false);

  const orderReference = searchParams.get("reference") || searchParams.get("id") || "NAT-" + Math.floor(100000 + Math.random() * 900000);
  const name = searchParams.get("name") || "customer";

  useEffect(() => {
    setMounted(true);
    // Clear the persistent cart since order was placed successfully
    if (clearCart) {
      clearCart();
    }
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1411] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center pb-32">
      <div className="mx-auto max-w-xl w-full">

        {/* Main Glassmorphic Popup Card */}
        <div className="relative bg-white/90 dark:bg-[#151c18]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_25px_60px_rgba(20,31,25,0.1),0_0_1px_rgba(0,0,0,0.08),inset_0_2px_3px_rgba(255,255,255,0.95)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center flex flex-col items-center justify-center animate-toast-pop">

          {/* Animated botanical-like circular checkmark icon */}
          <div className="h-20 w-20 rounded-full bg-[#f4efe6] dark:bg-[#1e2621] border border-[#b07e3a]/40 flex items-center justify-center mb-6 text-[#2d4c38] dark:text-[#456f54] shadow-[0_4px_12px_rgba(176,126,58,0.12),inset_0_1px_2px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
            <Check className="h-10 w-10 text-[#2d4c38] dark:text-[#456f54] stroke-[2.5]" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-foreground mb-3 leading-tight tracking-tight">
            Order Complete!
          </h1>

          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold text-[#b07e3a] mb-6">
            Thank you, {name}
          </p>

          <p className="text-sm text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed max-w-sm mb-8">
            Your premium skincare ritual is officially underway. We are preparing your botanical formulas with carbon-neutral care.
          </p>

          {/* Details list block */}
          <div className="w-full bg-[#f4efe6]/50 dark:bg-[#1e2621]/20 border border-[#e2dacd]/70 dark:border-white/[0.05] rounded-2xl p-5 mb-8 text-left space-y-4">

            <div className="flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-[#b07e3a] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order Reference</p>
                <p className="text-sm font-serif font-bold text-foreground mt-0.5">{orderId}</p>
                              <p className="text-sm font-serif font-bold text-foreground mt-0.5 break-all">{orderReference}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#b07e3a] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notification Dispatch</p>
                <p className="text-xs text-foreground mt-0.5 font-medium">Invoice and tracking details sent to inbox</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[#b07e3a] flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Dispatch</p>
                <p className="text-xs text-foreground mt-0.5 font-medium">Ships within 24 business hours</p>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Link
              href="/shop"
              className="flex-1 flex h-11 items-center justify-center gap-2 rounded-full border border-[#2d4c38]/40 hover:border-[#b07e3a] text-xs font-bold uppercase tracking-wider text-[#2d4c38] dark:text-white transition-all bg-white/20 hover:bg-[#b07e3a]/10 cursor-pointer select-none"
            >
              Continue Shopping
            </Link>
            <Link
              href="/account"
              className="flex-grow flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer select-none group"
            >
              Go to Profile
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mt-6 justify-center">
            <ShieldCheck className="h-4 w-4 text-[#2d4c38]" />
            Encrypted secure purchase validation verified
          </span>

        </div>

      </div>
    </div>
  );
}

export default function OrderConfirmationContentWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fcfcfb] dark:bg-[#0f1411] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <ShoppingBag className="h-8 w-8 text-primary/40" />
          <p className="text-sm text-muted-foreground uppercase tracking-widest font-semibold">Resolving Order...</p>
        </div>
      </div>
    }>
      <OrderConfirmationContent />
    </Suspense>
  );
}
