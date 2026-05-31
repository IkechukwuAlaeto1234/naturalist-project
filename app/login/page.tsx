"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const nextAuthError = searchParams.get("error");
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "true";

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = "Sign In | Naturalist";
    }, 120);

    if (nextAuthError === "CredentialsSignin") {
      setError("Invalid email address or passcode sequence. Please try again.");
    } else if (nextAuthError) {
      setError("An error occurred during authentication. Please try again.");
    }

    if (isVerified) {
      setSuccess("Account activated successfully! Please sign in to access your rituals.");
    } else if (isReset) {
      setSuccess("Your password has been reset successfully! Please sign in with your new password.");
    }

    return () => clearTimeout(titleTimeout);
  }, [nextAuthError, isVerified, isReset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please check your credentials.");
      } else {
        // Successful login
        setSuccess("Successfully signed in! Redirecting...");
        setTimeout(() => {
          router.push(callbackUrl);
        }, 800);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
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
              <span className="material-icons text-[11px]">spa</span> Welcome Back
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              Sign In
            </h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
              Access your personal organic skincare rituals and track your orders.
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

          {/* Forms */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="material-icons select-none" style={{ fontSize: "12px" }}>mail</span> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-5 py-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="material-icons select-none" style={{ fontSize: "12px" }}>lock</span> Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="px-5 py-3 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
            >
            {loading ? (
                <>
                  <span className="material-icons animate-spin select-none" style={{ fontSize: "14px" }}>cached</span>
                  Verifying...
                </>
              ) : (
                <>
                  Sign In <span className="material-icons select-none" style={{ fontSize: "14px" }}>login</span>
                </>
              )}
            </button>
          </form>

          {/* Social sign-in removed per configuration */}

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#b07e3a] hover:underline"
            >
              Sign Up
            </Link>
          </div>

          {/* Centralized Muted Forgot Password Link */}
          <div className="mt-4 text-center">
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors"
            >
              <span className="material-icons select-none" style={{ fontSize: "12px" }}>help_outline</span> Forgot Password?
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <span className="material-icons animate-spin text-3xl text-primary/40">cached</span>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Loading Form...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
