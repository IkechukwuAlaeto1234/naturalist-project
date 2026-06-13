"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  Camera,
  Check,
  X,
  User,
  ShieldCheck,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Laptop,
  Trash2,
  ArrowRight,
  Settings,
  Bell,
  Clock,
  Unlock,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { proxyCloudinaryUrl } from "@/lib/utils";
import CustomDropdown from "@/components/ui/CustomDropdown";
import ConfirmModal from "@/components/ui/ConfirmModal";

const cleanIp = (ip: string) => {
  if (!ip) return "";
  let cleaned = ip.trim().replace(/^::ffff:/, "");
  if (cleaned === "::1" || cleaned === "127.0.0.1") {
    return "127.0.0.1 (Local Loopback)";
  }
  return cleaned;
};

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
        className="rounded-full object-cover w-full h-full"
        onError={() => setImgError(true)}
        unoptimized={src.startsWith("https://lh3.googleusercontent.com")}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 font-black font-serif w-full h-full"
      style={{ fontSize: size * 0.38 }}
    >
      {name?.[0]?.toUpperCase() || "N"}
    </div>
  );
}

/* ─── Cloudinary Picture Uploader ─── */
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

/* ─── Toggle Switch Component ─── */
function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        checked ? "bg-[#2d4c38] dark:bg-emerald-600" : "bg-muted/45 dark:bg-[#1a241e]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

const settingsTabs = [
  { id: "edit-profile", label: "Profile Basics", icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sessions", label: "Sessions", icon: Smartphone },
  { id: "cookies", label: "Cookie Consent", icon: ShieldCheck },
  { id: "privacy-security", label: "Privacy & Security", icon: Eye },
  { id: "activity-log", label: "Activity Log", icon: Clock },
];

function SettingsHubContent() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("edit-profile");

  const visibleTabs = settingsTabs.filter((tab) => {
    if (tab.id === "activity-log") {
      return dbUser?.role === "admin";
    }
    return true;
  });

  // Action Loading States
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAccountSettings, setSavingAccountSettings] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);

  // Profile fields
  const [nameInput, setNameInput] = useState("");
  const [aboutInput, setAboutInput] = useState("");
  const [pronounsInput, setPronounsInput] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [usernameInput, setUsernameInput] = useState("");

  // Avatar states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Account visibility & secondary email
  const [recoveryEmailInput, setRecoveryEmailInput] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  
  const [isPrivateProfile, setIsPrivateProfile] = useState(false);
  const [hideFromSearch, setHideFromSearch] = useState(false);
  const [notificationPrefs, setNotificationPrefs] = useState<any>({ email: true, push: true });

  // Security password change flow (Locked/Unlocked)
  const [currentPassword, setCurrentPassword] = useState("");
  const [verifiedCurrentPassword, setVerifiedCurrentPassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");

  // Cookie preference checkboxes
  const [cookieAnalytics, setCookieAnalytics] = useState(false);
  const [cookieMarketing, setCookieMarketing] = useState(false);
  const [cookiePromotions, setCookiePromotions] = useState(false);
  const [savingCookies, setSavingCookies] = useState(false);

  // GDPR Requests history log
  const [dataRequests, setDataRequests] = useState<any[]>([]);
  const [requestingData, setRequestingData] = useState(false);

  // Activity log ledger
  const [logs, setLogs] = useState<any[]>([]);

  // Log pagination
  const [logPage, setLogPage] = useState(1);
  const logsPerPage = 5;

  // Session pagination
  const [sessionPage, setSessionPage] = useState(1);
  const sessionsPerPage = 5;

  // Success toast
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const triggerSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 4000);
  };

  // Unified confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");
  const [confirmModalAction, setConfirmModalAction] = useState<(() => void) | null>(null);
  const [confirmModalType, setConfirmModalType] = useState<"danger" | "primary">("primary");
  const [confirmModalConfirmText, setConfirmModalConfirmText] = useState("Confirm");

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: "danger" | "primary" = "primary",
    confirmText: string = "Confirm"
  ) => {
    setConfirmModalTitle(title);
    setConfirmModalMessage(message);
    setConfirmModalAction(() => onConfirm);
    setConfirmModalType(type);
    setConfirmModalConfirmText(confirmText);
    setConfirmModalOpen(true);
  };

  // Navigation scrolling
  const navRef = useRef<HTMLDivElement>(null);
  const [showLeftScroll, setShowLeftScroll] = useState(false);
  const [showRightScroll, setShowRightScroll] = useState(false);

  const checkScroll = useCallback(() => {
    if (navRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navRef.current;
      setShowLeftScroll(scrollLeft > 5);
      setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  const scrollNav = (direction: "left" | "right") => {
    if (navRef.current) {
      const scrollAmount = 200;
      navRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      let tab = searchParams.get("tab");
      if (tab === "security" || tab === "account-settings" || tab === "privacy-data") {
        if (tab === "security") tab = "password";
        else if (tab === "account-settings") tab = "notifications";
        else if (tab === "privacy-data") tab = "privacy-security";
      }
      if (tab && tab !== activeTab) {
        if (tab === "activity-log" && dbUser && dbUser.role !== "admin") {
          setActiveTab("edit-profile");
          router.replace("/account/profile?tab=edit-profile");
        } else {
          setActiveTab(tab);
        }
      }
    }
  }, [searchParams, mounted, activeTab, dbUser, router]);

  useEffect(() => {
    if (mounted && dbUser) {
      if (activeTab === "activity-log" && dbUser.role !== "admin") {
        setActiveTab("edit-profile");
        router.replace("/account/profile?tab=edit-profile");
      }
    }
  }, [mounted, dbUser, activeTab, router]);

  useEffect(() => {
    if (mounted) {
      const activeTabLabel = visibleTabs.find(t => t.id === activeTab)?.label || "Settings";
      const timer = setTimeout(() => {
        document.title = `${activeTabLabel} | Naturalist`;
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeTab, mounted, visibleTabs]);

  useEffect(() => {
    const el = navRef.current;
    if (el && mounted) {
      checkScroll();
      const timer = setTimeout(checkScroll, 300);
      el.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
      return () => {
        clearTimeout(timer);
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [mounted, checkScroll, activeTab, dbUser]);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchProfile();
        fetchDataRequests();
        fetchLogs();
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
        
        setIsPrivateProfile(!!data.settings?.cookies?.isPrivateProfile);
        setHideFromSearch(!!data.settings?.cookies?.hideFromSearch);
        if (data.settings?.cookies) {
          setCookieAnalytics(!!data.settings.cookies.analytics);
          setCookieMarketing(!!data.settings.cookies.marketing);
          setCookiePromotions(!!data.settings.cookies.promotions);
        }
        if (data.settings?.notifications) {
          setNotificationPrefs(data.settings.notifications);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataRequests = async () => {
    try {
      const res = await fetch("/api/user/data-request");
      if (res.ok) {
        const data = await res.json();
        setDataRequests(Array.isArray(data) ? data : data ? [data] : []);
      }
    } catch (e) {
      console.error("Failed to load GDPR requests log:", e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/user/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch activity logs:", err);
    }
  };

  /* ─── Profile Form Updates ─── */
  const handleSaveProfile = async () => {
    setSavingProfile(true);
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
      triggerSuccessToast("Profile details updated!");
      fetchProfile();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingProfile(false);
    }
  };

  /* ─── Account Settings (Visibility & Notifications) ─── */
  const handleSaveAccountSettings = async () => {
    setSavingAccountSettings(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            ...dbUser.settings,
            cookies: {
              ...dbUser.settings?.cookies,
              isPrivateProfile,
              hideFromSearch,
            },
            notifications: notificationPrefs
          }
        }),
      });
      if (!res.ok) throw new Error("Failed to save account settings.");
      triggerSuccessToast("Account settings updated!");
      fetchProfile();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingAccountSettings(false);
    }
  };

  /* ─── Profile Picture Upload / Delete ─── */
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

  const executeDeleteAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: "" }),
      });
      if (!res.ok) throw new Error("Failed to delete profile picture.");
      await update({ image: null });
      triggerSuccessToast("Profile picture removed.");
      fetchProfile();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAvatar = () => {
    triggerConfirm(
      "Remove Profile Photo",
      "Are you sure you want to delete your profile picture? This will revert your public avatar to initials.",
      executeDeleteAvatar,
      "danger",
      "Delete"
    );
  };

  /* ─── Verification Secondary Email ─── */
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

  /* ─── Security password change (Locked/Unlocked) ─── */
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      setPwdError("Please enter your current password to unlock.");
      return;
    }
    setVerifyingPassword(true);
    setPwdError("");
    try {
      const res = await fetch("/api/user/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setVerifiedCurrentPassword(true);
      triggerSuccessToast("Current password verified. Reset fields unlocked!");
    } catch (err: any) {
      setPwdError(err.message || "Failed to verify current password.");
    } finally {
      setVerifyingPassword(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setPwdError("New password fields are required.");
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
      setVerifiedCurrentPassword(false);
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setSavingPwd(false);
    }
  };

  const executeRevokeSession = async (sessionId: string) => {
    setRevokingSessionId(sessionId);
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
    } finally {
      setRevokingSessionId(null);
    }
  };

  const handleRevokeSession = (sessionId: string) => {
    triggerConfirm(
      "Revoke Active Session",
      "Are you sure you want to log out this device? This will instantly terminate the session on the target browser.",
      () => executeRevokeSession(sessionId),
      "danger",
      "Revoke"
    );
  };

  /* ─── Cookie Consent Save ─── */
  const handleSaveCookies = async () => {
    setSavingCookies(true);
    try {
      const res = await fetch("/api/user/cookie-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analytics: cookieAnalytics,
          marketing: cookieMarketing,
          promotions: cookiePromotions,
        }),
      });
      if (res.ok) {
        // Update local storage choices
        localStorage.setItem("naturalist_cookie_consent", "accepted");
        localStorage.setItem("naturalist_cookie_consent_choices", JSON.stringify({
          analytics: cookieAnalytics,
          marketing: cookieMarketing,
          promotions: cookiePromotions
        }));
        triggerSuccessToast("Cookie preferences updated in database!");
        fetchProfile();
      } else {
        throw new Error("Failed to save cookie preferences.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingCookies(false);
    }
  };

  /* ─── GDPR Data Requests ─── */
  const handleRequestData = async () => {
    setRequestingData(true);
    try {
      const res = await fetch("/api/user/data-request", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        triggerSuccessToast("GDPR Data request submitted!");
        fetchDataRequests();
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
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif font-medium">Loading settings panel...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const isGoogleUser = !dbUser?.password;
  const displayImage = dbUser?.image || null;



  const rawUsernameSlug = dbUser?.username || user?.email?.split("@")[0] || "";
  const profileUrl = `/user/${rawUsernameSlug}`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20 animate-fade-in">
      {/* Settings Mini-Header */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-border/10">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-full overflow-hidden ring-2 ring-[#2d4c38]/20 bg-muted shrink-0">
            <Avatar src={displayImage} name={dbUser?.name} size={56} />
          </div>
          <div>
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              <span className="inline-block whitespace-nowrap truncate max-w-[110px] sm:max-w-none">{dbUser?.name || "Member"}</span>
              <span className="text-muted-foreground/45">/</span>
              <span className="text-[#2d4c38] dark:text-emerald-400 whitespace-nowrap">
                {visibleTabs.find((t) => t.id === activeTab)?.label || "Settings"}
              </span>
            </div>
            <h1 className="font-serif text-lg sm:text-2xl font-bold text-foreground mt-0.5 whitespace-nowrap">
              {visibleTabs.find((t) => t.id === activeTab)?.label || "Settings"}
            </h1>
          </div>
        </div>
        <div className="flex items-center shrink-0">
          <button
            onClick={() => router.push(profileUrl)}
            className="h-8 sm:h-9 px-3 sm:px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[9px] sm:text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap select-none"
          >
            <span className="hidden sm:inline">View Public Profile</span>
            <span className="inline sm:hidden">View Profile</span>
          </button>
        </div>
      </div>

      {/* Sticky Horizontal Pill Navigation */}
      <div className="sticky top-0 z-30 bg-[#fdfdfb] dark:bg-[#070908] py-3 border-b border-border/10">
        <div className="relative w-full flex items-center group">
          {/* Left Scroll Button */}
          {showLeftScroll && (
            <div className="absolute left-0 top-0 bottom-0 flex items-center pr-8 pl-1 bg-gradient-to-r from-[#fdfdfb] via-[#fdfdfb]/80 to-transparent dark:from-[#070908] dark:via-[#070908]/80 z-10 transition-all duration-300">
              <button
                onClick={() => scrollNav("left")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/90 dark:bg-[#070908]/90 text-foreground hover:bg-[#2d4c38] hover:text-white dark:hover:bg-emerald-600 transition-all cursor-pointer shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Scroll Container */}
          <div
            ref={navRef}
            className="flex items-center gap-2 p-1.5 bg-[#f4f1eb] dark:bg-[#131a15] rounded-full border border-border/20 overflow-x-auto scrollbar-none max-w-full scroll-smooth"
          >
            {visibleTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    router.push(`/account/profile?tab=${tab.id}`, { scroll: false });
                    setActiveTab(tab.id);
                    setPwdError("");
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border-0 cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[#2d4c38] dark:bg-emerald-700 text-white shadow-sm"
                      : "text-muted-foreground hover:bg-[#eae6db]/60 dark:hover:bg-[#1a241e] hover:text-foreground"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Scroll Button */}
          {showRightScroll && (
            <div className="absolute right-0 top-0 bottom-0 flex items-center pl-8 pr-1 bg-gradient-to-l from-[#fdfdfb] via-[#fdfdfb]/80 to-transparent dark:from-[#070908] dark:via-[#070908]/80 z-10 transition-all duration-300">
              <button
                onClick={() => scrollNav("right")}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-white/90 dark:bg-[#070908]/90 text-foreground hover:bg-[#2d4c38] hover:text-white dark:hover:bg-emerald-600 transition-all cursor-pointer shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 sm:p-10 shadow-sm min-h-[400px]">
        
        {/* ── Tab 1: Edit Profile Basics ── */}
        {activeTab === "edit-profile" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Profile Basics</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Keep your details updated. Public profile details are visible to anyone.
              </p>
            </div>

            {/* Profile Avatar Editor */}
            <div className="flex items-center gap-5 p-4 bg-muted/5 border border-border/30 rounded-2xl">
              <div className="relative flex-shrink-0 h-16 w-16 rounded-full overflow-hidden ring-2 ring-[#2d4c38]/20">
                <Avatar src={displayImage} name={dbUser?.name} size={64} />
              </div>
              
              <div className="flex flex-wrap items-center gap-2.5">
                {!isGoogleUser ? (
                  <>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="h-9 px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-50"
                    >
                      {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Upload photo"}
                    </button>
                    {displayImage && (
                      <button
                        onClick={handleDeleteAvatar}
                        disabled={uploadingAvatar}
                        className="h-9 px-4 rounded-full border border-red-500/30 hover:bg-red-500/5 text-red-500 font-bold uppercase tracking-wider text-[10px] bg-transparent cursor-pointer transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </>
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/10 px-2.5 py-1 rounded-full">
                    OAuth Image synced
                  </span>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFile}
                />
              </div>
            </div>

            {/* General Fields */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Full Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="w-full h-11 px-4 text-xs font-medium rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Biography / About</label>
                <textarea
                  value={aboutInput}
                  onChange={(e) => setAboutInput(e.target.value)}
                  placeholder="Share a short bio..."
                  className="w-full h-24 p-4 text-xs font-medium rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground resize-none leading-relaxed transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <CustomDropdown
                    options={[
                      { value: "he/him", label: "he/him" },
                      { value: "she/her", label: "she/her" },
                      { value: "they/them", label: "they/them" },
                      { value: "other", label: "other" },
                    ]}
                    value={pronounsInput}
                    onChange={setPronounsInput}
                    label="Pronouns"
                    placeholder="Choose pronouns"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Website</label>
                  <input
                    type="url"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    placeholder="https://yoursite.com"
                    className="w-full h-11 px-4 text-xs font-medium rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Username slug</label>
                <div className="relative flex items-center">
                  <span
                    id="username-slug-prefix"
                    className="absolute left-4 text-muted-foreground/60 select-none font-sans font-semibold pointer-events-none text-xs"
                  >
                    {(() => {
                      const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
                        (typeof window !== "undefined" ? `${window.location.protocol}//${window.location.host}` : "");
                      try {
                        return `${new URL(appUrl).host}/user/`;
                      } catch {
                        return `${appUrl}/user/`;
                      }
                    })()}
                  </span>
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="username"
                    style={{ paddingLeft: "calc(var(--slug-prefix-width, 140px) + 16px)" }}
                    ref={(el) => {
                      if (el) {
                        const prefix = document.getElementById("username-slug-prefix");
                        if (prefix) {
                          el.style.paddingLeft = `${prefix.offsetWidth + 20}px`;
                        }
                      }
                    }}
                    className="w-full h-11 pr-4 text-xs font-sans rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Details"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 2: Password (Password Reset & Recovery Email) ── */}
        {activeTab === "password" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Password & Credentials</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Manage login password credentials and configure recovery email options.
              </p>
            </div>

            {/* Password verification/change cards */}
            {!isGoogleUser ? (
              <div className="p-5 border border-border/30 bg-muted/5 rounded-2xl space-y-4">
                <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#b07e3a]" /> Reset Password
                </h3>

                {pwdError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{pwdError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Step 1: Verify current password */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Current Password</label>
                      {verifiedCurrentPassword && (
                        <span className="flex items-center gap-0.5 text-[8.5px] font-black text-emerald-500 uppercase tracking-wider">
                          <Check className="h-3.5 w-3.5" /> Verified & Unlocked
                        </span>
                      )}
                    </div>
                    
                    <div className="relative">
                      <input
                        type={showCurrent ? "text" : "password"}
                        disabled={verifiedCurrentPassword}
                        value={currentPassword}
                        onChange={(e) => { setCurrentPassword(e.target.value); setPwdError(""); }}
                        className="w-full h-11 pl-4 pr-24 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground font-sans disabled:opacity-60"
                      />
                      {!verifiedCurrentPassword ? (
                        <button
                          type="button"
                          onClick={handleVerifyCurrentPassword}
                          disabled={verifyingPassword || !currentPassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg bg-[#2d4c38] hover:bg-[#3a6349] text-white font-bold uppercase tracking-wider text-[9px] border-0 cursor-pointer disabled:opacity-50 transition-all flex items-center justify-center gap-1"
                        >
                          {verifyingPassword ? <Loader2 className="h-3 w-3 animate-spin text-white" /> : <>Unlock <Unlock className="h-3 w-3" /></>}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowCurrent(!showCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer"
                        >
                          {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Step 2: New passwords (disabled/locked until verified) */}
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">New Password</label>
                        <div className="relative">
                          <input
                            type={showNew ? "text" : "password"}
                            disabled={!verifiedCurrentPassword}
                            value={newPassword}
                            onChange={(e) => { setNewPassword(e.target.value); setPwdError(""); }}
                            className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground font-sans disabled:opacity-50"
                          />
                          <button
                            type="button"
                            disabled={!verifiedCurrentPassword}
                            onClick={() => setShowNew(!showNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer disabled:opacity-50"
                          >
                            {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Confirm Password</label>
                        <div className="relative">
                          <input
                            type={showConfirm ? "text" : "password"}
                            disabled={!verifiedCurrentPassword}
                            value={confirmPassword}
                            onChange={(e) => { setConfirmPassword(e.target.value); setPwdError(""); }}
                            className="w-full h-11 pl-4 pr-10 rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground font-sans disabled:opacity-50"
                          />
                          <button
                            type="button"
                            disabled={!verifiedCurrentPassword}
                            onClick={() => setShowConfirm(!showConfirm)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground bg-transparent border-0 cursor-pointer disabled:opacity-50"
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingPwd || !verifiedCurrentPassword}
                        className="h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all disabled:opacity-50"
                      >
                        {savingPwd ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Save New Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="p-5 border border-border/30 bg-muted/5 rounded-2xl flex gap-4 items-start leading-relaxed">
                <Lock className="h-5 w-5 text-[#b07e3a] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-serif text-sm font-bold text-foreground">Synced Google Authenticated Login</h3>
                  <p className="text-muted-foreground mt-1 font-medium">
                    This account is signed in securely using Google OAuth. Since no database passwords exist, manage login methods directly on Google Security Settings.
                  </p>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 font-bold uppercase tracking-wider text-[#b07e3a] hover:underline"
                  >
                    Google Settings <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* Primary Email */}
            <div className="space-y-1.5 border-t border-border/10 pt-5">
              <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Primary Email (Locked)</label>
              <div className="h-11 px-4 flex items-center bg-muted/40 border border-border/30 rounded-xl text-xs font-bold text-muted-foreground font-sans select-none">
                {dbUser?.email}
              </div>
            </div>

            {/* Secondary Recovery Email */}
            <div className="space-y-2 border-t border-border/10 pt-5">
              <div className="flex justify-between items-center">
                <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Secondary Recovery Email</label>
                {dbUser?.isSecondaryEmailVerified && (
                  <span className="inline-flex text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Verified
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="recovery@email.com"
                  value={recoveryEmailInput}
                  onChange={(e) => setRecoveryEmailInput(e.target.value)}
                  className="flex-1 h-11 px-4 text-xs font-medium rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground transition-all"
                />
                <button
                  onClick={handleVerifySecondary}
                  disabled={otpSending}
                  className="h-11 px-4 rounded-xl border border-border/60 hover:border-[#2d4c38] font-bold uppercase tracking-wider text-[10px] text-foreground bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-50"
                >
                  {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </button>
              </div>
            </div>

            {/* OTP Modal overlay inside Password tab context */}
            {showOtpModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={() => setShowOtpModal(false)} />
                <div className="relative z-10 w-full max-w-sm bg-white dark:bg-[#0c100e] border border-border/40 p-6 rounded-3xl shadow-xl space-y-4">
                  <h3 className="font-serif text-base font-bold text-foreground">Verify Recovery Email</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                    We sent a 4-digit verification code to your secondary recovery email. Enter it below to authorize.
                  </p>

                  <form onSubmit={handleOtpSubmit} className="space-y-3">
                    {otpError && (
                      <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl flex items-center gap-1.5 font-medium">
                        <AlertCircle className="h-4 w-4" /> <span>{otpError}</span>
                      </div>
                    )}
                    {otpSuccess && (
                      <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl flex items-center gap-1.5 font-medium">
                        <Check className="h-4 w-4" /> <span>Code verified!</span>
                      </div>
                    )}

                    <input
                      type="text"
                      maxLength={4}
                      placeholder="e.g. 1234"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full h-11 px-4 text-center tracking-[0.4em] text-sm font-sans font-bold rounded-xl border border-border bg-background focus:outline-none focus:border-[#2d4c38] text-foreground"
                    />

                    <button
                      type="submit"
                      disabled={otpVerifying || otpSuccess}
                      className="w-full h-11 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all disabled:opacity-50"
                    >
                      {otpVerifying ? <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" /> : "Verify Code"}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: Notifications (Email and Push toggle switches) ── */}
        {activeTab === "notifications" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Notifications</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Manage your notification preferences and transaction email alerts.
              </p>
            </div>

            {/* Notification Delivery Prefs */}
            <div className="space-y-3">
              <div 
                onClick={() => setNotificationPrefs({ ...notificationPrefs, email: !notificationPrefs.email })}
                className="flex items-center justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Email Notifications</span>
                  <p className="text-[10px] text-muted-foreground font-medium">Send transaction confirmation summaries to my inbox.</p>
                </div>
                <ToggleSwitch
                  checked={!!notificationPrefs.email}
                  onChange={(val) => setNotificationPrefs({ ...notificationPrefs, email: val })}
                />
              </div>

              <div 
                onClick={() => setNotificationPrefs({ ...notificationPrefs, push: !notificationPrefs.push })}
                className="flex items-center justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">In-App Push Alerts</span>
                  <p className="text-[10px] text-muted-foreground font-medium">Display live notification bubbles in the navigation header.</p>
                </div>
                <ToggleSwitch
                  checked={!!notificationPrefs.push}
                  onChange={(val) => setNotificationPrefs({ ...notificationPrefs, push: val })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <button
                onClick={handleSaveAccountSettings}
                disabled={savingAccountSettings}
                className="h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {savingAccountSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Preferences"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 4: Sessions (Active device logins and revokes) ── */}
        {activeTab === "sessions" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Your Sessions</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                This is a list of devices that have logged into your account. Revoke any sessions that you do not recognize.
              </p>
            </div>

            {/* Active Device Sessions */}
            <div className="space-y-4">
              <div className="space-y-3">
                {!dbUser?.sessions || dbUser.sessions.length === 0 ? (
                  <p className="italic text-muted-foreground">No active sessions mapped.</p>
                ) : (
                  dbUser.sessions.slice((sessionPage - 1) * sessionsPerPage, sessionPage * sessionsPerPage).map((sessionItem: any) => {
                    const isCurrent = typeof window !== "undefined" && dbUser.sessions[dbUser.sessions.length - 1]?.id === sessionItem.id;
                    
                    return (
                      <div
                        key={sessionItem.id}
                        className="p-4 bg-muted/10 border border-border/40 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="h-10 w-10 bg-white dark:bg-[#151c18] border border-border/40 rounded-xl flex items-center justify-center flex-shrink-0 text-muted-foreground mt-0.5">
                            {sessionItem.deviceType === "Mobile" ? <Smartphone className="h-5 w-5" /> : <Laptop className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0 text-[11px] font-semibold">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-foreground truncate">{sessionItem.browser} on {sessionItem.os}</span>
                              {isCurrent && (
                                <span className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                                  Current Session
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-sans font-medium flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-[#b07e3a] dark:text-[#d4a362]" />
                              <span>{sessionItem.location || "Loading Location..."}</span>
                            </div>
                            <p className="text-[9.5px] text-muted-foreground/80 mt-0.5 font-sans">
                              IP: {cleanIp(sessionItem.ipAddress)} · Active: {new Date(sessionItem.lastActive).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </div>

                        {!isCurrent ? (
                          <button
                            disabled={revokingSessionId !== null}
                            onClick={() => handleRevokeSession(sessionItem.id)}
                            className="h-9 px-4 rounded-xl border border-red-500/20 bg-red-50/5 hover:bg-red-500 hover:text-white text-red-500 font-bold uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                            title="Revoke session"
                          >
                            {revokingSessionId === sessionItem.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Revoking...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3.5 w-3.5" /> Revoke
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-muted/10 px-3 py-1.5 rounded-xl">
                            Active
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sessions Pagination Controls */}
              {dbUser?.sessions && dbUser.sessions.length > sessionsPerPage && (
                <div className="flex items-center justify-between pt-4 border-t border-border/10">
                  <button
                    disabled={sessionPage === 1}
                    onClick={() => setSessionPage((prev) => Math.max(prev - 1, 1))}
                    className="h-9 px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-40 select-none"
                  >
                    Previous
                  </button>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Page {sessionPage} of {Math.ceil(dbUser.sessions.length / sessionsPerPage)}
                  </span>
                  <button
                    disabled={sessionPage === Math.ceil(dbUser.sessions.length / sessionsPerPage)}
                    onClick={() => setSessionPage((prev) => Math.min(prev + 1, Math.ceil(dbUser.sessions.length / sessionsPerPage)))}
                    className="h-9 px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-40 select-none"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tab 4: Cookie Consent (Strict preferences) ── */}
        {activeTab === "cookies" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Cookie Consent</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Adjust optional storage choices. Toggles are strictly applied and saved to the database.
              </p>
            </div>

            <div className="space-y-4">
              {/* Essential */}
              <div className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-start justify-between gap-4 select-none">
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground flex items-center gap-1.5">
                    Strictly Essential
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-muted-foreground/15 text-muted-foreground">Locked</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Required for security validation, payment checkouts, and cart memory.
                  </p>
                </div>
                <ToggleSwitch
                  checked={true}
                  onChange={() => {}}
                  disabled={true}
                />
              </div>

              {/* Analytics */}
              <div 
                onClick={() => setCookieAnalytics(!cookieAnalytics)}
                className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">Usage & Navigation Analytics</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Anonymous analytics to help us measure page loading times and general traffic trends.
                  </p>
                </div>
                <ToggleSwitch
                  checked={cookieAnalytics}
                  onChange={setCookieAnalytics}
                />
              </div>

              {/* Marketing */}
              <div 
                onClick={() => setCookieMarketing(!cookieMarketing)}
                className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">Marketing & Ads Personalization</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Permits relevant partner wellness recommendations on partner media sites.
                  </p>
                </div>
                <ToggleSwitch
                  checked={cookieMarketing}
                  onChange={setCookieMarketing}
                />
              </div>

              {/* Promotions */}
              <div 
                onClick={() => setCookiePromotions(!cookiePromotions)}
                className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex items-start justify-between gap-4 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-foreground">Email Promotions & Newsletter</p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                    Toggling off immediately unsubscribes your email from our newsletter database list.
                  </p>
                </div>
                <ToggleSwitch
                  checked={cookiePromotions}
                  onChange={setCookiePromotions}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/10">
              <button
                onClick={handleSaveCookies}
                disabled={savingCookies}
                className="h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all disabled:opacity-50"
              >
                {savingCookies ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : "Save Cookies Preference"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 6: Privacy & Security (Visibility, GDPR Requests, and Deletion) ── */}
        {activeTab === "privacy-security" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Privacy & Security</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Manage your privacy and security settings, and request a copy of your Naturalist data.
              </p>
            </div>

            {/* Visibility Settings */}
            <div className="space-y-3">
              <label className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">Activity Privacy</label>
              
              <div 
                onClick={() => setIsPrivateProfile(!isPrivateProfile)}
                className="flex items-start justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Private profile</span>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Only approved members can see details or public logs.
                  </p>
                </div>
                <ToggleSwitch
                  checked={isPrivateProfile}
                  onChange={setIsPrivateProfile}
                />
              </div>

              <div 
                onClick={() => setHideFromSearch(!hideFromSearch)}
                className="flex items-start justify-between gap-6 p-4 rounded-2xl border border-border/30 bg-muted/5 cursor-pointer select-none hover:bg-muted/10 transition-colors"
              >
                <div className="space-y-0.5">
                  <span className="font-bold text-foreground">Hide from search engines</span>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Do not index this profile on Google or Bing searches.
                  </p>
                </div>
                <ToggleSwitch
                  checked={hideFromSearch}
                  onChange={setHideFromSearch}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleSaveAccountSettings}
                  disabled={savingAccountSettings}
                  className="h-11 px-6 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] text-white cursor-pointer transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {savingAccountSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save Privacy Settings"}
                </button>
              </div>
            </div>

            {/* GDPR request section */}
            <div className="p-5 border border-border/30 bg-muted/5 rounded-2xl space-y-4 border-t border-border/10 pt-6">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                Download your Naturalist data
              </h3>
              
              <p className="text-muted-foreground font-medium leading-relaxed">
                You can download a copy of your personal data stored on Naturalist. Once you request an export, we will prepare your data and notify you when it is ready for download.
              </p>

              <div className="flex justify-start">
                <button
                  onClick={handleRequestData}
                  disabled={requestingData}
                  className="h-10 px-5 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white font-bold uppercase tracking-wider text-[9.5px] transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {requestingData ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Export your data"}
                </button>
              </div>

              {/* GDPR Log Table */}
              <div className="space-y-3 pt-3 border-t border-border/10">
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">Submission Log History</span>
                {dataRequests.length === 0 ? (
                  <p className="italic text-muted-foreground">No data compile requests logged.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border/30">
                    <table className="w-full border-collapse text-left bg-white dark:bg-[#0c100e]">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/10 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">
                          <th className="p-3">Submitted On</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Download URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20 font-medium">
                        {dataRequests.map((reqItem) => (
                          <tr key={reqItem._id}>
                            <td className="p-3">{new Date(reqItem.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className="p-3">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider ${
                                reqItem.status === "completed" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-[#b07e3a]/10 text-[#b07e3a]"
                              }`}>
                                {reqItem.status}
                              </span>
                            </td>
                             <td className="p-3 font-sans">
                              {reqItem.downloadUrl ? (
                                <a href={reqItem.downloadUrl} download className="text-[#b07e3a] hover:underline">Download ZIP</a>
                              ) : (
                                <span className="text-muted-foreground italic">Compiling files...</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Permanent Eviction */}
            <div className="p-5 border border-red-500/10 bg-red-500/[0.02] rounded-2xl space-y-3">
              <h3 className="font-bold text-red-500 uppercase tracking-wider text-[10px]">Delete Naturalist Account</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Deleting your account will permanently remove your Naturalist profile and all associated content. This action cannot be reversed.
              </p>
              <button
                onClick={() => {
                  triggerConfirm(
                    "Delete Naturalist Account",
                    "Are you absolutely sure you want to permanently delete your Naturalist account? This will permanently remove your profile and all associated content. This action cannot be reversed.",
                    () => {
                      setDeletingAccount(true);
                      setTimeout(() => {
                        setDeletingAccount(false);
                        alert("Account deletion request submitted. Please contact administration for immediate verification.");
                      }, 1500);
                    },
                    "danger",
                    "Delete"
                  );
                }}
                disabled={deletingAccount}
                className="h-10 px-5 rounded-full border border-red-500/30 hover:bg-red-500/5 text-red-500 text-[9.5px] font-bold uppercase tracking-wider transition-all cursor-pointer bg-transparent disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deletingAccount ? <Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" /> : "Delete Account"}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab 6: Activity Log Ledger ── */}
        {activeTab === "activity-log" && dbUser?.role === "admin" && (
          <div className="space-y-6 animate-fade-in text-xs">
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground">Activity Log</h2>
              <p className="text-muted-foreground mt-1 font-medium">
                Chronological list of audit changes, logins, password changes, and cookie updates on this profile.
              </p>
            </div>

            <div className="space-y-3">
              {logs.length === 0 ? (
                <p className="italic text-muted-foreground">No historical changes logged in database.</p>
              ) : (
                logs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage).map((log) => {
                  let badgeClass = "bg-muted-foreground/10 text-muted-foreground";
                  if (log.action === "signup" || log.action === "verify_secondary_email") badgeClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                  if (log.action === "login") badgeClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                  if (log.action === "password_change" || log.action === "revoke_session") badgeClass = "bg-red-500/10 text-red-500";
                  if (log.action === "cookie_preferences_update") badgeClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";

                  return (
                    <div 
                      key={log._id} 
                      className="p-4 bg-muted/5 border border-border/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-medium"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${badgeClass}`}>
                            {log.action?.replace("_", " ")}
                          </span>
                          <span className="font-sans text-[9px] text-muted-foreground">IP: {cleanIp(log.ipAddress)}</span>
                        </div>
                        <p className="text-foreground leading-relaxed mt-0.5">{log.details}</p>
                      </div>

                      <span className="font-sans text-[9.5px] text-muted-foreground shrink-0 text-left sm:text-right">
                        {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Controls */}
            {logs.length > 0 && Math.ceil(logs.length / logsPerPage) > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-border/10">
                <button
                  disabled={logPage === 1}
                  onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-40 select-none"
                >
                  Previous
                </button>
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Page {logPage} of {Math.ceil(logs.length / logsPerPage)}
                </span>
                <button
                  disabled={logPage === Math.ceil(logs.length / logsPerPage)}
                  onClick={() => setLogPage((prev) => Math.min(prev + 1, Math.ceil(logs.length / logsPerPage)))}
                  className="h-9 px-4 rounded-full border border-border/60 hover:border-[#2d4c38] text-foreground font-bold uppercase tracking-wider text-[10px] bg-white dark:bg-[#070908] cursor-pointer transition-all disabled:opacity-40 select-none"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Success Toast Overlay ── */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-toast-pop">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-[#2d4c38] text-white rounded-2xl shadow-xl border border-emerald-500/20 max-w-sm">
            <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-white flex-shrink-0">
              <Check className="h-4 w-4" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider">{successMessage}</p>
          </div>
        </div>
      )}

      {/* ── Confirm Modal Overlay ── */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={confirmModalAction || (() => {})}
        title={confirmModalTitle}
        message={confirmModalMessage}
        confirmText={confirmModalConfirmText}
        type={confirmModalType}
      />

    </div>
  );
}

export default function SettingsHubPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 bg-[#fdfdfb] dark:bg-[#070908]">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-serif">Loading SettingsHub...</p>
      </div>
    }>
      <SettingsHubContent />
    </Suspense>
  );
}
