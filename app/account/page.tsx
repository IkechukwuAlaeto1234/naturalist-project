"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Package,
  User,
  MapPin,
  LogOut,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Camera,
  Pencil,
  Check,
  X,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
} from "lucide-react";

/* ─── Tabs ─── */
const TABS = [
  { id: "orders",  label: "My Orders",      icon: Package },
  { id: "profile", label: "Profile",         icon: User    },
  { id: "security",label: "Security",        icon: Lock    },
  { id: "addresses", label: "Addresses",     icon: MapPin  },
];

/* ─── Avatar component ─── */
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

/* ─── Upload a new profile picture via Cloudinary signed upload ─── */
async function uploadToCloudinary(file: File): Promise<string> {
  // 1. Get signed upload params from server
  const sigRes = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "naturalist/avatars" }),
  });
  if (!sigRes.ok) throw new Error("Failed to get upload signature");
  const { signature, timestamp, cloudName, apiKey } = await sigRes.json();

  // 2. Upload directly to Cloudinary
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
  return upData.secure_url as string;
}

/* ═══════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════ */
export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");

  /* orders */
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  /* profile editing */
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState(false);

  /* avatar upload */
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarSuccess, setAvatarSuccess] = useState(false);

  /* password change */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);

  /* mount + redirect */
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => { document.title = "My Account | Naturalist"; }, 120);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") router.push("/login");
  }, [mounted, status]);

  const handleSignOut = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : process.env.NEXTAUTH_URL || "/";
    signOut({ callbackUrl: `${origin}/` });
  };

  /* fetch orders when tab opens — use stable user ID, not session object */
  useEffect(() => {
    const userId = (session?.user as any)?.id;
    if (userId && activeTab === "orders") {
      setLoadingOrders(true);
      fetch("/api/orders/my")
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setOrders(Array.isArray(data) ? data : []))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(session?.user as any)?.id, activeTab]);

  /* seed name input when editing starts */
  const startEditName = () => {
    setNameInput(session?.user?.name || "");
    setNameError("");
    setNameSuccess(false);
    setEditingName(true);
  };

  /* save name */
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
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch (e: any) {
      setNameError(e.message);
    } finally {
      setSavingName(false);
    }
  };

  /* upload avatar */
  const handleAvatarFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate type & size (max 5 MB)
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
      setAvatarSuccess(false);

      try {
        const url = await uploadToCloudinary(file);

        // Save URL to DB
        const res = await fetch("/api/user/profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: url }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to save profile picture.");

        // Update session so Navbar re-renders immediately
        await update({ image: url });
        setAvatarSuccess(true);
        setTimeout(() => setAvatarSuccess(false), 3000);
      } catch (e: any) {
        setAvatarError(e.message || "Upload failed. Please try again.");
      } finally {
        setUploadingAvatar(false);
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [update]
  );

  /* change password */
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError("Please fill in all password fields.");
      return;
    }
    if (newPassword.length < 6) {
      setPwdError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match.");
      return;
    }
    setSavingPwd(true);
    setPwdError("");
    setPwdSuccess(false);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password.");
      setPwdSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwdSuccess(false), 4000);
    } catch (e: any) {
      setPwdError(e.message);
    } finally {
      setSavingPwd(false);
    }
  };

  /* guard */
  if (!mounted || status === "loading") return null;
  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const isGoogleUser = !!user?.image && user.image.includes("googleusercontent.com");
  const displayImage = user?.image || null;
  const savedAddresses = orders.reduce<Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    reference: string;
    updatedAt: string;
  }>>((acc, order) => {
    const shipping = order?.shippingAddress;
    if (!shipping) return acc;

    const key = [
      shipping.name,
      shipping.address,
      shipping.city,
      shipping.state,
      shipping.zipCode,
      shipping.country,
      shipping.phone,
    ].join("|");

    if (!acc.some((item) => item.reference === key)) {
      acc.push({
        ...shipping,
        reference: key,
        updatedAt: order.updatedAt,
      });
    }

    return acc;
  }, []);

  return (
    <div className="flex flex-col w-full min-h-[70vh]">

      {/* ── Header banner ── */}
      <section className="w-full bg-white dark:bg-[#0a0d0b] border-b border-border/40 px-6 sm:px-8 py-10 transition-colors duration-300">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar (header) */}
            <div className="relative flex-shrink-0">
              <div className="h-14 w-14 rounded-2xl overflow-hidden ring-2 ring-[#2d4c38]/20 dark:ring-emerald-500/20">
                <Avatar src={displayImage} name={user?.name} size={56} />
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Welcome Back</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-0.5 tracking-tight">
                {user?.name || "My Account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/60 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </section>

      {/* ── Tabs + content ── */}
      <section className="w-full bg-white dark:bg-[#0a0d0b] py-10 px-6 sm:px-8 transition-colors duration-300 flex-1 pb-32">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Sidebar */}
          <nav className="lg:col-span-3 flex flex-row lg:flex-col gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 w-full text-left ${
                  activeTab === tab.id
                    ? "bg-[#2d4c38] text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Content panel */}
          <div className="lg:col-span-9 animate-fade-in-up">

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-4">
                <h2 className="font-serif text-xl font-bold text-foreground">Order History</h2>
                {loadingOrders ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : orders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-2xl bg-muted/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-4">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-foreground">No Orders Yet</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
                      Your ritual journey hasn't started yet. Explore our collection and place your first order.
                    </p>
                    <Link href="/shop" className="mt-6 flex h-10 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#203628] transition-all">
                      Browse the Shop <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {orders.map((order: any) => {
                      const statusKey = order.shippingStatus || "pending";
                      const reference = order.orderNumber || `#${order._id?.slice(-6).toUpperCase()}`;
                      const statusLabel =
                        statusKey === "pending"     ? "Pending" :
                        statusKey === "processing"  ? "Processing" :
                        statusKey === "shipped"     ? "Shipped" :
                        statusKey === "delivered"   ? "Delivered" :
                        statusKey === "cancelled"   ? "Cancelled" : "Pending";
                      const statusClass =
                        statusKey === "delivered"  ? "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400" :
                        statusKey === "shipped"    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                        statusKey === "cancelled"  ? "bg-destructive/10 text-destructive" :
                        "bg-[#b07e3a]/10 text-[#b07e3a]";
                      return (
                        <div
                          key={order._id}
                          className="flex flex-col gap-4 p-5 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] hover:shadow-md hover:border-[#2d4c38]/30 dark:hover:border-emerald-500/20 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 flex-shrink-0">
                                <Package className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">Order {reference}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                  {" · "}{order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                              <div className="text-left sm:text-right">
                                <p className="text-sm font-bold text-foreground">
                                  ${order.totalAmount != null ? order.totalAmount.toFixed(2) : "0.00"}
                                </p>
                                <span className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </div>

                              <Link
                                href={`/account/orders/${order._id}`}
                                className="inline-flex h-9 items-center justify-center rounded-full border border-[#2d4c38]/20 bg-[#2d4c38]/5 px-4 text-[11px] font-bold uppercase tracking-wider text-[#2d4c38] hover:bg-[#2d4c38] hover:text-white transition-all"
                              >
                                Track Order
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── PROFILE TAB ── */}
            {activeTab === "profile" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-xl font-bold text-foreground">Profile Details</h2>

                <div className="flex flex-col gap-6 p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411]">

                  {/* Avatar section */}
                  <div className="flex items-center gap-5 pb-6 border-b border-border/30 dark:border-[#232c26]/60">
                    {/* Avatar with upload overlay */}
                    <div className="relative flex-shrink-0">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden ring-2 ring-[#2d4c38]/20 dark:ring-emerald-500/20">
                        <Avatar src={displayImage} name={user?.name} size={80} />
                      </div>

                      {/* Camera button — only for non-Google users */}
                      {!isGoogleUser && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#2d4c38] hover:bg-[#3a6349] text-white shadow-md transition-all disabled:opacity-60"
                          title="Upload profile picture"
                        >
                          {uploadingAvatar
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Camera className="h-3.5 w-3.5" />
                          }
                        </button>
                      )}

                      {/* Hidden file input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg font-bold text-foreground truncate">{user?.name || "—"}</p>
                      <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
                      {user?.role === "admin" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] bg-[#b07e3a]/10 px-2 py-0.5 rounded-full mt-1 inline-block">
                          Admin
                        </span>
                      )}

                      {isGoogleUser ? (
                        <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
                          <svg className="h-3 w-3 inline-block" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          </svg>
                          Profile picture synced from Google
                        </p>
                      ) : (
                        <p className="text-[11px] text-muted-foreground mt-1.5">
                          {displayImage ? "Custom profile picture uploaded" : "Click the camera icon to upload a profile picture"}
                        </p>
                      )}

                      {/* Avatar feedback */}
                      {avatarError && (
                        <p className="text-[11px] text-destructive font-medium mt-1.5">{avatarError}</p>
                      )}
                      {avatarSuccess && (
                        <p className="text-[11px] text-[#2d4c38] dark:text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Profile picture updated!
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Name field */}
                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Full Name</span>

                    {editingName ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => { setNameInput(e.target.value); setNameError(""); }}
                          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-[#2d4c38]/40 bg-background focus:outline-none focus:ring-2 focus:ring-[#2d4c38]/40 transition-all"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveName();
                            if (e.key === "Escape") { setEditingName(false); setNameError(""); }
                          }}
                        />
                        <button
                          onClick={saveName}
                          disabled={savingName}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4c38] text-white hover:bg-[#3a6349] transition-all disabled:opacity-60"
                        >
                          {savingName ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => { setEditingName(false); setNameError(""); }}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-foreground font-medium">{user?.name || "—"}</span>
                        <button
                          onClick={startEditName}
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#b07e3a] hover:text-[#c89348] transition-colors"
                        >
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    )}

                    {nameError && <p className="text-[11px] text-destructive font-medium">{nameError}</p>}
                    {nameSuccess && (
                      <p className="text-[11px] text-[#2d4c38] dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" /> Name updated successfully!
                      </p>
                    )}
                  </div>

                  {/* Email field (read-only) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Email Address</span>
                    <span className="text-sm text-foreground font-medium">{user?.email || "—"}</span>
                    <span className="text-[11px] text-muted-foreground">Email address cannot be changed.</span>
                  </div>

                </div>
              </div>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === "security" && (
              <div className="flex flex-col gap-5">
                <h2 className="font-serif text-xl font-bold text-foreground">Security</h2>

                {/* ─ Auth method card ─ */}
                <div className="p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sign-in Method</p>
                    <p className="text-sm font-bold text-foreground mt-1">
                      {isGoogleUser ? "Google OAuth" : "Email & Password"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {isGoogleUser
                        ? "Your identity is verified through Google. Naturalist never stores your password."
                        : "You sign in with your email address and a password managed by Naturalist."}
                    </p>
                    {isGoogleUser ? (
                      <a
                        href="https://myaccount.google.com/security"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#b07e3a] hover:text-[#c89348] transition-colors"
                      >
                        Manage via Google Security <ArrowRight className="h-3 w-3" />
                      </a>
                    ) : (
                      <Link
                        href="/forgot-password"
                        className="inline-flex items-center gap-1.5 mt-3 text-[11px] font-semibold text-[#b07e3a] hover:text-[#c89348] transition-colors"
                      >
                        Forgot / reset your password <ArrowRight className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* ─ 2FA card (coming soon) ─ */}
                <div className="p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] flex items-start gap-4 opacity-70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#b07e3a]/10 text-[#b07e3a] flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="5" y="11" width="14" height="10" rx="2"/>
                      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                      <circle cx="12" cy="16" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</p>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#b07e3a]/15 text-[#b07e3a]">Coming Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Add an extra layer of protection with an authenticator app or SMS code every time you sign in.
                    </p>
                  </div>
                </div>

                {/* ─ Active sessions card (coming soon) ─ */}
                <div className="p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] flex items-start gap-4 opacity-70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <path d="M8 21h8M12 17v4"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">Active Sessions</p>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">Coming Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      View and revoke all devices where your account is currently signed in.
                    </p>
                  </div>
                </div>

                {/* ─ Login activity card (coming soon) ─ */}
                <div className="p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] flex items-start gap-4 opacity-70">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400 flex-shrink-0 mt-0.5">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-foreground">Login Activity Log</p>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">Coming Soon</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Review a full history of sign-in attempts, timestamps, and locations.
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ── ADDRESSES TAB ── */}
            {activeTab === "addresses" && (
              <div className="flex flex-col gap-6">
                <h2 className="font-serif text-xl font-bold text-foreground">Saved Addresses</h2>
                {savedAddresses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-2xl bg-muted/10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-4">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-foreground">No Addresses Saved</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
                      Your saved addresses will appear here after your first checkout. Address management is coming soon.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {savedAddresses.map((address) => (
                      <div key={address.reference} className="rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground">{address.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Used on {new Date(address.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#b07e3a]/10 text-[#b07e3a]">
                            Order Address
                          </span>
                        </div>
                        <div className="mt-4 text-sm leading-relaxed text-muted-foreground">
                          <p>{address.address}</p>
                          <p>{address.city}, {address.state} {address.zipCode}</p>
                          <p>{address.country}</p>
                          {address.phone && <p className="mt-1 text-xs">{address.phone}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </section>

    </div>
  );
}
