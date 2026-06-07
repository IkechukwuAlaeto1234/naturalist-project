"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Mail, Lock, HelpCircle, Leaf } from "lucide-react";
import ErrorModal from "@/components/ui/ErrorModal";
import SuccessModal from "@/components/ui/SuccessModal";

function LoginContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const nextAuthError = searchParams.get("error");
  const isVerified = searchParams.get("verified") === "true";
  const isReset = searchParams.get("reset") === "true";

  // Redirect already-authenticated users away from the login page
  useEffect(() => {
    if (loading) return;
    if (status === "authenticated" && session?.user) {
      const userEmail = session.user.email?.toLowerCase().trim();
      const userRole = (session.user as any).role;
      if (userEmail === "ikechukwualaeto@gmail.com" || userRole === "admin") {
        router.replace("/admin");
      } else {
        router.replace(callbackUrl);
      }
    }
  }, [status, session, router, callbackUrl, loading]);

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = "Sign In | Naturalist";
    }, 120);

    if (nextAuthError === "CredentialsSignin") {
      setErrorMessage("Invalid email address or passcode sequence. Please try again.");
      setErrorModalOpen(true);
    } else if (nextAuthError) {
      setErrorMessage("An error occurred during authentication. Please try again.");
      setErrorModalOpen(true);
    }

    if (isVerified) {
      setSuccess("Account activated successfully! Please sign in to access your rituals.");
      setSuccessModalOpen(true);
    } else if (isReset) {
      setSuccess("Your password has been reset successfully! Please sign in with your new password.");
      setSuccessModalOpen(true);
    }

    return () => clearTimeout(titleTimeout);
  }, [nextAuthError, isVerified, isReset]);

  // While session is resolving or an authenticated redirect is in-flight,
  // show a spinner so the login form never flashes before the redirect happens.
  if (status === "loading" || (status === "authenticated" && !loading)) {
    return (
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-[#2d4c38]/40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      setErrorModalOpen(true);
      return;
    }

    setLoading(true);
    setSuccess("");

    const startTime = Date.now();

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password: password,
        redirect: false,
      });

      // Enforce 1.5s minimum spinner duration for UX polish
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1500 - elapsed, 0);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      if (res?.error) {
        setLoading(false);
        setErrorMessage("Invalid email or password. Please check your credentials.");
        setErrorModalOpen(true);
        return;
      }

      // Success: verify session then fire brand loader and navigate
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = sessionRes.ok ? await sessionRes.json() : null;
      const userEmail = sessionData?.user?.email?.toLowerCase().trim();
      const userRole = sessionData?.user?.role;
      const targetUrl =
        userEmail === "ikechukwualaeto@gmail.com" || userRole === "admin"
          ? "/admin"
          : callbackUrl;

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("naturalist:navigation-start"));
      }
      window.location.href = targetUrl;
    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(1500 - elapsed, 0);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      // NextAuth sometimes throws on success — verify session before giving up
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData?.user) {
            const userEmail = sessionData.user.email?.toLowerCase().trim();
            const userRole = sessionData.user.role;
            const targetUrl =
              userEmail === "ikechukwualaeto@gmail.com" || userRole === "admin"
                ? "/admin"
                : callbackUrl;
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("naturalist:navigation-start"));
            }
            window.location.href = targetUrl;
            return;
          }
        }
      } catch (_) {}

      setLoading(false);
      setErrorMessage("An unexpected error occurred. Please try again later.");
      setErrorModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1.5">
              <Leaf className="h-3.5 w-3.5 select-none" /> Welcome Back
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              Sign In
            </h1>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs mx-auto">
              Access your personal organic skincare rituals and track your orders.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-muted-foreground" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" /> Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
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
                  Sign In
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/register"
              className="font-semibold text-[#b07e3a] hover:underline cursor-pointer"
            >
              Sign Up
            </a>
          </div>

          {/* Centralized Muted Forgot Password Link */}
          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Forgot Password?
            </a>
          </div>

        </div>

      </div>

      {/* Error modal feedback */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Sign In Failed"
        message={errorMessage}
      />

      {/* Success modal feedback */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("naturalist:navigation-start"));
          }
          router.replace("/login");
        }}
        title="Account Activated"
        message={success}
        actionText="Sign In"
        showCancel={false}
        showClose={false}
        onAction={() => {
          setSuccessModalOpen(false);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("naturalist:navigation-start"));
          }
          router.replace("/login");
        }}
        actionIcon={null}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
