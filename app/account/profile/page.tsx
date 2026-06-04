"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Camera,
  Pencil,
  Check,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";
import { proxyCloudinaryUrl } from "@/lib/utils";

/* ─── Avatar Component ─── */
function Avatar({
  src,
  name,
  size = 80,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={name || "Profile"}
        width={size}
        height={size}
        className="rounded-2xl object-cover w-full h-full"
        onError={() => setImgError(true)}
        unoptimized={src.startsWith("https://lh3.googleusercontent.com")}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 font-black font-serif w-full h-full"
      style={{ fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || "N"}
    </div>
  );
}

/* ─── Upload Profile Picture ─── */
async function uploadToCloudinary(file: File): Promise<string> {
  const sigRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "naturalist/avatars" }),
  });
  if (!sigRes.ok) throw new Error("Failed to get upload signature");
  const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);
  formData.append("timestamp", String(timestamp));
  formData.append("folder", "naturalist/avatars");

  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: formData }
  );
  if (!upRes.ok) throw new Error("Image upload failed");
  const upData = await upRes.json();
  return proxyCloudinaryUrl(upData.secure_url) as string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Secondary email recovery
  const [recoveryEmailInput, setRecoveryEmailInput] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);

  // Success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  useEffect(() => {
    setMounted(true);
    document.title = "Profile Details | Naturalist";
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchProfile();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const data = await res.json();
        setDbUser(data);
        setRecoveryEmailInput(data.secondaryEmail || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEditName = () => {
    setNameInput(session?.user?.name || "");
    setNameError("");
    setEditingName(true);
  };

  const saveName = async () => {
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setNameError("Name must be at least 2 characters.");
      return;
    }
    setSavingName(true);
    setNameError("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update name.");
      await update({ name: data.name });
      setEditingName(false);
      triggerSuccessToast("Name updated successfully!");
      fetchProfile();
    } catch (e: any) {
      setNameError(e.message);
    } finally {
      setSavingName(false);
    }
  };

  const handleAvatarFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setAvatarError("Please select an image file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setAvatarError("Image must be smaller than 5 MB.");
        return;
      }

      setUploadingAvatar(true);
      setAvatarError("");

      try {
        const url = await uploadToCloudinary(file);
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save profile picture.");

        await update({ image: url });
        triggerSuccessToast("Profile picture updated!");
        fetchProfile();
      } catch (e: any) {
        setAvatarError(e.message || "Upload failed. Please try again.");
      } finally {
        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [update]
  );

  const handleVerifySecondary = async () => {
    if (!recoveryEmailInput.trim() || !/^\S+@\S+\.\S+$/.test(recoveryEmailInput)) {
      alert("Please enter a valid recovery email address.");
      return;
    }
    setOtpSending(true);
    setOtpError("");
    try {
      const res = await fetch("/api/user/verify-secondary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_code",
          secondaryEmail: recoveryEmailInput.toLowerCase().trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue passcode.");

      setShowOtpModal(true);
      setOtpCode("");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      setOtpError("Passcode must be exactly 4 characters.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const res = await fetch("/api/user/verify-secondary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify_code",
          secondaryEmail: recoveryEmailInput.toLowerCase().trim(),
          code: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid passcode.");

      setOtpSuccess(true);
      triggerSuccessToast("Recovery email verified!");
      setTimeout(() => {
        setShowOtpModal(false);
        setOtpSuccess(false);
        fetchProfile();
      }, 1500);
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setOtpVerifying(false);
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Retrieving profile...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const isGoogleUser = !!user?.image && user.image.includes("googleusercontent.com");
  const displayImage = user?.image || null;

  return (
    <div className="w-full min-h-[85vh] bg-[#fdfdfb] dark:bg-[#070908] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors duration-300">
      <div className="mx-auto max-w-xl space-y-6 animate-fade-in-up">
        
        {/* Back Link to Hub */}
        <div className="flex items-center justify-start">
          <a
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
          </a>
        </div>

        {/* Profile Card Container */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Profile Settings</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Manage private credentials</p>
          </div>

          {/* Picture update */}
          <div className="flex items-center gap-5 pb-6 border-b border-border/30 dark:border-[#1a241e]/30">
            <div className="relative flex-shrink-0">
              <div className="h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-[#2d4c38]/20 dark:ring-emerald-500/20">
                <Avatar src={displayImage} name={user?.name} size={80} />
              </div>
              {!isGoogleUser && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white shadow-md transition-all disabled:opacity-60 border-0 cursor-pointer"
                  title="Upload picture"
                >
                  {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarFile}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-serif text-base font-bold truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">{user?.email}</p>
              {avatarError && <p className="text-xs text-destructive mt-1.5 font-medium">{avatarError}</p>}
              {isGoogleUser ? (
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium flex items-center gap-1">
                  Google Identity OAuth Sync Enabled.
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium">Click camera icon to change avatar.</p>
              )}
            </div>
          </div>

          {/* Name field */}
          <div className="space-y-2 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wider">Account Holder Name</span>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                  className="flex-1 h-11 px-4 text-xs rounded-xl border border-[#2d4c38]/40 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all text-foreground"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2d4c38] text-white hover:bg-[#3a6349] transition-all disabled:opacity-60 border-0 cursor-pointer"
                >
                  {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditingName(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all bg-transparent cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-3.5 bg-muted/10 border rounded-xl">
                <span className="text-sm text-foreground font-semibold">{user?.name}</span>
                <button
                  onClick={startEditName}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors bg-transparent border-0 cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" /> Modify
                </button>
              </div>
            )}
            {nameError && <p className="text-xs text-destructive font-medium">{nameError}</p>}
          </div>

          {/* Primary Email */}
          <div className="space-y-1.5 text-xs">
            <span className="font-bold text-muted-foreground uppercase tracking-wider">Primary Email (Locked)</span>
            <div className="p-3.5 bg-muted/30 border border-border/30 rounded-xl text-sm font-semibold text-muted-foreground font-mono">
              {user?.email}
            </div>
          </div>

          {/* Secondary Recovery Email */}
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-muted-foreground uppercase tracking-wider">Secondary Recovery Email</span>
              {dbUser?.isSecondaryEmailVerified && (
                <span className="inline-flex text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  Active & Verified
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                placeholder="recovery@domain.com"
                value={recoveryEmailInput}
                onChange={(e) => setRecoveryEmailInput(e.target.value)}
                className="flex-1 h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground"
              />
              <button
                onClick={handleVerifySecondary}
                disabled={otpSending}
                className="h-11 px-5 rounded-xl bg-[#2d4c38] text-white hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] transition-all disabled:opacity-50 border-0 cursor-pointer whitespace-nowrap"
              >
                {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Recovery"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              This address serves as secondary verification context to recover credentials.
            </p>
          </div>

        </div>

      </div>

      {/* ── OTP Verification Drawer/Modal (Physics-based slide-in entry) ── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#070908]/75 backdrop-blur-md">
          <div className="bg-[#fdfdfb] dark:bg-[#0c100e] border border-border/60 dark:border-[#1a241e]/70 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-modal-slide-in">
            
            <div className="p-6 border-b border-border/30 dark:border-[#1a241e]/30 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold flex items-center gap-2 text-foreground">
                <ShieldCheck className="h-5 w-5 text-[#b07e3a]" /> Verify Secondary Email
              </h3>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted bg-transparent border-0 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOtpSubmit} className="p-6 space-y-5 text-xs">
              {otpError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpSuccess ? (
                <div className="py-8 flex flex-col items-center justify-center text-center gap-3 animate-icon-pop">
                  <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 animate-bounce">
                    <CheckCircle2 className="h-10 w-10" />
                  </div>
                  <h4 className="font-serif text-sm font-bold text-foreground">Verification Authorized!</h4>
                  <p className="text-[11px] text-muted-foreground">Your secondary email recovery context has been added cleanly.</p>
                </div>
              ) : (
                <>
                  <p className="text-muted-foreground leading-relaxed">
                    A secure 4-character verification passcode has been dispatched to <strong className="text-foreground font-mono">{recoveryEmailInput}</strong>. Enter it below to bind this address.
                  </p>

                  <div className="space-y-1.5 font-medium">
                    <label className="font-bold text-muted-foreground uppercase tracking-wider">4-Digit Passcode</label>
                    <div className="flex gap-2 justify-center py-2">
                      <input
                        type="text"
                        maxLength={4}
                        required
                        placeholder="••••"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.toUpperCase())}
                        className="w-40 h-12 text-center text-xl font-mono font-bold rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all tracking-[0.4em] text-foreground animate-pulse"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/30">
                    <button
                      type="button"
                      onClick={() => setShowOtpModal(false)}
                      className="h-11 rounded-full border border-border text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted bg-transparent cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={otpVerifying}
                      className="h-11 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-xs font-bold uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50"
                    >
                      {otpVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Code"}
                    </button>
                  </div>
                </>
              )}

            </form>

          </div>
        </div>
      )}

      {/* ── Success Toast Notification Overlay ── */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-toast-pop">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#2d4c38] text-white rounded-2xl shadow-xl border border-emerald-500/20 max-w-sm">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0 animate-icon-pop">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider">{successMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
