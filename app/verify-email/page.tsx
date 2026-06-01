"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Pencil, RefreshCw, Shield } from "lucide-react";
import ErrorModal from "@/components/ui/ErrorModal";
import SuccessModal from "@/components/ui/SuccessModal";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

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
    if (!email) {
      setErrorMessage("No email address provided. Please return to the registration screen.");
      setErrorModalOpen(true);
    }
    return () => clearTimeout(titleTimeout);
  }, [email]);

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setErrorModalOpen(true);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    if (!email) return;

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
            <Link
              href="/register"
              className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer"
              aria-label="Back to Registration"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
              <Shield className="h-3 w-3 stroke-[2.5]" /> Verification Required
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              We just sent an email
            </h1>
            <p className="text-xs text-muted-foreground mt-3.5 leading-relaxed max-w-xs mx-auto flex items-center justify-center gap-1.5">
              Enter the security code we sent to <strong className="text-foreground">{email || "your email"}</strong>
              <Link
                href="/register"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#b07e3a]/10 hover:bg-[#b07e3a]/20 text-[#b07e3a] transition-all"
                title="Edit Email"
              >
                <Pencil className="h-3 w-3" />
              </Link>
            </p>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 4 Digit Boxes Layout */}
            <div className="flex justify-center gap-3.5 py-2">
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

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                <>
                  Verify Account <span className="material-icons select-none" style={{ fontSize: "14px" }}>check_circle</span>
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

      {/* Error modal feedback */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Verification Failed"
        message={errorMessage}
      />

      {/* Success modal feedback */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          if (success.includes("verified")) {
            router.push("/login?verified=true");
          }
        }}
        title={success.includes("verified") ? "Verification Successful" : "Passcode Sent"}
        message={success}
        actionText={success.includes("verified") ? "Go to Login" : "Continue"}
        showCancel={false}
        onAction={() => {
          setSuccessModalOpen(false);
          if (success.includes("verified")) {
            router.push("/login?verified=true");
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
        <div className="animate-pulse flex flex-col items-center gap-4">
          <span className="material-icons animate-spin text-3xl text-primary/40">cached</span>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Loading Page...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
