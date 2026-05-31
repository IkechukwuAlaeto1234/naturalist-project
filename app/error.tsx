"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to a service monitor if in production
    console.error("Runtime exception intercepted:", error);
    // Set document title with a 100ms timeout to ensure it triggers after Next.js metadata is applied
    const titleTimeout = setTimeout(() => {
      document.title = "System Error | Naturalist";
    }, 100);
    return () => clearTimeout(titleTimeout);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#fcfcfb] dark:bg-[#0a0d0b] px-6 text-center">
      <div className="max-w-md flex flex-col items-center gap-6 animate-fade-in-up">
        
        {/* Warning Icon representation */}
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertOctagon className="h-8 w-8 animate-pulse" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-widest text-[#b07e3a]">
          Botanical Disturbance
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-foreground leading-tight">
          Ritual Interrupted
        </h1>

        <p className="text-sm text-muted-foreground leading-relaxed">
          An unexpected server disturbance has occurred. Our caretakers are restoring harmony. You may attempt to retry the ritual or head back.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full mt-4 justify-center">
          <button
            onClick={() => reset()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:opacity-95 shadow-sm transition-all cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            Retry Ritual
          </button>
          <Link
            href="/"
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border px-6 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-all"
          >
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </div>

      </div>
    </div>
  );
}
