"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Camera,
  Check,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Trash2,
  ArrowRight,
  Pencil,
  Users,
  Bell,
  Sparkles,
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

export default function ProfileSettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit-profile");

  // Profile forms
  const [nameInput, setNameInput] = useState("");
  const [aboutInput, setAboutInput] = useState("");
  const [pronounsInput, setPronounsInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

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

  // Security Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // GDPR Data requests
  const [dataRequest, setDataRequest] = useState<any>(null);
  const [requestingData, setRequestingData] = useState(false);

  // General settings state (Pinterest-like options)
  const [settings, setSettings] = useState<any>({
    isPrivateProfile: false,
    hideFromSearch: false,
    recommendations: {
      "An ecommerce concept of order confirm, flat illustration": true,
      "Download Confirmation of an online order concept illustration": true,
      "Email marketing and newsletter content vector illustration": true,
      "'Made by Google' Email: How to Tease a Product Launch Like a Pro": true,
      "Uber": true,
      "New Arrival: 'Product Launch Tips' Email Template for Tech Enthusiasts": true,
      "Fintech email with bold positioning": true,
      "The 8 Most Effective Words to Use in Email": true,
      "The Best Email Designs in the Universe: Top Templates & Inspirations": true,
      "Unlock Exclusive Welcome Notifications: FREE Email Design Templates": true,
      "Newsletter": true,
      "Facebook": true,
      "Instagram": true,
      "TikTok": true,
      "YouTube": true,
    },
    mentions: "anyone",
    messages: {
      friends: "inbox",
      followers: "requests",
      following: "requests",
      everyone: "requests",
    },
    commentsAllowed: true,
    commentsFilter: "",
    showSimilarProducts: true,
    autoplayVideos: true,
    notifications: {
      comments: { push: true, inApp: true },
      reactions: { push: true, inApp: true },
      saves: { push: true },
      views: { push: true, inApp: true },
      mentions: { push: true, inApp: true },
      reminders: { push: true, inApp: true },
      groupUpdates: { push: true, email: true, inApp: true },
      groupInvites: { push: true },
      messages: { push: true, email: true, inApp: true },
      followers: { push: true },
      inspiredFeed: { push: true, email: false, inApp: true },
      basedInterests: { push: true, email: false, inApp: true },
      basedActivity: { push: true, email: true, inApp: true },
      announcements: { email: true },
      surveys: { email: true },
    },
    privacy: {
      useSitesInfo: true,
      usePartnerInfo: true,
      adsAboutUs: true,
      adsReporting: true,
      sharePartnerInfo: true,
      adsOffPlatform: true,
      genAiTraining: true,
    }
  });

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
    document.title = "Settings | Naturalist";
    
    // Check URL search parameters to switch tab on load
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab) setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchProfile();
        fetchLocalDataRequest();
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
        setNameInput(data.name || "");
        setAboutInput(data.about || "");
        setPronounsInput(data.pronouns || "");
        setWebsiteInput(data.website || "");
        setUsernameInput(data.username || "");
        setRecoveryEmailInput(data.secondaryEmail || "");
        if (data.settings && Object.keys(data.settings).length > 0) {
          // Merge loaded settings with default structure to prevent missing field undefined bugs
          setSettings((prev: any) => ({
            ...prev,
            ...data.settings,
            recommendations: { ...prev.recommendations, ...(data.settings.recommendations || {}) },
            messages: { ...prev.messages, ...(data.settings.messages || {}) },
            notifications: { ...prev.notifications, ...(data.settings.notifications || {}) },
            privacy: { ...prev.privacy, ...(data.settings.privacy || {}) }
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalDataRequest = async () => {
    try {
      const res = await fetch("/api/user/data-request");
      if (res.ok) {
        const data = await res.json();
        setDataRequest(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Form saving handlers
  const handleSaveProfileSettings = async () => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameInput,
          about: aboutInput,
          pronouns: pronounsInput,
          website: websiteInput,
          username: usernameInput,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile.");
      await update({ name: data.name });
      triggerSuccessToast("Profile settings updated!");
      fetchProfile();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const saveGeneralSettingsState = async (updatedSettings: any) => {
    setSettings(updatedSettings);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: updatedSettings }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings.");
      }
      triggerSuccessToast("Preferences auto-saved!");
    } catch (e: any) {
      console.error(e);
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

  const handleRequestData = async () => {
    setRequestingData(true);
    try {
      const res = await fetch("/api/user/data-request", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        triggerSuccessToast("GDPR Data request submitted!");
        fetchLocalDataRequest();
      } else {
        alert(data.error || "Failed to submit data request.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to submit request.");
    } finally {
      setRequestingData(false);
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3 bg-[#fdfdfb] dark:bg-[#070908]">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Retrieving settings panel...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const isGoogleUser = !!user?.image && user.image.includes("googleusercontent.com");
  const displayImage = user?.image || null;

  const tabs = [
    { id: "edit-profile", label: "Edit profile", icon: User },
    { id: "account-management", label: "Account management", icon: Pencil },
    { id: "profile-visibility", label: "Profile visibility", icon: Eye },
    { id: "refine-recommendations", label: "Refine your recommendations", icon: Sparkles },
    { id: "social-permissions", label: "Social permissions", icon: Users },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy-data", label: "Privacy and data", icon: ShieldCheck },
    { id: "security", label: "Security & Sessions", icon: Lock },
  ];

  return (
    <div className="w-full min-h-screen bg-[#fdfdfb] dark:bg-[#070908] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors duration-300">
      <div className="mx-auto max-w-5xl space-y-6">
        
        {/* Back Link to Hub */}
        <div className="flex items-center justify-start">
          <a
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#b07e3a] hover:text-[#c89348] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Hub
          </a>
        </div>

        {/* Pinterest Settings Grid Layout */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col md:flex-row gap-10">
          
          {/* Left Navigation Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-4 md:pb-0 md:pr-6 border-b md:border-b-0 md:border-r border-border/20 dark:border-[#1a241e]/20 gap-2 shrink-0 select-none">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border-0 cursor-pointer whitespace-nowrap text-left w-full ${
                    isActive
                      ? "bg-[#2d4c38] text-white shadow-md shadow-[#2d4c38]/10"
                      : "bg-transparent text-muted-foreground hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 hover:text-foreground"
                  }`}
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </aside>

          {/* Right Content Settings Pane */}
          <div className="flex-1 min-w-0">
            {activeTab === "edit-profile" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Edit profile</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Keep your personal details private. Information you add here is visible to anyone who can view your profile.
                  </p>
                </div>

                {/* Photo Upload */}
                <div className="flex items-center gap-5 p-4 bg-muted/10 border border-border/30 rounded-2xl">
                  <div className="relative flex-shrink-0">
                    <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-[#2d4c38]/20 dark:ring-emerald-500/20">
                      <Avatar src={displayImage} name={user?.name} size={64} />
                    </div>
                    {!isGoogleUser && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white shadow-md transition-all border-0 cursor-pointer"
                        title="Upload picture"
                      >
                        {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
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
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Profile Picture</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {isGoogleUser ? "OAuth picture synced with Google." : "JPG, PNG formats. Max 5MB."}
                    </p>
                    {avatarError && <p className="text-xs text-destructive mt-1 font-medium">{avatarError}</p>}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase tracking-wider">About</label>
                    <textarea
                      value={aboutInput}
                      onChange={(e) => setAboutInput(e.target.value)}
                      placeholder="Tell your story..."
                      className="w-full h-24 p-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground resize-none leading-relaxed"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase tracking-wider">Pronouns</label>
                      <select
                        value={pronounsInput}
                        onChange={(e) => setPronounsInput(e.target.value)}
                        className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground cursor-pointer"
                      >
                        <option value="">Choose your pronouns</option>
                        <option value="he/him">he/him</option>
                        <option value="she/her">she/her</option>
                        <option value="they/them">they/them</option>
                        <option value="other">other</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-bold text-muted-foreground uppercase tracking-wider">Website</label>
                      <input
                        type="url"
                        value={websiteInput}
                        onChange={(e) => setWebsiteInput(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground uppercase tracking-wider">Username</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-muted-foreground/60 select-none">www.naturalist.com/</span>
                      <input
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="username"
                        style={{ paddingLeft: "155px" }}
                        className="w-full h-11 pr-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border/20">
                  <button
                    onClick={handleSaveProfileSettings}
                    className="h-11 px-8 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white transition-all border-0 cursor-pointer shadow-lg"
                  >
                    Save Profile
                  </button>
                </div>
              </div>
            )}

            {activeTab === "account-management" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Account management</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Manage your credentials, verify secondary contact information, and audit account life cycles.
                  </p>
                </div>

                {/* Primary Email */}
                <div className="space-y-1.5 text-xs">
                  <label className="font-bold text-muted-foreground uppercase tracking-wider">Primary Email (Locked)</label>
                  <div className="h-11 px-4 flex items-center bg-muted/40 border border-border/30 rounded-xl text-sm font-semibold text-muted-foreground font-mono select-none">
                    {user?.email}
                  </div>
                </div>

                {/* Secondary Recovery Email */}
                <div className="space-y-2.5 text-xs border-t border-border/20 pt-6">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-muted-foreground uppercase tracking-wider">Secondary Recovery Email</label>
                    {dbUser?.isSecondaryEmailVerified && (
                      <span className="inline-flex text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
                    This secondary recovery address is used to verify account ownership during reset actions.
                  </p>
                </div>

                {/* Delete Section */}
                <div className="border-t border-red-500/10 pt-6 space-y-3">
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider">Delete data and account</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permanently delete your entire login account, personal details, order histories, and consent registries. This action is irreversible.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm("Are you absolutely sure you want to permanently delete your Naturalist account? This cannot be undone.")) {
                        alert("Account deletion request submitted. Please contact administration for immediate verification.");
                      }
                    }}
                    className="h-10 px-5 rounded-full border border-red-500/30 hover:bg-red-500/5 text-red-500 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            )}

            {activeTab === "profile-visibility" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Profile visibility</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Manage how your profile and public saved remedies are discovered by others on and off Naturalist.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Private Profile Toggle */}
                  <label className="flex items-start justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 hover:border-border/60 transition-all cursor-pointer">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-foreground">Private profile</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                        When your profile is private, only users you approve can view your active saved remedies, follower counts, and recipe bundles.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.isPrivateProfile || false}
                      onChange={(e) => {
                        saveGeneralSettingsState({
                          ...settings,
                          isPrivateProfile: e.target.checked
                        });
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer"
                    />
                  </label>

                  {/* Search Privacy Toggle */}
                  <label className="flex items-start justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 hover:border-border/60 transition-all cursor-pointer">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-foreground">Search privacy</span>
                      <p className="text-[11px] text-muted-foreground leading-relaxed max-w-md">
                        Hide your profile page and remedy bundles from third-party search engines like Google, Yahoo, or Bing.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.hideFromSearch || false}
                      onChange={(e) => {
                        saveGeneralSettingsState({
                          ...settings,
                          hideFromSearch: e.target.checked
                        });
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "refine-recommendations" && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Refine your recommendations</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Make your feed more you. Select and refine the active topics Naturalist uses to customize remedies and notifications for you.
                  </p>
                </div>

                <div className="space-y-2 border-t border-border/20 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                  {Object.keys(settings.recommendations || {}).map((topic) => (
                    <label
                      key={topic}
                      className="flex items-center justify-between p-3 border border-border/30 rounded-xl bg-muted/5 hover:bg-muted/10 transition-all cursor-pointer text-xs"
                    >
                      <span className="text-foreground font-semibold pr-4 leading-normal">{topic}</span>
                      <input
                        type="checkbox"
                        checked={settings.recommendations[topic]}
                        onChange={(e) => {
                          const updatedRecs = {
                            ...settings.recommendations,
                            [topic]: e.target.checked
                          };
                          saveGeneralSettingsState({
                            ...settings,
                            recommendations: updatedRecs
                          });
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer shrink-0"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "social-permissions" && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Social permissions</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Choose how other members, shoppers, and curators interact with your user profile on Naturalist.
                  </p>
                </div>

                {/* Mentions */}
                <div className="space-y-2 border-t border-border/20 pt-4">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">@Mentions</h3>
                  <p className="text-xs text-muted-foreground">Choose who can tag or @mention you in comments</p>
                  <div className="flex flex-col gap-2 mt-2">
                    {["anyone", "followers", "off"].map((opt) => (
                      <label key={opt} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/35 hover:bg-muted/5 cursor-pointer">
                        <input
                          type="radio"
                          name="mentions"
                          value={opt}
                          checked={settings.mentions === opt}
                          onChange={() => {
                            saveGeneralSettingsState({
                              ...settings,
                              mentions: opt
                            });
                          }}
                          className="h-4 w-4 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer"
                        />
                        <span className="capitalize font-semibold text-foreground">
                          {opt === "anyone" && "Anyone on Naturalist"}
                          {opt === "followers" && "Only people you follow"}
                          {opt === "off" && "Turn off / No one"}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-3 border-t border-border/20 pt-6">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Messages & Chat Requests</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.keys(settings.messages || {}).map((sender) => (
                      <div key={sender} className="space-y-1">
                        <label className="capitalize font-bold text-muted-foreground tracking-wide">{sender}</label>
                        <select
                          value={settings.messages[sender]}
                          onChange={(e) => {
                            const updatedMessages = {
                              ...settings.messages,
                              [sender]: e.target.value
                            };
                            saveGeneralSettingsState({
                              ...settings,
                              messages: updatedMessages
                            });
                          }}
                          className="w-full h-10 px-3 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground cursor-pointer font-bold"
                        >
                          <option value="inbox">Direct to Inbox</option>
                          <option value="requests">Direct to Requests</option>
                          <option value="off">Off / Do Not Receive</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div className="space-y-3 border-t border-border/20 pt-6">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Comments Permissions</h3>
                  <label className="flex items-center justify-between gap-6 p-3 rounded-xl border border-border/30 cursor-pointer">
                    <span className="font-semibold text-foreground">Allow comments on your remedy formulas</span>
                    <input
                      type="checkbox"
                      checked={settings.commentsAllowed || false}
                      onChange={(e) => {
                        saveGeneralSettingsState({
                          ...settings,
                          commentsAllowed: e.target.checked
                        });
                      }}
                      className="h-4 w-4 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer"
                    />
                  </label>

                  <div className="space-y-1.5">
                    <label className="font-bold text-muted-foreground">Filter comments on your formulas</label>
                    <input
                      type="text"
                      placeholder="Enter words or phrases to hide (comma separated)"
                      value={settings.commentsFilter || ""}
                      onChange={(e) => setSettings({ ...settings, commentsFilter: e.target.value })}
                      onBlur={() => saveGeneralSettingsState(settings)}
                      className="w-full h-11 px-4 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] transition-all text-foreground"
                    />
                  </div>
                </div>

                {/* Blocked Accounts list placeholder */}
                <div className="border-t border-border/20 pt-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Blocked accounts</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Manage accounts you have blocked</p>
                  </div>
                  <button
                    onClick={() => alert("No accounts are currently blocked.")}
                    className="h-9 px-4 rounded-full border border-border hover:bg-muted text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-transparent"
                  >
                    See list
                  </button>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/20 pt-6">
                  <label className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/30 cursor-pointer">
                    <div>
                      <span className="font-semibold text-foreground">Shopping recommendations</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Show similar products in visual searches</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.showSimilarProducts || false}
                      onChange={(e) => {
                        saveGeneralSettingsState({
                          ...settings,
                          showSimilarProducts: e.target.checked
                        });
                      }}
                      className="h-4 w-4 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer shrink-0"
                    />
                  </label>

                  <label className="flex items-center justify-between gap-4 p-3 rounded-xl border border-border/30 cursor-pointer">
                    <div>
                      <span className="font-semibold text-foreground">Autoplay videos</span>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Autoplay recipe tutorials on desktop</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.autoplayVideos || false}
                      onChange={(e) => {
                        saveGeneralSettingsState({
                          ...settings,
                          autoplayVideos: e.target.checked
                        });
                      }}
                      className="h-4 w-4 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer shrink-0"
                    />
                  </label>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Notifications</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    We'll always let you know about important changes, but you pick what else you want to hear about.
                  </p>
                </div>

                <div className="space-y-4 border-t border-border/20 pt-4 max-h-[60vh] overflow-y-auto pr-2">
                  {/* Pins Created */}
                  <div className="space-y-2">
                    <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Formulas you created</h3>
                    <div className="space-y-2 pl-2">
                      {["comments", "reactions", "saves", "views"].map((act) => {
                        const hasPush = settings.notifications[act]?.push !== undefined;
                        const hasInApp = settings.notifications[act]?.inApp !== undefined;
                        return (
                          <div key={act} className="flex items-center justify-between p-2.5 border border-border/30 rounded-xl bg-muted/5">
                            <span className="capitalize font-semibold text-foreground">{act} notifications</span>
                            <div className="flex gap-4">
                              {hasPush && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications[act].push}
                                    onChange={(e) => {
                                      const updatedNotifs = {
                                        ...settings.notifications,
                                        [act]: { ...settings.notifications[act], push: e.target.checked }
                                      };
                                      saveGeneralSettingsState({ ...settings, notifications: updatedNotifs });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#2d4c38]"
                                  />
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Push</span>
                                </label>
                              )}
                              {hasInApp && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications[act].inApp}
                                    onChange={(e) => {
                                      const updatedNotifs = {
                                        ...settings.notifications,
                                        [act]: { ...settings.notifications[act], inApp: e.target.checked }
                                      };
                                      saveGeneralSettingsState({ ...settings, notifications: updatedNotifs });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#2d4c38]"
                                  />
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">In-App</span>
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Social Updates */}
                  <div className="space-y-2 pt-4 border-t border-border/20">
                    <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Social activity</h3>
                    <div className="space-y-2 pl-2">
                      {["groupUpdates", "messages", "followers"].map((act) => {
                        const hasPush = settings.notifications[act]?.push !== undefined;
                        const hasEmail = settings.notifications[act]?.email !== undefined;
                        const hasInApp = settings.notifications[act]?.inApp !== undefined;
                        return (
                          <div key={act} className="flex items-center justify-between p-2.5 border border-border/30 rounded-xl bg-muted/5">
                            <span className="capitalize font-semibold text-foreground">
                              {act === "groupUpdates" ? "Group board updates" : act}
                            </span>
                            <div className="flex gap-4">
                              {hasPush && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications[act].push}
                                    onChange={(e) => {
                                      const updatedNotifs = {
                                        ...settings.notifications,
                                        [act]: { ...settings.notifications[act], push: e.target.checked }
                                      };
                                      saveGeneralSettingsState({ ...settings, notifications: updatedNotifs });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#2d4c38]"
                                  />
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Push</span>
                                </label>
                              )}
                              {hasEmail && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications[act].email}
                                    onChange={(e) => {
                                      const updatedNotifs = {
                                        ...settings.notifications,
                                        [act]: { ...settings.notifications[act], email: e.target.checked }
                                      };
                                      saveGeneralSettingsState({ ...settings, notifications: updatedNotifs });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#2d4c38]"
                                  />
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Email</span>
                                </label>
                              )}
                              {hasInApp && (
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={settings.notifications[act].inApp}
                                    onChange={(e) => {
                                      const updatedNotifs = {
                                        ...settings.notifications,
                                        [act]: { ...settings.notifications[act], inApp: e.target.checked }
                                      };
                                      saveGeneralSettingsState({ ...settings, notifications: updatedNotifs });
                                    }}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-[#2d4c38]"
                                  />
                                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">In-App</span>
                                </label>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "privacy-data" && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Privacy and data</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Manage the personal data Naturalist shares with advertisers, utilizes for personalization models, or exports for GDPR logs.
                  </p>
                </div>

                {/* Ads Personalization */}
                <div className="space-y-3 border-t border-border/20 pt-4">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Ads personalization</h3>
                  <div className="space-y-3">
                    {[
                      { key: "useSitesInfo", label: "Use info from sites you visit", desc: "Allow Naturalist to utilize cookies and diagnostic tags from partner websites you visit to personalize recommendations." },
                      { key: "usePartnerInfo", label: "Use of partner info", desc: "Allow partner data sharing to optimize your skincare remedy matching feeds." },
                      { key: "genAiTraining", label: "Use your data to train Naturalist Canvas", desc: "Consents to feed your saved remedies, skincare profiles, and review data into Naturalist GenAI models for custom ingredient generation." }
                    ].map((item) => (
                      <label key={item.key} className="flex items-start justify-between gap-6 p-3.5 rounded-xl border border-border/30 hover:border-border/60 transition-all cursor-pointer">
                        <div className="space-y-1">
                          <span className="font-bold text-foreground">{item.label}</span>
                          <p className="text-[10px] text-muted-foreground leading-relaxed max-w-lg">{item.desc}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.privacy[item.key] || false}
                          onChange={(e) => {
                            const updatedPrivacy = {
                              ...settings.privacy,
                              [item.key]: e.target.checked
                            };
                            saveGeneralSettingsState({
                              ...settings,
                              privacy: updatedPrivacy
                            });
                          }}
                          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2d4c38] focus:ring-[#2d4c38] cursor-pointer shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {/* Request Data Section */}
                <div className="space-y-3 border-t border-border/20 pt-6">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Request your data</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Request a full copy of the botanical profiles, account credentials, order transactions and consent history Naturalist has collected about you.
                  </p>

                  <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      {dataRequest ? (
                        <div>
                          <p className="font-semibold text-foreground">
                            Status: <span className="capitalize text-[#b07e3a] font-bold">{dataRequest.status}</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Requested on {new Date(dataRequest.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-semibold text-foreground">Ready to export</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Click submit to generate your copy</p>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {dataRequest?.status === "pending" && (
                        <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted border border-border px-4 py-2 rounded-full select-none">
                          Request Pending Review
                        </span>
                      )}

                      {dataRequest?.status === "approved" && dataRequest.downloadUrl && (
                        <a
                          href={dataRequest.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 px-5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <ShieldCheck className="h-4 w-4" /> Download Archive
                        </a>
                      )}

                      {!dataRequest && (
                        <button
                          onClick={handleRequestData}
                          disabled={requestingData}
                          className="h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-0 cursor-pointer disabled:opacity-50"
                        >
                          {requestingData ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request Data Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-fade-in text-xs">
                <div>
                  <h2 className="font-serif text-2xl font-black text-foreground">Security & Sessions</h2>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Reset your account login password and evict active terminal browser devices synced to your MongoDB sessions.
                  </p>
                </div>

                {/* Change Password Form */}
                {!isGoogleUser ? (
                  <form onSubmit={handleChangePassword} className="space-y-4 border-t border-border/20 pt-4">
                    {pwdError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2 font-medium">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{pwdError}</span>
                      </div>
                    )}

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
                ) : (
                  <div className="p-4 bg-muted/10 border border-border/30 rounded-xl flex gap-3.5 items-start mt-4">
                    <Lock className="h-5 w-5 text-[#b07e3a] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-serif font-bold text-foreground">Federated login enabled</h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        This profile is verified through Google Identity OAuth. Password overrides or modifications must be executed through your Google account security settings directly.
                      </p>
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 font-bold text-[#b07e3a] hover:text-[#c89348]"
                      >
                        Google Account settings <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Device Sessions */}
                <div className="space-y-3 border-t border-border/20 pt-6">
                  <h3 className="font-bold text-muted-foreground uppercase tracking-wider">Active Device Sessions</h3>
                  <div className="space-y-3">
                    {!dbUser?.sessions || dbUser.sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No active sessions mapped.</p>
                    ) : (
                      dbUser.sessions.map((sessionItem: any) => {
                        const isCurrentDevice = typeof window !== "undefined" && dbUser.sessions[dbUser.sessions.length - 1]?.id === sessionItem.id;
                        return (
                          <div key={sessionItem.id} className="p-3 bg-muted/5 border border-border/30 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="h-9 w-9 bg-white dark:bg-[#151c18] border border-border/30 rounded-xl flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                                {sessionItem.deviceType === "Mobile" ? <Smartphone className="h-4.5 w-4.5" /> : <Laptop className="h-4.5 w-4.5" />}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-foreground font-semibold truncate">{sessionItem.browser} on {sessionItem.os}</span>
                                  {isCurrentDevice && (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full">
                                      This Device
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                  IP: {sessionItem.ipAddress} · Active: {new Date(sessionItem.lastActive).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {!isCurrentDevice && (
                              <button
                                onClick={() => handleRevokeSession(sessionItem.id)}
                                className="h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
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
            )}
          </div>
        </div>

      </div>

      {/* ── OTP Verification Modal ── */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
                    <label className="font-bold text-muted-foreground uppercase tracking-wider font-mono">4-Digit Passcode</label>
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

      {/* Success Toast */}
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
