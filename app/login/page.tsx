"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginContent() {
  const router = useRouter();
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

  const handleGoogleSignIn = () => {
    setError("");
    setSuccess("");
    signIn("google", { callbackUrl });
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

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-grow border-t border-border/40" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 select-none">
              Or continue with
            </span>
            <div className="flex-grow border-t border-border/40" />
          </div>

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full flex h-12 items-center justify-center gap-3 rounded-full border border-border/70 bg-white hover:bg-muted text-xs font-bold uppercase tracking-widest text-foreground transition-all shadow-sm cursor-pointer select-none"
          >
            {/* Colorful custom Google icon logo graphic SVG */}
            <svg className="h-4 w-4" viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign In with Google
          </button>

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
