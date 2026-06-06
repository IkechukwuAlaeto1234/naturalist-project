"use client";

import React from "react";
import Link from "next/link";
import { Mail, ArrowLeft, ShoppingBag } from "lucide-react";

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-[80vh] bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-md w-full">
        {/* Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center flex flex-col items-center">
          
          {/* Icon */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4efe6] dark:bg-emerald-950/20 text-[#b07e3a] mb-6">
            <Mail className="h-8 w-8 stroke-[1.5]" />
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
            You're Unsubscribed
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            We've removed your email address from our newsletter list. You will no longer receive marketing emails or product updates from us. We're sorry to see you go!
          </p>

          {/* Action Buttons */}
          <div className="w-full space-y-3">
            <Link
              href="/shop"
              className="flex w-full h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none"
            >
              <ShoppingBag className="h-4 w-4" /> Continue Shopping
            </Link>

            <Link
              href="/"
              className="flex w-full h-12 items-center justify-center gap-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest text-foreground transition-all cursor-pointer select-none"
            >
              <ArrowLeft className="h-4 w-4" /> Go to Homepage
            </Link>
          </div>

          {/* Small Footer Text */}
          <div className="mt-8 pt-6 border-t border-border/40 w-full text-[10px] uppercase tracking-widest text-muted-foreground">
            Naturalist Co. Ltd.
          </div>
        </div>
      </div>
    </div>
  );
}
