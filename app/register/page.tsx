"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Mail,
  Key,
  Check,
  Copy,
  Phone,
  Globe,
  Eye,
  EyeOff,
  Pencil,
  RefreshCw,
  User,
  Shield,
  Award,
  ChevronDown,
  Search,
} from "lucide-react";
import ErrorModal from "@/components/ui/ErrorModal";

// Phone country definitions
const PHONE_COUNTRIES = [
  { name: "United States",  code: "US",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "Canada",         code: "CA",  dial: "+1",   format: "(XXX) XXX-XXXX", max: 10 },
  { name: "United Kingdom", code: "GB",  dial: "+44",  format: "XXXX XXX XXXX",  max: 11 },
  { name: "Nigeria",        code: "NG",  dial: "+234", format: "XXX XXX XXXX",   max: 10 },
  { name: "Germany",        code: "DE",  dial: "+49",  format: "XXX XXXXXXXX",   max: 11 },
  { name: "France",         code: "FR",  dial: "+33",  format: "X XX XX XX XX",  max: 9  },
  { name: "Australia",      code: "AU",  dial: "+61",  format: "XXX XXX XXX",    max: 9  },
  { name: "South Africa",   code: "ZA",  dial: "+27",  format: "XX XXX XXXX",    max: 9  },
];

const staticCountries = [
  { name: "United States", code: "US" },
  { name: "United Kingdom", code: "GB" },
  { name: "Canada", code: "CA" },
  { name: "Australia", code: "AU" },
  { name: "Belgium", code: "BE" },
  { name: "Germany", code: "DE" },
  { name: "France", code: "FR" },
  { name: "Nigeria", code: "NG" },
  { name: "South Africa", code: "ZA" },
  { name: "Singapore", code: "SG" },
];

const REGISTER_STEP_TITLES: Record<number, string> = {
  1: "Sign Up | Naturalist",
  2: "Verify Email | Naturalist",
  3: "Create Password | Naturalist",
  4: "Contact Details | Naturalist",
  5: "Confirm Profile | Naturalist",
};

function applyPhoneFormat(digits: string, format: string): string {
  let result = "";
  let di = 0;
  for (let i = 0; i < format.length && di < digits.length; i++) {
    result += format[i] === "X" ? digits[di++] : format[i];
  }
  return result;
}

function RegisterContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();

  // Controlled by query search parameter: /register?step=X
  const stepQuery = searchParams.get("step");
  const parsedStep = stepQuery ? parseInt(stepQuery, 10) : 1;
  const step = Number.isInteger(parsedStep) && parsedStep >= 1 && parsedStep <= 5 ? parsedStep : 1;

  // Form Inputs (using session persistence to survive reloads/back transitions)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localPhone, setLocalPhone] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("United States");

  // Phone Country Code Pickers
  const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0]); // Default US
  const [isPhoneDropdownOpen, setIsPhoneDropdownOpen] = useState(false);
  const [phoneSearchQuery, setPhoneSearchQuery] = useState("");

  // Country selector
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");

  // OTP inputs
  const [otpFields, setOtpFields] = useState<string[]>(["", "", "", ""]);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // UI/Spinner states
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [resendTimer, setResendTimer] = useState(59);
  const [resending, setResending] = useState(false);

  // Dropdown Refs
  const phoneDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  // Error Modals
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const goToRoute = (href: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("naturalist:navigation-start"));
    }
    router.push(href);
  };

  useEffect(() => {
    const titleTimeout = setTimeout(() => {
      document.title = REGISTER_STEP_TITLES[step] || REGISTER_STEP_TITLES[1];
    }, 150);
    return () => clearTimeout(titleTimeout);
  }, [step]);

  // Restore states from SessionStorage on Mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setName(sessionStorage.getItem("reg_name") || "");
      setEmail(sessionStorage.getItem("reg_email") || "");
      setPassword(sessionStorage.getItem("reg_password") || "");
      setConfirmPassword(sessionStorage.getItem("reg_password") || "");
      setPhone(sessionStorage.getItem("reg_phone") || "");
      setLocalPhone(sessionStorage.getItem("reg_local_phone") || "");
      setCountry(sessionStorage.getItem("reg_country") || "United States");

      const savedCode = sessionStorage.getItem("reg_phone_code") || "US";
      const match = PHONE_COUNTRIES.find((c) => c.code === savedCode);
      if (match) setPhoneCountry(match);
    }
  }, []);

  // Enforce dynamic URL step query param on start
  useEffect(() => {
    if (!searchParams.get("step")) {
      router.replace("/register?step=1");
    } else if (stepQuery && stepQuery !== String(step)) {
      router.replace(`/register?step=${step}`);
    }
  }, [searchParams, router, step, stepQuery]);

  // Stepper boundary guards: "must always start from the beginning of the stuff"
  useEffect(() => {
    if (step > 1 && (!name.trim() || !email.trim())) {
      router.replace("/register?step=1");
    } else if (step > 3 && !password.trim()) {
      router.replace("/register?step=1");
    } else if (step > 4 && (!phone.trim() || !country.trim())) {
      router.replace("/register?step=1");
    }
  }, [step, name, email, password, phone, country, router]);

  // Countdown timer for OTP resends
  useEffect(() => {
    if (step !== 2 || resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  // NextAuth redirect logic
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

  // Click outside to close custom dropdowns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!phoneDropdownRef.current?.contains(e.target as Node)) {
        setIsPhoneDropdownOpen(false);
      }
      if (!countryDropdownRef.current?.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync state helpers that update sessionStorage
  const updateName = (val: string) => {
    setName(val);
    sessionStorage.setItem("reg_name", val);
  };

  const updateEmail = (val: string) => {
    setEmail(val);
    sessionStorage.setItem("reg_email", val);
  };

  const updatePassword = (val: string) => {
    setPassword(val);
    setConfirmPassword(val);
    sessionStorage.setItem("reg_password", val);
  };

  const updatePhone = (full: string, local: string) => {
    setPhone(full);
    setLocalPhone(local);
    sessionStorage.setItem("reg_phone", full);
    sessionStorage.setItem("reg_local_phone", local);
  };

  const updateCountry = (val: string) => {
    setCountry(val);
    sessionStorage.setItem("reg_country", val);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setErrorModalOpen(true);
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

    updatePassword(randPass);
    setCopied(false);
  };

  const handleCopyPassword = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // OTP inputs handling
  const handleOtpChange = (index: number, val: string) => {
    const newVal = val.toUpperCase().slice(-1);
    const newFields = [...otpFields];
    newFields[index] = newVal;
    setOtpFields(newFields);

    if (newVal && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpFields[index] && index > 0) {
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
    const focusIndex = Math.min(pasteData.length, 3);
    otpRefs[focusIndex].current?.focus();
  };

  // Form step navigation triggers
  const handleNextStep1 = () => {
    if (!name.trim()) {
      triggerError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      triggerError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      goToRoute("/register?step=2");
    }, 1200);
  };

  const handleNextStep2 = async () => {
    const otpCode = otpFields.join("").trim();
    if (otpCode.length !== 4) {
      triggerError("Please enter the complete 4-character passcode.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      goToRoute("/register?step=3");
    }, 1200);
  };

  const handleResendOtp = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResendTimer(59);
      setOtpFields(["", "", "", ""]);
      otpRefs[0].current?.focus();
    }, 1000);
  };

  const handleNextStep3 = () => {
    if (password.length < 6) {
      triggerError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      triggerError("Passwords do not match. Please verify.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      goToRoute("/register?step=4");
    }, 1200);
  };

  const handleNextStep4 = () => {
    if (!localPhone.trim()) {
      triggerError("Please enter your phone number.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      goToRoute("/register?step=5");
    }, 1200);
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    
    setTimeout(async () => {
      try {
        if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
          setLoading(false);
          // Clear registration session states on success
          sessionStorage.removeItem("reg_name");
          sessionStorage.removeItem("reg_email");
          sessionStorage.removeItem("reg_password");
          sessionStorage.removeItem("reg_phone");
          sessionStorage.removeItem("reg_local_phone");
          sessionStorage.removeItem("reg_phone_code");
          sessionStorage.removeItem("reg_country");

          goToRoute("/login?verified=true");
          return;
        }

        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: password,
            phone: phone.trim(),
            country: country,
          }),
        });

        const data = await res.json();
        setLoading(false);

        if (!res.ok) {
          triggerError(data.error || "Failed to finalize registration.");
        } else {
          sessionStorage.removeItem("reg_name");
          sessionStorage.removeItem("reg_email");
          sessionStorage.removeItem("reg_password");
          sessionStorage.removeItem("reg_phone");
          sessionStorage.removeItem("reg_local_phone");
          sessionStorage.removeItem("reg_phone_code");
          sessionStorage.removeItem("reg_country");
          
          goToRoute("/login?verified=true");
        }
      } catch (err: any) {
        setLoading(false);
        triggerError("An unexpected error occurred during database registration.");
      }
    }, 1800);
  };

  // Search filter countries lists
  const filteredPhones = useMemo(() => {
    return PHONE_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(phoneSearchQuery.toLowerCase()) ||
        c.dial.includes(phoneSearchQuery)
    );
  }, [phoneSearchQuery]);

  const filteredCountries = useMemo(() => {
    return staticCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );
  }, [countrySearchQuery]);

  // Phone input mask apply
  const handleLocalPhoneInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, phoneCountry.max);
    const fmt = applyPhoneFormat(raw, phoneCountry.format);
    updatePhone(`${phoneCountry.dial} ${fmt}`, fmt);
  };

  // Back arrow link calculations
  const getBackPath = () => {
    if (step <= 1) return "/login";
    return `/register?step=${step - 1}`;
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] transition-colors duration-300 py-16 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center pb-24">
      <div className="mx-auto max-w-lg w-full">
        
        {/* Wizard Card Container */}
        <div className="relative overflow-visible bg-white/80 dark:bg-[#151c18]/80 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[32px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(20,31,25,0.03)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col">
          
          {/* Stepper Progress Bar */}
          <div className="mb-8 w-full flex items-center justify-between gap-2.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1 flex flex-col gap-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    s <= step
                      ? "bg-[#2d4c38] dark:bg-emerald-500/70"
                      : "bg-[#e2dacd] dark:bg-white/10"
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Header Title with PERFECT Circle Back Arrow */}
          <div className="text-center mb-8 relative">
            <Link
              href={getBackPath()}
              className="absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground transition-all cursor-pointer flex-shrink-0 aspect-square shadow-sm"
              aria-label="Previous Step"
              data-tooltip="Previous Step"
            >
              <ArrowLeft className="h-4.5 w-4.5 stroke-[2]" />
            </Link>

            {step === 1 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
                  <User className="h-3 w-3 stroke-[2.5]" /> Step 1 of 5
                </span>
                <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
                  Your Identity
                </h1>
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
                  Let's start with your basic identification. Enter your name and email.
                </p>
              </>
            )}

            {step === 2 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 stroke-[2.5]" /> Step 2 of 5
                </span>
                <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
                  We just sent an email
                </h1>
                
                {/* Visual Fix: Stack details centered and un-malformed */}
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed max-w-xs mx-auto text-center">
                  Enter the security code we sent to
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <strong className="text-xs font-semibold text-foreground truncate max-w-[240px]">
                    {email}
                  </strong>
                  <button
                    type="button"
                    onClick={() => goToRoute("/register?step=1")}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#b07e3a]/10 hover:bg-[#b07e3a]/20 text-[#b07e3a] transition-all cursor-pointer flex-shrink-0 aspect-square"
                    data-tooltip="Edit Email"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
                  <Shield className="h-3 w-3 stroke-[2.5]" /> Step 3 of 5
                </span>
                <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
                  Create Password
                </h1>
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
                  Set a highly secure password for your Naturalist account or generate a premium strong one.
                </p>
              </>
            )}

            {step === 4 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
                  <Globe className="h-3 w-3 stroke-[2.5]" /> Step 4 of 5
                </span>
                <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
                  Contact Details
                </h1>
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
                  Provide your country and phone number to finalize your botanic profile.
                </p>
              </>
            )}

            {step === 5 && (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a] inline-flex items-center gap-1">
                  <Award className="h-3 w-3 stroke-[2.5]" /> Step 5 of 5
                </span>
                <h1 className="font-serif text-3xl font-black text-foreground mt-2 leading-none tracking-tight">
                  Confirm Profile
                </h1>
                <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed max-w-xs mx-auto">
                  Almost there! Review your botanical profile details below before creating your account.
                </p>
              </>
            )}
          </div>

          {/* ── STEP 1: IDENTITY ── */}
          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="h-3 w-3 text-muted-foreground" /> Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => updateName(e.target.value)}
                    placeholder="Jane Doe"
                    className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => updateEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep1}
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Continue & Verify Email <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 2: VERIFICATION (OTP) ── */}
          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              {/* 4 Digit Boxes Layout */}
              <div className="flex justify-center gap-3.5 py-4">
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
                type="button"
                onClick={handleNextStep2}
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    Verify & Continue <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {/* Countdown timer */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/40">
                Didn't receive code?{" "}
                {resendTimer > 0 ? (
                  <span className="font-semibold text-foreground">
                    Resend - 00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="font-bold text-[#b07e3a] hover:underline cursor-pointer"
                  >
                    {resending ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: SECURITY & GENERATOR ── */}
          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Key className="h-3 w-3" /> Password</span>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[9px] text-[#b07e3a] hover:underline uppercase font-extrabold tracking-wider cursor-pointer"
                      data-tooltip="Generate Secure Password"
                    >
                      Generate Strong Password
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => updatePassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-5 py-3.5 pr-20 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
                    />
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground cursor-pointer flex-shrink-0"
                        data-tooltip={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {password && (
                        <button
                          type="button"
                          onClick={handleCopyPassword}
                          className="text-[#b07e3a] hover:text-[#3a6349] cursor-pointer flex-shrink-0"
                          data-tooltip={copied ? "Copied!" : "Copy to Clipboard"}
                        >
                          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" /> Confirm Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Retype password"
                    className="px-5 py-3.5 text-sm rounded-full border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38] dark:focus:ring-emerald-500/40 focus:border-transparent transition-all placeholder:text-muted-foreground/45 text-foreground"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNextStep3}
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Moving to Step 4...
                  </>
                ) : (
                  <>
                    Contact details <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 4: CONTACT & PREMIUM CUSTOM DROPDOWNS ── */}
          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div className="space-y-4">
                
                {/* Premium Phone Input with Searchable Custom Dropdown Picker */}
                <div className="flex flex-col gap-1.5 relative" ref={phoneDropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Phone className="h-3 w-3 text-muted-foreground" /> Phone Number
                  </label>
                  <div className="flex items-center rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] focus-within:ring-2 focus-within:ring-[#b07e3a] focus-within:border-transparent transition-all overflow-hidden w-full h-12">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPhoneDropdownOpen((v) => !v);
                        setPhoneSearchQuery("");
                      }}
                      className="flex items-center gap-1.5 pl-4 pr-3 py-3 border-r border-[#e2dacd] dark:border-white/10 hover:bg-muted/30 transition-colors flex-shrink-0 select-none text-xs font-semibold text-foreground h-full cursor-pointer"
                      data-tooltip="Select Dial Code"
                    >
                      <span>{phoneCountry.code}</span>
                      <span className="text-muted-foreground tabular-nums">{phoneCountry.dial}</span>
                      <ChevronDown
                        className={`h-3 w-3 text-muted-foreground/60 transition-transform duration-150 ${
                          isPhoneDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    <input
                      type="tel"
                      value={localPhone}
                      onChange={handleLocalPhoneInput}
                      required
                      inputMode="tel"
                      placeholder={phoneCountry.format.replace(/X/g, "0")}
                      className="flex-1 px-4 py-3 text-sm bg-transparent text-foreground focus:outline-none placeholder:text-muted-foreground/40 h-full font-medium"
                    />
                  </div>

                  {isPhoneDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-toast-pop">
                      <div className="p-2.5 border-b border-[#e2dacd]/60 dark:border-white/[0.06] flex items-center gap-2 px-3">
                        <Search className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                        <input
                          type="text"
                          value={phoneSearchQuery}
                          onChange={(e) => setPhoneSearchQuery(e.target.value)}
                          placeholder="Search country or code…"
                          autoFocus
                          className="w-full px-3 py-1.5 text-xs rounded-full border border-[#e2dacd] dark:border-white/10 bg-muted/20 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-[#b07e3a] placeholder:text-muted-foreground/50 text-foreground"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredPhones.length === 0 ? (
                          <p className="px-4 py-4 text-xs text-muted-foreground text-center">No results</p>
                        ) : (
                          filteredPhones.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                setPhoneCountry(c);
                                updatePhone("", "");
                                sessionStorage.setItem("reg_phone_code", c.code);
                                setIsPhoneDropdownOpen(false);
                                setPhoneSearchQuery("");
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] transition-colors cursor-pointer ${
                                phoneCountry.code === c.code
                                  ? "text-[#b07e3a] bg-[#f4efe6]/50 dark:bg-[#1e2621]/50"
                                  : "text-foreground"
                              }`}
                            >
                              <span className="flex-1 text-left">{c.name}</span>
                              <span className="tabular-nums text-muted-foreground text-[10px]">
                                {c.dial}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Premium Country Selection custom dropdown */}
                <div className="flex flex-col gap-1.5 relative" ref={countryDropdownRef}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Globe className="h-3 w-3 text-muted-foreground" /> Country / Region
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCountryDropdownOpen((v) => !v);
                      setCountrySearchQuery("");
                    }}
                    className="flex items-center justify-between px-5 py-3 text-sm rounded-full border border-[#e2dacd] dark:border-white/10 bg-white dark:bg-[#0f1411] text-foreground focus:outline-none focus:ring-2 focus:ring-[#b07e3a] transition-all w-full text-left h-12 cursor-pointer font-medium"
                    data-tooltip="Select Country"
                  >
                    <span>{country}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                        isCountryDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  
                  {isCountryDropdownOpen && (
                    <div className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white dark:bg-[#151c18] border border-[#e2dacd] dark:border-white/10 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-toast-pop">
                      <div className="p-2.5 border-b border-[#e2dacd]/60 dark:border-white/[0.06] flex items-center gap-2 px-3">
                        <Search className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                        <input
                          type="text"
                          value={countrySearchQuery}
                          onChange={(e) => setCountrySearchQuery(e.target.value)}
                          placeholder="Search country…"
                          autoFocus
                          className="w-full px-3 py-1.5 text-xs rounded-full border border-[#e2dacd] dark:border-white/10 bg-muted/20 dark:bg-white/5 focus:outline-none focus:ring-1 focus:ring-[#b07e3a] placeholder:text-muted-foreground/50 text-foreground"
                        />
                      </div>
                      <div className="max-h-56 overflow-y-auto">
                        {filteredCountries.length === 0 ? (
                          <p className="px-4 py-4 text-xs text-muted-foreground text-center">No results</p>
                        ) : (
                          filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                updateCountry(c.name);
                                setIsCountryDropdownOpen(false);
                                setCountrySearchQuery("");
                              }}
                              className={`w-full px-4 py-2.5 text-xs text-left font-semibold hover:bg-[#f4efe6] dark:hover:bg-[#1e2621] transition-colors cursor-pointer ${
                                country === c.name
                                  ? "text-[#b07e3a] bg-[#f4efe6]/40 dark:bg-[#1e2621]/40"
                                  : "text-foreground"
                              }`}
                            >
                              {c.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>

              <button
                type="button"
                onClick={handleNextStep4}
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    Review Account <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── STEP 5: REVIEW & FINAL SUBMIT ── */}
          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              {/* Premium summary card */}
              <div className="bg-[#faf8f4] dark:bg-[#111613] border border-border/60 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between border-b border-border/40 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</span>
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{name}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</span>
                  <span className="text-xs font-semibold text-foreground truncate max-w-[200px]">{email}</span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Password</span>
                  <span className="text-xs font-semibold text-foreground tracking-widest">
                    {password ? "••••••••" : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/40 pb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Phone Number</span>
                  <span className="text-xs font-semibold text-foreground">{phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Country</span>
                  <span className="text-xs font-semibold text-foreground">{country}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
                className="w-full flex h-12 items-center justify-center gap-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-widest text-white transition-all shadow-md cursor-pointer select-none disabled:opacity-85 disabled:cursor-not-allowed"
                data-tooltip="Submit Registration"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Activating Profile...
                  </>
                ) : (
                  <>
                    Confirm & Create Account <Check className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Footer Navigation */}
          {step === 1 && (
            <div className="mt-8 text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#b07e3a] hover:underline"
              >
                Sign In
              </Link>
            </div>
          )}

        </div>

      </div>

      {/* Error modal feedback */}
      <ErrorModal
        isOpen={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        title="Registration Error"
        message={errorMessage}
      />
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] dark:bg-[#0a0d0b] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <span className="material-icons animate-spin text-3xl text-primary/40">cached</span>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Loading Form...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
