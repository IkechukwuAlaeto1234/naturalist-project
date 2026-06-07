"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, ShoppingBag, ChevronDown, Check, AlertCircle, Heart } from "lucide-react";

const SURVEY_REASONS = [
  "I receive too many emails from Naturalist",
  "The content is no longer relevant to me",
  "I never signed up for this newsletter",
  "The emails are not rendering correctly",
  "Other (please specify below)"
];

function UnsubscribePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [step, setStep] = useState<"survey" | "success" | "retained">(email ? "survey" : "success");
  const [reason, setReason] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleKeepSubscription = () => {
    setStep("retained");
  };

  const handleConfirmUnsubscribe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email?.toLowerCase().trim(),
          reason: reason || "Not specified",
          feedback: feedback.trim()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unsubscribe");
      }

      setIsModalOpen(false);
      setStep("success");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (step === "retained") {
    return (
      <div className="relative bg-white/90 dark:bg-[#121815]/90 backdrop-blur-xl border border-[#2d4c38]/10 rounded-[32px] p-8 sm:p-12 shadow-[0_20px_60px_rgba(45,76,56,0.05)] text-center flex flex-col items-center max-w-lg w-full transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-[#2d4c38] mb-6 animate-bounce">
          <Heart className="h-10 w-10 fill-current" />
        </div>

        <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
          We're Thrilled You're Staying!
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md">
          Thank you for giving us another chance. Your subscription is still active, and we promise to keep delivering only our finest, pure organic skincare rituals and exclusive subscriber offers.
        </p>

        <div className="w-full space-y-3">
          <Link
            href="/shop"
            className="flex w-full h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none"
          >
            <ShoppingBag className="h-4 w-4" /> Explore Botanical Remedies
          </Link>
          <Link
            href="/"
            className="flex w-full h-12 items-center justify-center gap-2 rounded-full border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest text-foreground transition-all cursor-pointer select-none"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] text-center flex flex-col items-center max-w-md w-full transition-all duration-500 animate-in fade-in zoom-in-95">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f4efe6] dark:bg-emerald-950/20 text-[#b07e3a] mb-6">
          <Mail className="h-8 w-8 stroke-[1.5]" />
        </div>

        <h1 className="font-serif text-3xl font-black text-foreground mb-4 leading-tight tracking-tight">
          You're Unsubscribed
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {email 
            ? `We've successfully removed ${email} from our newsletter list. You will no longer receive marketing emails or product updates from us.`
            : "We've removed your email address from our newsletter list. You will no longer receive marketing emails or product updates from us."
          } We're sorry to see you go!
        </p>

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
      </div>
    );
  }

  return (
    <>
      <div className="relative bg-white/95 dark:bg-[#121815]/95 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_30px_70px_rgba(0,0,0,0.04)] text-left flex flex-col max-w-lg w-full transition-all duration-300">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#b07e3a] block mb-2">
            Newsletter Options
          </span>
          <h1 className="font-serif text-3xl font-black text-foreground leading-tight tracking-tight">
            Wait, Before You Go...
          </h1>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            We are sad to see you leave our circle. Let us know if we can improve your inbox experience or if you'd like to rethink your subscription.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-start gap-3 text-red-700 dark:text-red-400 text-xs">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Survey Form */}
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
              Why are you unsubscribing?
            </label>
            
            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full h-12 px-4 rounded-xl border border-border bg-background text-left text-xs font-medium flex items-center justify-between hover:border-[#2d4c38] focus:outline-none focus:border-[#2d4c38] transition-all cursor-pointer"
              >
                <span className={reason ? "text-foreground font-semibold" : "text-muted-foreground"}>
                  {reason || "Select a reason..."}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-300 ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute z-10 mt-1.5 w-full bg-background border border-border rounded-xl shadow-lg overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in-50 slide-in-from-top-2">
                  {SURVEY_REASONS.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setReason(r);
                        setDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-xs hover:bg-[#f4efe6] dark:hover:bg-emerald-950/20 text-foreground transition-colors flex items-center justify-between"
                    >
                      <span>{r}</span>
                      {reason === r && <Check className="h-4 w-4 text-[#b07e3a]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Conditional "Other" specification field */}
          {reason === "Other (please specify below)" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                Please specify <span className="text-red-500">*</span>
              </label>
              <textarea
                autoFocus
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what prompted you to leave..."
                className="w-full h-24 p-4 rounded-xl border border-[#2d4c38] bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/20 transition-all resize-none placeholder-muted-foreground"
              />
            </div>
          )}

          {/* Optional general comments for all other reasons */}
          {reason && reason !== "Other (please specify below)" && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
                Any comments or feedback? (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Help us craft a better experience..."
                className="w-full h-24 p-4 rounded-xl border border-border bg-background text-xs font-medium focus:outline-none focus:border-[#2d4c38] transition-all resize-none placeholder-muted-foreground"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <button
              onClick={handleKeepSubscription}
              className="w-full h-12 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              Keep My Subscription
            </button>
            
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!reason || (reason === "Other (please specify below)" && !feedback.trim())}
              className={`w-full h-12 rounded-full border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !reason || (reason === "Other (please specify below)" && !feedback.trim()) ? "opacity-40 cursor-not-allowed" : ""
              }`}
            >
              Confirm Unsubscribe
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <h3 className="font-serif text-2xl font-black text-foreground mb-3">
              We'll Miss You
            </h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to stop receiving our organic skincare guides, ingredient spotlights, and member discounts?
            </p>
            
            <div className="space-y-2.5">
              <button
                onClick={handleConfirmUnsubscribe}
                disabled={loading}
                className="w-full h-11 rounded-full bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center"
              >
                {loading ? "Processing..." : "Yes, Unsubscribe"}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full h-11 rounded-full border border-border bg-background hover:bg-muted text-xs font-bold uppercase tracking-widest text-foreground transition-all"
              >
                Nevermind, Stay Subscribed
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-[85vh] bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <Suspense fallback={
        <div className="text-center py-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">Loading Options...</p>
        </div>
      }>
        <UnsubscribePageContent />
      </Suspense>
    </div>
  );
}
