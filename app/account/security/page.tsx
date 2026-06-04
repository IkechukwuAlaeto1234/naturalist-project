"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Smartphone,
  Laptop,
  Trash2,
  ArrowRight,
  Check,
} from "lucide-react";

export default function SecurityPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Password changing
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

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
    document.title = "Security & Active Sessions | Naturalist";
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("Passwords do not match.");
      return;
    }
    setSavingPwd(true);
    setPwdError("");
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");

      triggerSuccessToast("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setSavingPwd(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to end this login session? This device will be signed out instantly.")) return;
    try {
      const res = await fetch("/api/user/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) {
        triggerSuccessToast("Session successfully revoked.");
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to revoke session.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Loading security console...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const isGoogleUser = !!user?.image && user.image.includes("googleusercontent.com");

  return (
    <div className="w-full min-h-[85vh] bg-[#fdfdfb] dark:bg-[#070908] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors duration-300">
      <div className="mx-auto max-w-xl space-y-6 animate-fade-in-up">
        
        {/* Back Link */}
        <div className="flex items-center justify-start">
          <a
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
          </a>
        </div>

        {/* Change password section */}
        {!isGoogleUser && (
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
            <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-[#b07e3a]" /> Change Password
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Update login credentials</p>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              {pwdError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{pwdError}</span>
                </div>
              )}

              {/* Current */}
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => { setCurrentPassword(e.target.value); setPwdError(""); }}
                    className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground uppercase tracking-wider">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setPwdError(""); }}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(""); }}
                      className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="h-11 px-8 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white transition-all disabled:opacity-50 border-0 cursor-pointer"
                >
                  {savingPwd ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save New Password"}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* Google OAuth user info */}
        {isGoogleUser && (
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex gap-4 items-start">
            <div className="h-10 w-10 bg-[#b07e3a]/10 text-[#b07e3a] rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <Lock className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-bold text-foreground">Federated Sign-in Active</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This account is authenticated through Google Identity OAuth. To manage your credentials, passwords or set up 2FA, please visit your official Google Security Settings.
              </p>
              <a
                href="https://myaccount.google.com/security"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors"
              >
                Visit Google Settings <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Active Sessions Deck */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-4">
          <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4 flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold flex items-center gap-2">
              <Smartphone className="h-4.5 w-4.5 text-[#2d4c38] dark:text-emerald-400" /> Active Device Sessions
            </h3>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#2d4c38]/10 text-[#2d4c38] rounded-full">
              Live DB
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Review every active web browser or machine currently authorized to access your naturalist profile. Evict unauthorized devices immediately.
          </p>

          <div className="space-y-3 pt-2">
            {!dbUser?.sessions || dbUser.sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-4">No active sessions mapped.</p>
            ) : (
              dbUser.sessions.map((sessionItem: any) => {
                const isCurrentDevice = typeof window !== "undefined" && dbUser.sessions[dbUser.sessions.length - 1]?.id === sessionItem.id;
                
                return (
                  <div
                    key={sessionItem.id}
                    className="p-4 bg-muted/10 border border-border/40 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 bg-white dark:bg-[#151c18] border border-border/40 rounded-xl flex items-center justify-center flex-shrink-0 text-muted-foreground mt-0.5">
                        {sessionItem.deviceType === "Mobile" ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 text-xs font-semibold">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-foreground truncate">{sessionItem.browser} on {sessionItem.os}</span>
                          {isCurrentDevice && (
                            <span className="text-[8px] font-black uppercase tracking-widest px-2 bg-emerald-500/10 text-emerald-500 rounded-full">
                              This Device
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          IP: {sessionItem.ipAddress} · Active: {new Date(sessionItem.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>

                    {!isCurrentDevice && (
                      <button
                        onClick={() => handleRevokeSession(sessionItem.id)}
                        className="h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all flex-shrink-0 cursor-pointer"
                        title="Revoke Device Session"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

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
