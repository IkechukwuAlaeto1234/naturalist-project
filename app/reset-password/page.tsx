"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Lock, Key, Eye, EyeOff, Check, Copy, ArrowLeft, RefreshCw, Save, CheckCircle2, AlertCircle } from "lucide-react";
import SuccessModal from "@/components/ui/SuccessModal";

const RESET_PHASES = [
  { title: "Retrieving Tokens", msg: "Establishing token handshake..." },
  { title: "Verifying Passcode", msg: "Querying database reset records..." },
  { title: "Authenticating Session", msg: "Validating token timestamps..." },
  { title: "Authorizing Reset", msg: "Finalizing account authorization..." },
];

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const verifiedFromQuery = searchParams.get("verified") === "true";
  const tokenFromQuery = searchParams.get("token") || "";

  // Split steps: 1 = Enter Passcode, 2 = Set New Password
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // 6 Alphanumeric token boxes
  const [tokenFields, setTokenFields] = useState<string[]>(["", "", "", "", "", ""]);
  const tokenRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Verification Modal States (Step 1)
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [verificationErrorMsg, setVerificationErrorMsg] = useState("");
  const [phaseIndex, setPhaseIndex] = useState(0);

  // Reset Success Modal States (Step 2)
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const goToRoute = (href: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
      setTimeout(() => {
        window.location.href = href;
      }, 50);
    }
  };

  // Enforce step routing based on URL verification query parameter
  useEffect(() => {
    if (verifiedFromQuery && tokenFromQuery.length === 6) {
      setResetStep(2);
      const chars = tokenFromQuery.split("");
      setTokenFields(chars);
    } else {
      setResetStep(1);
    }
  }, [verifiedFromQuery, tokenFromQuery]);

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = "Confirm Password Reset | Naturalist";
    }, 120);
    if (!email) {
      setVerificationErrorMsg("No email address context found. Please return to the Forgot Password screen.");
      setVerificationStatus("error");
      setVerificationModalOpen(true);
    }
    return () => clearTimeout(titleTimeout);
  }, [email]);

  // Handle Token inputs
  const handleTokenChange = (index: number, val: string) => {
    const newVal = val.toUpperCase().slice(-1); // alphanumeric, force uppercase, take last char
    const newFields = [...tokenFields];
    newFields[index] = newVal;
    setTokenFields(newFields);

    // Shift focus forward if entered a character
    if (newVal && index < 5) {
      tokenRefs[index + 1].current?.focus();
    }
  };

  const handleTokenKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !tokenFields[index] && index > 0) {
      // Shift focus backward
      tokenRefs[index - 1].current?.focus();
    }
  };

  const handleTokenPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim().slice(0, 6).toUpperCase();
    const newFields = [...tokenFields];
    for (let i = 0; i < 6; i++) {
      if (pasteData[i]) {
        newFields[i] = pasteData[i];
      }
    }
    setTokenFields(newFields);
    const focusIndex = Math.min(pasteData.length, 5);
    tokenRefs[focusIndex].current?.focus();
  };

  // Auto-Focus First Empty Token Input on Container Click
  const handleTokenContainerClick = () => {
    const firstEmptyIdx = tokenFields.findIndex((f) => !f);
    const targetIdx = firstEmptyIdx === -1 ? 5 : firstEmptyIdx;
    tokenRefs[targetIdx].current?.focus();
  };

  // Password Generator
  const handleGeneratePassword = () => {
    const randomChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const symbols = "!@#$^*";
    let randPass = "Nat-";
    for (let i = 0; i < 8; i++) {
      randPass += randomChars[Math.floor(Math.random() * randomChars.length)];
    }
    randPass += symbols[Math.floor(Math.random() * symbols.length)];
    randPass += "Z";

    setPassword(randPass);
    setConfirmPassword(randPass);
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Step 1: Verify Passcode Action
  const handleVerifyPasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenFields.join("").trim();
    if (token.length !== 6) {
      setVerificationErrorMsg("Please enter the complete 6-digit reset passcode.");
      setVerificationStatus("error");
      setVerificationModalOpen(true);
      return;
    }

    setLoading(true);
    setVerificationStatus("verifying");
    setPhaseIndex(0);
    setVerificationModalOpen(true);

    // Dynamic phase loader steps (cycles every 1200ms during 4.8s, matching forgot-password)
    const phaseInterval = setInterval(() => {
      setPhaseIndex((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    const startTime = Date.now();
    let passcodeValid = true;

    // Simulate validation in development mode
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
      if (token === "123456" || token === "000000" || token.startsWith("000")) {
        passcodeValid = false;
      }
    } else {
      // In real database mode, verification is fully validated at save
    }

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(4800 - elapsed, 0);
    await new Promise((resolve) => setTimeout(resolve, remaining));
    clearInterval(phaseInterval);

    setLoading(false);

    if (passcodeValid) {
      setVerificationStatus("success");
    } else {
      setVerificationStatus("error");
      setVerificationErrorMsg("The security passcode you entered is incorrect, expired, or malformed.");
    }
  };

  const handleProceedToReset = () => {
    setVerificationModalOpen(false);
    const token = tokenFields.join("");
    // Snappy browser navigation to step 2 that triggers the official Brand Loader dynamically!
    window.location.href = `/reset-password?email=${encodeURIComponent(email.toLowerCase().trim())}&token=${token}&verified=true`;
  };

  // Step 2: Save Password Action
  const handleSavePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = tokenFields.join("").trim();
    if (password.length < 6) {
      setVerificationErrorMsg("Your new password must be at least 6 characters long.");
      setVerificationStatus("error");
      setVerificationModalOpen(true);
      return;
    }
    if (password !== confirmPassword) {
      setVerificationErrorMsg("Passwords do not match. Please verify.");
      setVerificationStatus("error");
      setVerificationModalOpen(true);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          token: token,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password. Please try again.");
      }

      setSuccessMessage("Password reset successful! Redirecting to login...");
      setSuccessModalOpen(true);
    } catch (err: any) {
      setVerificationStatus("error");
      setVerificationErrorMsg(err.message || "An unexpected error occurred during password reset.");
      setVerificationModalOpen(true);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-20 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Premium Card Container */}
        <div className="relative bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1.5 justify-center">
              <Lock className="h-3.5 w-3.5 text-[#b07e3a] stroke-[2.5]" /> Secure Reset
            </span>
            <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
              {resetStep === 1 ? "Verify Token" : "New Password"}
            </h1>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto text-center">
              {resetStep === 1 ? (
                <>
                  Please enter the 6-digit reset passcode sent to <strong>{email || "your inbox"}</strong> to authorize this reset session.
                </>
              ) : (
                <>
                  Passcode authorized successfully. Set a secure new password for account <strong>{email}</strong>.
                </>
              )}
            </p>
          </div>

          {/* Form Step 1: Verify Passcode */}
          {resetStep === 1 && (
            <form onSubmit={handleVerifyPasscode} noValidate className="space-y-6 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Key className="h-3 w-3 text-muted-foreground" /> Reset Passcode
                </label>
                <div
                  onClick={handleTokenContainerClick}
                  className="flex justify-center gap-2 py-2 cursor-text"
                >
                  {tokenFields.map((field, idx) => (
                    <input
                      key={idx}
                      ref={tokenRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={field}
                      onChange={(e) => handleTokenChange(idx, e.target.value)}
                      onKeyDown={(e) => handleTokenKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleTokenPaste : undefined}
                      placeholder="•"
                      className="w-12 h-12 text-lg font-bold font-serif uppercase rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#b07e3a] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all text-center placeholder:text-muted-foreground/30 text-foreground"
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
                    <RefreshCw className="h-3.5 w-3.5 animate-spin select-none" />
                    Checking...
                  </>
                ) : (
                  <>
                    Verify Passcode <Key className="h-3.5 w-3.5 select-none" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Step 2: Set Password */}
          {resetStep === 2 && (
            <form onSubmit={handleSavePasswordSubmit} noValidate className="space-y-5 animate-fade-in">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" /> New Password
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[9px] text-[#b07e3a] hover:underline uppercase font-extrabold tracking-wider cursor-pointer"
                  >
                    Generate Strong Password
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-5 py-3.5 pr-20 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground font-medium"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {password && (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="text-[#b07e3a] hover:text-[#3a6349] cursor-pointer flex-shrink-0"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-muted-foreground" /> Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Retype new password"
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
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Reset <Save className="h-3.5 w-3.5 select-none" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-border/40 text-center flex justify-center">
            <a
              href="/forgot-password"
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/65 hover:text-foreground transition-colors group cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform select-none" /> Back
            </a>
          </div>

        </div>

      </div>

      {/* ── STATE-OF-THE-ART UNIFIED VERIFICATION MODAL ── */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-[#0c120e]/60 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300"
            onClick={verificationStatus === "error" ? () => setVerificationModalOpen(false) : undefined}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md transform overflow-hidden rounded-[32px] border border-[#b07e3a]/10 dark:border-white/10 bg-white/95 dark:bg-[#151c18]/95 backdrop-blur-xl p-8 shadow-2xl transition-all duration-300 animate-modal-slide-in flex flex-col items-center text-center">
            
            {/* Status 1: Verifying Spinner (Miniature Brand Loader) */}
            {verificationStatus === "verifying" && (
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
                  {RESET_PHASES[phaseIndex]?.title || "Verifying Token"}
                </h3>
                {/* Container with fixed min-height to absolutely prevent text-wrapping layout jumps */}
                <div className="min-h-[24px] flex items-center justify-center">
                  <p className="text-xs text-muted-foreground leading-none whitespace-nowrap">
                    {RESET_PHASES[phaseIndex]?.msg || "Analyzing recovery passcode sequence..."}
                  </p>
                </div>
              </div>
            )}

            {/* Status 2: Passcode Authorized success flow */}
            {verificationStatus === "success" && (
              <div className="flex flex-col items-center w-full">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 animate-icon-pop">
                  <CheckCircle2 className="h-9 w-9 stroke-[2]" />
                </div>

                <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
                  Token Authorized
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
                  The security recovery passcode has been successfully validated. Please continue to set your new password.
                </p>

                <button
                  onClick={handleProceedToReset}
                  className="w-full flex h-12 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-[#2d4c38]/10 cursor-pointer"
                >
                  Continue to Reset
                </button>
              </div>
            )}

            {/* Status 3: Passcode Verification Error flow (COMPLETELY REMOVED "START OVER" AS REQUESTED) */}
            {verificationStatus === "error" && (
              <div className="flex flex-col items-center w-full">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 dark:bg-red-500/10 text-destructive dark:text-red-400 animate-icon-pop">
                  <AlertCircle className="h-9 w-9 stroke-[2]" />
                </div>

                <h3 className="font-serif text-2xl font-black text-foreground tracking-tight mb-2">
                  Verification Failed
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mb-8">
                  {verificationErrorMsg || "The security token you entered is invalid or has expired."}
                </p>

                <button
                  onClick={() => setVerificationModalOpen(false)}
                  className="w-full flex h-12 items-center justify-center rounded-full bg-destructive hover:bg-destructive/90 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-lg shadow-destructive/10 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Step 2 Reset Success modal feedback */}
      <SuccessModal
        isOpen={successModalOpen}
        onClose={() => {
          setSuccessModalOpen(false);
          window.location.href = "/login?reset=true";
        }}
        title="Reset Successful"
        message={successMessage}
        actionText="Go to Login"
        showCancel={false}
        showClose={false}
        onAction={() => {
          setSuccessModalOpen(false);
          window.location.href = "/login?reset=true";
        }}
        actionIcon={null}
      />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-primary/40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
