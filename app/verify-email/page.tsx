"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = "Verify Email | Naturalist";
    }, 120);
    if (!email) {
      setError("No email address provided. Please return to the registration screen.");
    }
    return () => clearTimeout(titleTimeout);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      setError("Please enter the complete 6-digit passcode.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Verification failed. Please try again.");
      }

      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login?verified=true");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) return;

    setResending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to resend passcode.");
      }

      setSuccess("A new 6-digit passcode has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Could not resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
              <span className="material-icons text-[11px]">verified_user</span> Verification Required
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              Verify Email
            </h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
              We've dispatched a one-time passcode to <strong>{email || "your inbox"}</strong>. Please enter the 6-digit code below.
            </p>
          </div>

          {/* Feedback banners */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-2.5 text-xs text-destructive font-semibold">
              <span className="material-icons text-sm select-none mt-0.5">error_outline</span>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#2d4c38]/10 border border-[#2d4c38]/20 rounded-2xl flex items-start gap-2.5 text-xs text-[#2d4c38] dark:text-emerald-400 font-semibold">
              <span className="material-icons text-sm select-none mt-0.5">check_circle_outline</span>
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col gap-1.5 items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground self-start flex items-center gap-1.5 mb-1.5">
                <span className="material-icons select-none" style={{ fontSize: "12px" }}>lock</span> Enter 6-Digit Passcode
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="px-6 py-4 text-2xl tracking-[0.4em] font-serif font-black rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all text-center w-full max-w-[240px] placeholder:text-muted-foreground/30 placeholder:tracking-normal"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-icons animate-spin select-none" style={{ fontSize: "14px" }}>cached</span>
                  Verifying...
                </>
              ) : (
                <>
                  Verify Account <span className="material-icons select-none" style={{ fontSize: "14px" }}>check_circle</span>
                </>
              )}
            </button>
          </form>

          {/* Resend Passcode Options */}
          <div className="relative mt-8 pt-6 border-t border-border/40 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
            >
              <span className="material-icons group-hover:-translate-x-0.5 transition-transform" style={{ fontSize: "12px" }}>arrow_back</span> Back
            </Link>
            <button
              type="button"
              disabled={resending || !email}
              onClick={handleResendOtp}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] hover:underline disabled:opacity-50 disabled:no-underline cursor-pointer"
            >
              <span className="material-icons text-xs">cached</span> {resending ? "Resending..." : "Resend Passcode"}
            </button>
          </div>

        </div>

      </div>
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
