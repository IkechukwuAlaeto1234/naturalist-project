"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShoppingBag, Heart, Loader2 } from "lucide-react";

const NAV_DELAY_MS = 300;

function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />;
}

function NavButton({
  href,
  primary,
  icon,
  children,
}: {
  href: string;
  primary?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => router.push(href), NAV_DELAY_MS);
  };

  return (
    <button
      disabled={loading}
      onClick={handleClick}
      className={`w-full h-12 rounded-full text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 cursor-pointer select-none disabled:opacity-70 ${
        primary
          ? "bg-[#2d4c38] hover:bg-[#3a6349] text-white shadow-md"
          : "border border-border bg-background hover:bg-muted text-foreground"
      }`}
    >
      {loading ? <Spinner /> : icon}
      {loading ? "Loading..." : children}
    </button>
  );
}

function RetainedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="relative bg-white/90 dark:bg-[#121815]/90 backdrop-blur-xl border border-[#2d4c38]/10 rounded-[32px] p-8 sm:p-12 shadow-[0_20px_60px_rgba(45,76,56,0.05)] text-center flex flex-col items-center max-w-lg w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#2d4c38] mb-6">
        <Heart className="h-10 w-10 fill-current" />
      </div>
      <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
        We're Thrilled You're Staying!
      </h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md">
        Thank you for giving us another chance. Your subscription is still active, and we promise to keep delivering only our finest, pure organic skincare rituals and exclusive subscriber offers.
        {email && <> We'll keep sending to <strong className="text-foreground">{email}</strong>.</>}
      </p>
      <div className="w-full space-y-3">
        <NavButton href="/shop" primary icon={<ShoppingBag className="h-4 w-4" />}>
          Explore Botanical Remedies
        </NavButton>
        <NavButton href="/">Go to Homepage</NavButton>
      </div>
    </div>
  );
}

export default function NewsletterRetainedPage() {
  return (
    <div className="min-h-[85vh] bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }>
        <RetainedContent />
      </Suspense>
    </div>
  );
}
