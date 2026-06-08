"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Mail, ArrowLeft, ShoppingBag, Loader2 } from "lucide-react";

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

function UnsubscribeConfirmedContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] text-center flex flex-col items-center max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4efe6] dark:bg-emerald-950/20 text-[#b07e3a] mb-6">
        <Mail className="h-8 w-8 stroke-[1.5]" />
      </div>
      <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
        You're Unsubscribed
      </h1>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        {email ? (
          <>
            We've successfully removed <strong className="text-foreground">{email}</strong> from our newsletter list. You will no longer receive marketing emails or product updates from us.
          </>
        ) : (
          "We've removed your email address from our newsletter list. You will no longer receive marketing emails or product updates from us."
        )}{" "}
        We're sorry to see you go!
      </p>
      <div className="w-full space-y-3">
        <NavButton href="/shop" primary icon={<ShoppingBag className="h-4 w-4" />}>
          Continue Shopping
        </NavButton>
        <NavButton href="/" icon={<ArrowLeft className="h-4 w-4" />}>
          Go to Homepage
        </NavButton>
      </div>
    </div>
  );
}

export default function NewsletterUnsubscribeConfirmedPage() {
  return (
    <div className="min-h-[85vh] bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Loading...</p>
        </div>
      }>
        <UnsubscribeConfirmedContent />
      </Suspense>
    </div>
  );
}
