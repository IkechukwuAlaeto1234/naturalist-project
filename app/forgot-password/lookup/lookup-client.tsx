"use client";

import React, { useState, useEffect } from "react";
import { Mail, HelpCircle, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

interface LookupClientProps {
  status?: "not_found" | "invalid" | "expired";
  user?: {
    name: string;
    maskedEmail: string;
    initials?: string;
  };
  refToken?: string;
}

export default function LookupClient({ status: initialStatus, user, refToken }: LookupClientProps) {
  const [status] = useState(initialStatus);
  const [sendLoading, setSendLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  useEffect(() => {
    let title = "Reset Password | Naturalist";
    if (status === "not_found") {
      title = "Profile Not Found | Naturalist";
    } else if (status === "invalid") {
      title = "Invalid Request | Naturalist";
    } else if (status === "expired") {
      title = "Session Expired | Naturalist";
    }
    const t = setTimeout(() => {
      document.title = title;
    }, 120);
    return () => clearTimeout(t);
  }, [status]);

  const goToRoute = (href: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
      setTimeout(() => {
        window.location.href = href;
      }, 50);
    }
  };

  const handleSendPasscode = async () => {
    if (!refToken) return;

    setSendLoading(true);
    const startTime = Date.now();

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref: refToken }),
      });

      const data = await res.json();

      // Enforce 1.5s delay for UX transition feel
      const elapsed = Date.now() - startTime;
      await new Promise((resolve) => setTimeout(resolve, Math.max(1500 - elapsed, 0)));

      setSendLoading(false);

      if (res.ok) {
        setModalMessage("A secure 6-digit reset passcode has been generated and dispatched to your email address.");
        setModalOpen(true);
      } else {
        alert(data.error || "Failed to dispatch recovery passcode. Please try again.");
      }
    } catch (err) {
      setSendLoading(false);
      alert("An unexpected network error occurred. Please try again.");
    }
  };

  const handleEnterPasscodeRedirect = () => {
    setModalOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
    }
    const targetEmail = user?.maskedEmail || "";
    window.location.href = `/reset-password?email=${encodeURIComponent(targetEmail.toLowerCase().trim())}&ref=${encodeURIComponent(refToken || "")}`;
  };

  // Render NOT FOUND / INVALID / EXPIRED state
  if (status === "not_found" || status === "invalid" || status === "expired") {
    let errorMsg = "No registered profile matches the provided email address.";
    let detailsMsg = "No matching botanical accounts were registered. Please verify your email or create a new account to register a profile.";
    
    if (status === "expired") {
      errorMsg = "Recovery Link Expired";
      detailsMsg = "This password reset recovery session has expired (expired after 10 minutes). Please search for your profile again.";
    } else if (status === "invalid") {
      errorMsg = "Invalid Recovery Request";
      detailsMsg = "The recovery parameter is missing or invalid. Please check the URL or start over.";
    }

    return (
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
        <div className="mx-auto max-w-lg w-full">
          <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col text-center items-center">
            
            {/* Header */}
            <div className="text-center mb-8">
              <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1.5 justify-center">
                <AlertCircle className="h-3.5 w-3.5 text-[#b07e3a] stroke-[2.5]" /> Recover Credentials
              </span>
              <h1 className="font-serif text-3xl font-black text-foreground mt-2.5 leading-none tracking-tight">
                Account Not Found
              </h1>
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
                {errorMsg}
              </p>
            </div>

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400 select-none mb-6">
              <AlertCircle className="h-9 w-9 stroke-[2]" />
            </div>
            
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto mb-6">
              {detailsMsg}
            </p>

            <div className="flex flex-col gap-3.5 w-full">
              <button
                type="button"
                onClick={() => goToRoute("/forgot-password")}
                className="w-full flex h-11 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer"
              >
                Try Another Email
              </button>
              <button
                type="button"
                onClick={() => goToRoute("/register")}
                className="w-full flex h-11 items-center justify-center rounded-full border border-border hover:border-foreground/30 text-xs font-bold uppercase tracking-wider text-foreground transition-all bg-transparent cursor-pointer"
              >
                Create Account
              </button>
            </div>

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-border/40 text-center flex justify-center w-full">
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors group cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform select-none" /> Back to Sign In
              </a>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Render FOUND / METHOD SELECTION state
  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
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
              Select a verification method to receive your secure passcode.
            </p>
          </div>

          <div className="space-y-6">
            {/* Redesigned Account Match Preview Block */}
            <div className="relative overflow-hidden flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br from-[#2d4c38]/5 to-[#b07e3a]/5 dark:from-[#151c18]/80 dark:to-[#1a251e]/80 border border-[#b07e3a]/15 dark:border-emerald-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              {/* Background ambient glow behind avatar */}
              <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#b07e3a]/10 dark:bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-[#2d4c38]/10 dark:bg-[#b07e3a]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-[#2d4c38] to-[#3a6349] dark:from-[#1a2e22] dark:to-[#2d4c38] text-white font-serif font-black text-2xl select-none border-2 border-[#b07e3a]/45 shadow-lg shadow-[#2d4c38]/15 dark:shadow-black/40">
                {user?.initials || "U"}
              </div>
              <h4 className="text-base font-serif font-bold text-foreground leading-tight tracking-tight">
                {user?.name}
              </h4>
            </div>

            {/* Reset Methods Option Group */}
            <div className="space-y-3.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-left">
                Verification Methods
              </label>
              
              {/* Method Option: Email (Active) */}
              <label className="group flex items-center justify-between p-4 rounded-2xl border border-[#2d4c38]/40 dark:border-emerald-500/20 bg-[#2d4c38]/5 dark:bg-emerald-500/5 hover:bg-[#2d4c38]/10 dark:hover:bg-emerald-500/10 cursor-pointer transition-all duration-300 select-none shadow-sm shadow-[#2d4c38]/5">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2d4c38]/10 dark:bg-emerald-500/10 text-[#2d4c38] dark:text-emerald-400 group-hover:scale-105 transition-transform duration-300">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-foreground">Send passcode via Email</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{user?.maskedEmail}</p>
                  </div>
                </div>
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#2d4c38] dark:border-emerald-500 bg-background transition-colors duration-300">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#2d4c38] dark:bg-emerald-500" />
                </div>
              </label>

              {/* Method Option: SMS (Disabled) */}
              <label className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background/30 opacity-40 cursor-not-allowed select-none">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-muted-foreground">Send passcode via SMS</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Mobile number not registered</p>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 bg-transparent" />
              </label>

              {/* Method Option: WhatsApp (Disabled) */}
              <label className="flex items-center justify-between p-4 rounded-2xl border border-border bg-background/30 opacity-40 cursor-not-allowed select-none">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-muted-foreground">Send passcode via WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground font-medium mt-0.5">WhatsApp messaging not configured</p>
                  </div>
                </div>
                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 bg-transparent" />
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => goToRoute("/forgot-password")}
                className="flex-1 flex h-11 items-center justify-center rounded-full border border-border hover:border-foreground/30 text-xs font-bold uppercase tracking-wider text-foreground transition-all bg-transparent cursor-pointer select-none"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSendPasscode}
                disabled={sendLoading}
                className="flex-grow flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85"
              >
                {sendLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin select-none" />
                    Sending...
                  </>
                ) : (
                  "Send Passcode"
                )}
              </button>
            </div>
          </div>

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

      {/* ── SUCCESS MODAL (PASSCODE SENT) ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleEnterPasscodeRedirect}
          />

          <div className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-[#b07e3a]/10 dark:border-white/10 bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 animate-modal-slide-in flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-icon-pop animate-pulse">
              <CheckCircle2 className="h-9 w-9 stroke-[2]" />
            </div>

            <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
              Passcode Sent
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
              {modalMessage}
            </p>

            <button
              onClick={handleEnterPasscodeRedirect}
              className="w-full flex h-12 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-[#2d4c38]/10 cursor-pointer"
            >
              Enter Passcode
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
