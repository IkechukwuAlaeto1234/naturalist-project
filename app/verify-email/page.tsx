"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Pencil, RefreshCw, Shield, Mail, Key, CheckCircle2 } from "lucide-react";
import ErrorModal from "@/components/ui/ErrorModal";
import SuccessModal from "@/components/ui/SuccessModal";

function VerifyEmailContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromQuery);
  const [isEmailEditable, setIsEmailEditable] = useState(!emailFromQuery);

  // 4 characters alphanumeric OTP fields
  const [otpFields, setOtpFields] = useState<string[]>(["", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [resendTimer, setResendTimer] = useState(59);

  // Error modal state
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const goToRoute = (href: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
      setTimeout(() => {
        window.location.href = href;
      }, 50);
    }
  };

  // Global Authenticated Guard: Redirect if already logged in
  useEffect(() => {
    if (status === "authenticated") {
      goToRoute("/");
    }
  }, [status]);

  // Countdown timer effect
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = "Verify Email | Naturalist";
    }, 120);
    return () => clearTimeout(titleTimeout);
  }, []);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setErrorModalOpen(true);
  };

  // Google-Style Restart on failure
  const handleRestart = () => {
    setErrorModalOpen(false);
    setOtpFields(["", "", "", ""]);
    if (emailFromQuery) {
      goToRoute("/register?step=1");
    } else {
      setIsEmailEditable(true);
      setEmail("");
    }
  };

  // Handle OTP Inputs
  const handleOtpChange = (index: number, val: string) => {
    const newVal = val.toUpperCase().slice(-1); // alphanumeric, force uppercase, take last char
    const newFields = [...otpFields];
    newFields[index] = newVal;
    setOtpFields(newFields);

    // Shift focus forward if entered a character
    if (newVal && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpFields[index] && index > 0) {
      // Shift focus backward
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().slice(0, 4).toUpperCase();
    const newFields = [...otpFields];
    for (let i = 0; i < 4; i++) {
      if (pasteData[i]) {
        newFields[i] = pasteData[i];
      }
    }
    setOtpFields(newFields);
    // Focus the last populated field or the last box
    const focusIndex = Math.min(pasteData.length, 3);
    otpRefs[focusIndex].current?.focus();
  };

  // Auto-Focus First Empty OTP Input on Container Click
  const handleOtpContainerClick = () => {
    const firstEmptyIdx = otpFields.findIndex((f) => !f);
    const targetIdx = firstEmptyIdx === -1 ? 3 : firstEmptyIdx;
    otpRefs[targetIdx].current?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      triggerError("Please enter a valid email address.");
      return;
    }
    const otpCode = otpFields.join("").trim();
    if (otpCode.length !== 4) {
      triggerError("Please enter the complete 4-character passcode.");
      return;
    }

    setLoading(true);
    setSuccess("");

    const startTime = Date.now();

    try {
      if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
        // Simulated premium verification delay
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(1500 - elapsed, 0);
        await new Promise((resolve) => setTimeout(resolve, remaining));
        setLoading(false);

        setSuccess("Account verified successfully! Redirecting to login...");
        setSuccessModalOpen(true);
        return;
      }

      // Real backend request
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otpCode,
        }),
      });

      const data = await res.json();

      // Enforce 1.5s delay
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1500 - elapsed, 0);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      setLoading(false);

      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please try again.");
      }

      setSuccess("Account verified successfully! Redirecting to login...");
      setSuccessModalOpen(true);
    } catch (err: any) {
      setLoading(false);
      triggerError(err.message || "An unexpected error occurred. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!email.trim()) {
      triggerError("Please enter an email address before resending.");
      return;
    }

    setResending(true);
    setSuccess("");

    try {
      if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setResending(false);
        setSuccess("A new passcode has been generated (Simulation Mode).");
        setSuccessModalOpen(true);
        setResendTimer(59);
        setOtpFields(["", "", "", ""]);
        otpRefs[0].current?.focus();
        return;
      }

      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await res.json();

      setResending(false);

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend passcode.");
      }

      setSuccess("A new 4-character passcode has been sent to your email.");
      setSuccessModalOpen(true);
      setResendTimer(59);
      setOtpFields(["", "", "", ""]);
      otpRefs[0].current?.focus();
    } catch (err: any) {
      setResending(false);
      triggerError(err.message || "Could not resend code. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8 relative">
            <a
              href="/register"
              className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              aria-label="Back to Registration"
            >
              <ArrowLeft className="h-4 w-4" />
            </a>
            
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
              <Shield className="h-3 w-3 stroke-[2.5]" /> Verification Required
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              Account Verification
            </h1>

            {!isEmailEditable ? (
              <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed max-w-xs mx-auto flex items-center justify-center gap-1.5">
                Enter the security code we sent to <strong className="text-foreground">{email}</strong>
                <button
                  type="button"
                  onClick={() => setIsEmailEditable(true)}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#b07e3a]/10 hover:bg-[#b07e3a]/20 text-[#b07e3a] transition-all cursor-pointer"
                  title="Edit Email"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
                Enter your email address and verification code below.
              </p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {isEmailEditable && (
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground w-full"
                />
              </div>
            )}

            {/* 4 Digit Boxes Layout */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-muted-foreground" /> Verification Code
              </label>
              <div
                onClick={handleOtpContainerClick}
                className="flex justify-center gap-3.5 py-2 cursor-text"
              >
                {otpFields.map((field, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    maxLength={1}
                    value={field}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={idx === 0 ? handleOtpPaste : undefined}
                    placeholder="•"
                    className="w-14 h-14 text-xl font-bold font-serif uppercase rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#b07e3a] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all text-center placeholder:text-muted-foreground/30 text-foreground"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Account <CheckCircle2 className="h-4 w-4 select-none" />
                </>
              )}
            </button>
          </form>

          {/* Resend Options with countdown */}
          <div className="text-center text-xs text-muted-foreground pt-6 mt-6 border-t border-border/40">
            Didn't receive code?{" "}
            {resendTimer > 0 ? (
              <span className="font-semibold text-foreground">
                Resend - 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
              </span>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={resending || !email}
                className="font-bold text-[#b07e3a] hover:underline cursor-pointer"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            )}
          </div>

        </div>

      </div>

      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Verification Failed"
        message={errorMessage}
        actionText="Try Again"
      />

      {/* Success modal feedback */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          if (success.includes("verified")) {
            goToRoute("/login?verified=true");
          }
        }}
        title={success.includes("verified") ? "Verification Successful" : "Passcode Sent"}
        message={success}
        actionText={success.includes("verified") ? "Go to Login" : "Continue"}
        showCancel={false}
        showClose={false}
        onAction={() => {
          setSuccessModalOpen(false);
          if (success.includes("verified")) {
            goToRoute("/login?verified=true");
          }
        }}
        actionIcon={null}
      />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
