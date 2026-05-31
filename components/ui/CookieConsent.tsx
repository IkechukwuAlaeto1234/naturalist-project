"use client";

import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";

type ConsentState = "initial" | "undecided" | "saving" | "exiting" | "accepted" | "rejected" | "hidden";

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [consentState, setConsentState] = useState<ConsentState>("initial");

  useEffect(() => {
    setMounted(true);
    const savedConsent = localStorage.getItem("naturalist_cookie_consent");

    if (savedConsent) {
      setConsentState("hidden");
    } else {
      // 800ms delayed entry after mount so user sees page settle first
      const timer = setTimeout(() => {
        setConsentState("undecided");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!mounted || consentState === "hidden" || consentState === "initial") return null;

  const handleAccept = () => {
    setConsentState("saving");
    // 1.2s loading state
    setTimeout(() => {
      // Transition to exiting (slides down out of viewport)
      setConsentState("exiting");
      localStorage.setItem("naturalist_cookie_consent", "accepted");

      // After the slide-down animation completes (400ms), mount and pop the success toast
      setTimeout(() => {
        setConsentState("accepted");

        // Success toast stays visible for 2.5s before fading out
        setTimeout(() => {
          setConsentState("hidden");
        }, 2500);
      }, 400);
    }, 1200);
  };

  const handleReject = () => {
    setConsentState("exiting");
    localStorage.setItem("naturalist_cookie_consent", "rejected");
    setTimeout(() => {
      setConsentState("hidden");
    }, 400);
  };

  const animationClass = consentState === "exiting" ? "animate-slide-out-down" : "animate-fade-in-up";

  return (
    <>
      {/* ── Main Cookie Banner Card ── */}
      {(consentState === "undecided" || consentState === "saving" || consentState === "exiting") && (
        <div
          className={`fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:max-w-md z-50 bg-white/90 dark:bg-[#0f1411]/90 backdrop-blur-2xl border border-white/85 dark:border-white/10 rounded-[28px] p-6 md:p-7 shadow-[0_15px_50px_rgba(20,31,25,0.12),0_0_1px_rgba(0,0,0,0.08),inset_0_2px_3px_rgba(255,255,255,0.95)] dark:shadow-[0_15px_50px_rgba(0,0,0,0.3),0_0_1px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.15)] ${animationClass}`}
          role="dialog"
          aria-labelledby="cookie-title"
          aria-describedby="cookie-desc"
        >
          {/* Gold Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#b07e3a] to-transparent rounded-t-3xl pointer-events-none" />

          {/* Heading */}
          <h2
            id="cookie-title"
            className="font-serif text-xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] mb-3"
          >
            We value your privacy
          </h2>

          {/* Body Text */}
          <div
            id="cookie-desc"
            className="text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed mb-6"
          >
            <p className="mb-2.5">
              We use cookies to enhance your browsing experience, serve personalised ads or content, and analyse our traffic. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
            </p>
            <p>
              Our custom botanical recipes and skincare guides utilize subtle local caching and standard session diagnostics to guarantee secure, high-speed, and seamless order dispatching. You can reject unnecessary cookies, or accept to experience Naturalist at its absolute peak.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleReject}
              disabled={consentState === "saving" || consentState === "exiting"}
              className="px-5 py-2.5 rounded-full border border-[#2d4c38]/30 hover:border-[#b07e3a] text-[#2d4c38] dark:text-[#f4f6f4] text-[11px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject All
            </button>
            <button
              onClick={handleAccept}
              disabled={consentState === "saving" || consentState === "exiting"}
              className="group relative flex min-w-[120px] items-center justify-center h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#b07e3a] text-white text-[11px] font-bold uppercase tracking-wider transition-all duration-300 shadow-[0_2px_12px_rgba(45,76,56,0.25)] hover:shadow-[0_2px_16px_rgba(176,126,58,0.2)] cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {consentState === "saving" ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : (
                <span>Accept All</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Beautiful Center Confirmation Popup ── */}
      {consentState === "accepted" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blurred overlay backdrop to highlight the success popup */}
          <div className="absolute inset-0 bg-[#141f19]/35 dark:bg-[#000000]/50 backdrop-blur-[2px] animate-fade-in" />
          
          <div
            className="relative z-10 w-full max-w-[400px] bg-white/90 dark:bg-[#0f1411]/90 backdrop-blur-2xl border border-white/80 dark:border-white/10 p-8 rounded-[32px] shadow-[0_25px_60px_rgba(20,31,25,0.15),0_0_1px_rgba(0,0,0,0.1),inset_0_2px_3px_rgba(255,255,255,0.95)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.4),0_0_1px_rgba(255,255,255,0.15),inset_0_1px_1px_rgba(255,255,255,0.15)] text-center flex flex-col items-center justify-center animate-toast-pop"
            role="alert"
            aria-live="assertive"
          >
            {/* Animated botanical-like circular checkmark icon */}
            <div className="h-16 w-16 rounded-full bg-[#f4efe6] dark:bg-[#1e2621] border border-[#b07e3a]/40 flex items-center justify-center mb-5 text-[#2d4c38] dark:text-[#456f54] shadow-[0_4px_12px_rgba(176,126,58,0.12),inset_0_1px_2px_rgba(255,255,255,0.9)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
              <Check className="h-7 w-7 text-[#2d4c38] dark:text-[#456f54] stroke-[2.5]" />
            </div>

            {/* Title */}
            <h3 className="font-serif text-xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] mb-2.5">
              Consent Saved!
            </h3>

            {/* Micro message */}
            <p className="text-xs text-[#5e6f64] dark:text-[#a3b2a9] leading-relaxed max-w-[280px]">
              Enjoy a seamless, fully optimized premium organic experience with Naturalist.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
