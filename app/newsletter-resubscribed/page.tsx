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

function ResubscribedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="relative bg-white/95 dark:bg-[#121815]/95 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.04)] text-center flex flex-col items-center max-w-lg w-full animate-in fade-in zoom-in-95 duration-300">
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b07e3a] block mb-6">
        Newsletter
      </span>
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4efe6] dark:bg-emerald-950/20 text-[#b07e3a] mb-6">
        <Heart className="h-8 w-8 fill-current" />
      </div>
      <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
        You're back in!
      </h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-sm">
        We've successfully updated your subscription. You will receive organic skincare guides, ingredient spotlights, and exclusive member offers again
        {email ? (
          <> at <strong className="text-foreground font-semibold">{email}</strong>.</>
        ) : "."}
      </p>
      <div className="w-full space-y-3">
        <NavButton href="/shop" primary icon={<ShoppingBag className="h-4 w-4" />}>
          Return to Store
        </NavButton>
        <NavButton href="/">Go to Homepage</NavButton>
      </div>
    </div>
  );
}

export default function NewsletterResubscribedPage() {
  return (
    <div className="min-h-[85vh] bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }>
        <ResubscribedContent />
      </Suspense>
    </div>
  );
}
