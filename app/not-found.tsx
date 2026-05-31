import React from "react";
import Link from "next/link";
import { Compass, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | Naturalist",
  description: "The page you are looking for has migrated or does not exist.",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#fcfcfb] dark:bg-[#0a0d0b] px-6 text-center">
      <div className="max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
        
        {/* Editorial Icon representation */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary dark:bg-emerald-500/10 dark:text-emerald-400">
          <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "10s" }} />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#b07e3a]">
          404 Error
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Page Not Found
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          The page you are looking for has migrated or does not exist. Let us guide you back to our active collection.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4 justify-center">
          <Link
            href="/"
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-95 shadow-sm transition-all"
          >
            Return to Garden
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/shop"
            className="flex h-12 items-center justify-center rounded-xl border border-border px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-all"
          >
            Explore Rituals
          </Link>
        </div>

      </div>
    </div>
  );
}
