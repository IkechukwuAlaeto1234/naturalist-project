"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, HelpCircle, ArrowLeft, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";

const VERIFY_PHASES = [
  { title: "Securing Connection", msg: "Establishing secure registry link..." },
  { title: "Consulting Archives", msg: "Querying botanical account records..." },
  { title: "Verifying Identity", msg: "Validating account credentials..." },
  { title: "Finalizing Session", msg: "Generating secure recovery passcode..." },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Custom Unified Verification Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<"verifying" | "exists" | "missing">("verifying");
  const [modalErrorMessage, setModalErrorMessage] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(0);

  const goToRoute = (href: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
      setTimeout(() => {
        window.location.href = href;
      }, 50);
    }
  };

  // Reset page state on mount to prevent history cache modal popups
  useEffect(() => {
    setEmail("");
    setLoading(false);
    setModalOpen(false);
    setModalStatus("verifying");
    setModalErrorMessage("");
    setPhaseIndex(0);
    
    const titleTimeout = setTimeout(() => {
      document.title = "Forgot Password | Naturalist";
    }, 120);
    return () => clearTimeout(titleTimeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setModalErrorMessage("Please enter a valid email address.");
      setModalStatus("missing");
      setModalOpen(true);
      return;
    }

    setLoading(true);
    setModalStatus("verifying");
    setPhaseIndex(0);
    setModalOpen(true);

    // Dynamic phase loader steps (cycles every 1200ms during 4.8s)
    const phaseInterval = setInterval(() => {
      setPhaseIndex((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    const startTime = Date.now();
    let apiSuccess = false;
    let apiErrorMsg = "";

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        apiSuccess = true;
      } else {
        apiErrorMsg = data.error || "Failed to initiate password reset request.";
      }
    } catch (err: any) {
      apiErrorMsg = "An unexpected network error occurred. Please try again.";
    }

    // Enjoyable timing: exactly 4.8 seconds (4 phases * 1.2 seconds)
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(4800 - elapsed, 0);
    await new Promise((resolve) => setTimeout(resolve, remaining));
    clearInterval(phaseInterval);

    setLoading(false);

    if (apiSuccess) {
      setModalStatus("exists");
    } else {
      setModalStatus("missing");
      setModalErrorMessage(apiErrorMsg);
    }
  };

  const handleEnterPasscode = () => {
    // Show the brand loader instantly and load up directly
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
    }
    window.location.href = `/reset-password?email=${encodeURIComponent(email.toLowerCase().trim())}`;
  };

  const handleCloseMissingModal = () => {
    setModalOpen(false);
    setTimeout(() => {
      emailInputRef.current?.focus();
    }, 200);
  };


  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Premium Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1.5 justify-center">
              <HelpCircle className="h-3.5 w-3.5 text-[#b07e3a] stroke-[2.5]" /> Recover Credentials
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2.5 leading-none tracking-tight">
              Reset Password
            </h1>
            <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
              Provide your account email address. We will verify your credentials and send a secure 6-digit passcode to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email Address
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
                  <RefreshCw className="h-3.5 w-3.5 animate-spin select-none" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Send Passcode <Send className="h-3.5 w-3.5 select-none" />
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center flex justify-center">
            <a
              href="/login"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors group cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform select-none" /> Back to Sign In
            </a>
          </div>

        </div>

      </div>

      {/* ── STATE-OF-THE-ART UNIFIED VERIFICATION MODAL ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={modalStatus !== "verifying" ? handleCloseMissingModal : undefined}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-[#b07e3a]/10 dark:border-white/10 bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 animate-modal-slide-in flex flex-col items-center text-center">
            
            {/* Status 1: Verifying Spinner (Miniature Brand Loader) */}
            {modalStatus === "verifying" && (
              <div className="flex flex-col items-center py-4 w-full">
                {/* Mini Brand Loader Animation */}
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center animate-pulse">
                  <div className="lds-ring scale-[0.6] origin-center">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                  </div>
                </div>

                <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
                  {VERIFY_PHASES[phaseIndex]?.title || "Verifying Profile"}
                </h3>
                {/* Container with fixed min-height to absolutely prevent text-wrapping layout jumps */}
                <div className="min-h-[24px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground leading-none whitespace-nowrap">
                    {VERIFY_PHASES[phaseIndex]?.msg || "Analyzing credentials..."}
                  </p>
                </div>
              </div>
            )}

            {/* Status 2: Profile Found Success Flow */}
            {modalStatus === "exists" && (
              <div className="flex flex-col items-center w-full">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-icon-pop">
                  <CheckCircle2 className="h-9 w-9 stroke-[2]" />
                </div>

                <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
                  Account Verified
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
                  A secure 6-digit reset passcode has been generated and dispatched to your email address.
                </p>

                <button
                  onClick={handleEnterPasscode}
                  className="w-full flex h-12 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-[#2d4c38]/10 cursor-pointer"
                >
                  Enter Passcode
                </button>
              </div>
            )}

            {/* Status 3: Profile Missing Error Flow */}
            {modalStatus === "missing" && (
              <div className="flex flex-col items-center w-full">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/10 text-destructive dark:text-red-400 animate-icon-pop">
                  <AlertCircle className="h-9 w-9 stroke-[2]" />
                </div>

                <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
                  Recovery Failed
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
                  {modalErrorMessage || "The email address you entered is not registered in our records."}
                </p>

                <button
                  onClick={handleCloseMissingModal}
                  className="w-full flex h-12 items-center justify-center rounded-full bg-destructive hover:bg-destructive/90 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-destructive/10 cursor-pointer"
                >
                  Try Another Email
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
