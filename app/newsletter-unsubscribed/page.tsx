"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChevronDown, Check, AlertCircle, Loader2 } from "lucide-react";

const SURVEY_REASONS = [
  "I receive too many emails from Naturalist",
  "The content is no longer relevant to me",
  "I never signed up for this newsletter",
  "The emails are not rendering correctly",
  "Other (please specify below)",
];

// How long the button spinner shows before the brand loader + navigation fires
const NAV_DELAY_MS = 300;

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return <Loader2 className={`${className} animate-spin flex-shrink-0`} />;
}

function UnsubscribePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email");

  const [reason, setReason] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [keepLoading, setKeepLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");

  const canUnsubscribe =
    !!reason && !(reason === "Other (please specify below)" && !feedback.trim());

  const handleKeepSubscription = () => {
    setKeepLoading(true);
    const dest = email
      ? `/newsletter-retained?email=${encodeURIComponent(email)}`
      : "/newsletter-retained";
    setTimeout(() => router.push(dest), NAV_DELAY_MS);
  };

  const handleConfirmUnsubscribe = async () => {
    setConfirmLoading(true);
    setError("");
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email?.toLowerCase().trim(),
          reason: reason || "Not specified",
          feedback: feedback.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to unsubscribe");
      }

      const dest = email
        ? `/newsletter-unsubscribe-confirmed?email=${encodeURIComponent(email)}`
        : "/newsletter-unsubscribe-confirmed";

      // Keep spinner going through navigation
      setTimeout(() => router.push(dest), NAV_DELAY_MS);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
      setIsModalOpen(false);
      setConfirmLoading(false);
    }
  };

  const handleCancelModal = () => {
    setCancelLoading(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setCancelLoading(false);
    }, 300);
  };

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

        <div className="space-y-5">
          {/* Dropdown */}
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">
              Why are you unsubscribing?
            </label>
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
                      onClick={() => { setReason(r); setDropdownOpen(false); }}
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

          {/* Other field */}
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

          {/* Optional feedback */}
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
              disabled={keepLoading || confirmLoading}
              className="w-full h-12 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] disabled:opacity-70 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              {keepLoading ? (
                <><Spinner /> Loading...</>
              ) : (
                "Keep My Subscription"
              )}
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              disabled={!canUnsubscribe || keepLoading || confirmLoading}
              className={`w-full h-12 rounded-full border border-border bg-background text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                canUnsubscribe && !keepLoading && !confirmLoading
                  ? "hover:bg-muted cursor-pointer"
                  : "opacity-40 cursor-not-allowed"
              }`}
            >
              Confirm Unsubscribe
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <h3 className="font-serif text-2xl font-black text-foreground mb-3">
              We'll Miss You
            </h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
              Are you sure you want to stop receiving our organic skincare guides, ingredient spotlights, and member discounts?
            </p>
            <div className="space-y-2.5">
              {/* Yes, Unsubscribe */}
              <button
                onClick={handleConfirmUnsubscribe}
                disabled={confirmLoading || cancelLoading}
                className="w-full h-11 rounded-full bg-red-600 hover:bg-red-700 disabled:opacity-70 text-xs font-bold uppercase tracking-widest text-white transition-all flex items-center justify-center gap-2"
              >
                {confirmLoading ? (
                  <><Spinner /> Processing...</>
                ) : (
                  "Yes, Unsubscribe"
                )}
              </button>

              {/* Nevermind */}
              <button
                onClick={handleCancelModal}
                disabled={confirmLoading || cancelLoading}
                className="w-full h-11 rounded-full border border-border bg-background hover:bg-muted disabled:opacity-70 text-xs font-bold uppercase tracking-widest text-foreground transition-all flex items-center justify-center gap-2"
              >
                {cancelLoading ? (
                  <><Spinner className="h-4 w-4 text-muted-foreground" /> Cancelling...</>
                ) : (
                  "Nevermind, Stay Subscribed"
                )}
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
      <Suspense
        fallback={
          <div className="text-center py-12">
            <p className="text-xs uppercase tracking-widest text-muted-foreground animate-pulse">
              Loading Options...
            </p>
          </div>
        }
      >
        <UnsubscribePageContent />
      </Suspense>
    </div>
  );
}
