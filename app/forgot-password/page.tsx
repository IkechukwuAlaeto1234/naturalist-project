"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, HelpCircle, ArrowLeft, RefreshCw } from "lucide-react";

function ForgotPasswordContent() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  useEffect(() => {
    const t = setTimeout(() => {
      document.title = "Find Your Account | Naturalist";
    }, 120);
    emailInputRef.current?.focus();
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      // Invalid format — go straight to not-found
      window.location.href = `/forgot-password/lookup?status=not_found${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      return;
    }

    setLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/auth/forgot-password/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      const data = res.ok ? await res.json() : null;

      // Enforce 300ms minimum so the spinner feels intentional
      const elapsed = Date.now() - startTime;
      await new Promise((r) => setTimeout(r, Math.max(300 - elapsed, 0)));

      if (res.ok && data?.success && data?.token) {
        // Account found — navigate to the lookup page with the signed token
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("naturalist:navigation-start"));
        }
        window.location.href = `/forgot-password/lookup?ref=${encodeURIComponent(data.token)}${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      } else {
        // No account — show the not-found state on the lookup page
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("naturalist:navigation-start"));
        }
        window.location.href = `/forgot-password/lookup?status=not_found${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("naturalist:navigation-start"));
      }
      window.location.href = `/forgot-password/lookup?status=not_found${callbackUrl ? `&callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">

        {/* Card */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">

          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1.5 justify-center">
              <HelpCircle className="h-3.5 w-3.5 stroke-[2.5]" /> Recover Credentials
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2.5 leading-none tracking-tight">
              Find Your Account
            </h1>
            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
              Enter your registered email address and we'll look up your botanical profile.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3" /> Email Address
              </label>
              <input
                ref={emailInputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground w-full font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search Profile"
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center flex justify-center">
            <a
              href={`/login${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors group cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Sign In
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
