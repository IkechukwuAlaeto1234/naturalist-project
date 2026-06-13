"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Package,
  MapPin,
  Bell,
  Settings,
  ShieldAlert,
  Loader2,
  Calendar,
  Camera,
} from "lucide-react";
import Image from "next/image";

/* ─── Avatar Component ─── */
function Avatar({
  src,
  name,
  size = 96,
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

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
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
        setProfile(data);
      }
    } catch (err) {
      console.error("Failed to load profile in layout", err);
    } finally {
      setLoading(false);
    }
  };

  const handleHeaderAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5 MB.");
      return;
    }

    setUploadingAvatar(true);
    try {
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

      const { proxyCloudinaryUrl } = await import("@/lib/utils");
      const imageUrl = proxyCloudinaryUrl(upData.secure_url) as string;

      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile picture.");

      await update({ image: imageUrl });
      fetchProfile();
    } catch (err: any) {
      alert(err.message || "Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (headerFileInputRef.current) headerFileInputRef.current.value = "";
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-2 bg-[#fdfdfb] dark:bg-[#070908]">
        <Loader2 className="h-9 w-9 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Loading...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const displayName = profile?.name || user?.name || "Member";
  const displayImage = profile?.image || user?.image || null;
  const username = profile?.username ? `@${profile.username}` : user?.email?.split("@")[0] || "";
  const locationStr = profile?.shippingAddress?.city && profile?.shippingAddress?.country
    ? `${profile.shippingAddress.city}, ${profile.shippingAddress.country}`
    : null;

  // Format account created date
  let memberSince = "Member";
  if (profile?.createdAt) {
    const dateObj = new Date(profile.createdAt);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    memberSince = `Member since ${formattedDate}`;
  }

  const isAdmin = profile?.role === "admin";

  const tabs = [
    { label: "Overview", mobileLabel: "Overview", path: "/account", icon: User },
    { label: "Orders Made", mobileLabel: "Orders", path: "/account/orders", icon: Package },
    { label: "Addresses", mobileLabel: "Addresses", path: "/account/addresses", icon: MapPin },
  ];

  const rawUsernameSlug = profile?.username || user?.email?.split("@")[0] || "";
  const profileUrl = `/user/${rawUsernameSlug}`;

  if (pathname === "/account/profile" || pathname.startsWith("/account/notifications")) {
    return (
      <div className="w-full min-h-screen bg-[#fdfdfb] dark:bg-[#070908] transition-colors duration-300">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fdfdfb] dark:bg-[#070908] transition-colors duration-300">
      
      {/* ── Header Area (MuseScore-inspired cover banner) ── */}
      <div className="relative w-full">
        {/* Cover banner (CSS gradient with organic grid and gold radial highlights) */}
        <div className="h-28 sm:h-36 md:h-40 w-full relative bg-gradient-to-r from-[#2d4c38] via-[#1e3427] to-[#122218] overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]">
          {/* Subtle gold radial glow at top right */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(176,126,58,0.18),transparent_65%)] pointer-events-none" />
          
          {/* Soft dot grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
          
          {/* Dark gradient mask for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        </div>

        {/* Profile Details Overlay Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-14 sm:-mt-18 pb-6 border-b border-border/20 dark:border-[#1a241e]/30 flex flex-col items-center text-center justify-center gap-4">
          
          {/* White-bordered overlapping circular avatar with camera overlay */}
          <div className="group relative h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-white dark:bg-[#070908] p-1.5 ring-4 ring-[#fdfdfb] dark:ring-[#070908] shadow-lg flex-shrink-0 z-10 flex items-center justify-center">
            <div className="block w-full h-full rounded-full overflow-hidden">
              {uploadingAvatar ? (
                <div className="flex items-center justify-center w-full h-full bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
                </div>
              ) : (
                <Avatar src={displayImage} name={displayName} size={128} />
              )}
            </div>
            
            {/* Camera Icon Overlay / Button */}
            <button
              type="button"
              onClick={() => headerFileInputRef.current?.click()}
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 p-2 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white cursor-pointer shadow-md transition-all z-20 border border-white dark:border-[#070908]"
              title="Upload Profile Picture"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            
            <input
              type="file"
              ref={headerFileInputRef}
              onChange={handleHeaderAvatarUpload}
              className="hidden"
              accept="image/*"
            />
          </div>
          
          <div className="space-y-2 flex flex-col items-center text-center">
            {/* Display Name */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {displayName}
            </h1>
            
            {/* Pronoun and role badge on the SAME line */}
            {(profile?.pronouns || isAdmin) && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {profile?.pronouns && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded bg-muted/40 text-muted-foreground">
                    {profile.pronouns}
                  </span>
                )}
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#b07e3a]/15 text-[#b07e3a] dark:text-[#d4a362] ring-1 ring-[#b07e3a]/30">
                    <ShieldAlert className="h-2.5 w-2.5" /> System Admin
                  </span>
                )}
              </div>
            )}
            
            {/* Subtext info row */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center text-xs text-muted-foreground font-medium">
              <Link href={profileUrl} className="text-[#b07e3a] dark:text-[#d4a362] hover:underline font-semibold">
                @{username.replace(/^@/, "")}
              </Link>
              <span className="opacity-60">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" /> {memberSince}
              </span>
              {locationStr && (
                <>
                  <span className="opacity-60">·</span>
                  <span className="flex items-center gap-0.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/80" /> {locationStr}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action Row — nowrap so buttons never stack or spread */}
          <div className="flex items-center justify-center gap-3 relative z-10 flex-nowrap shrink-0">
            <Link
              href="/account/profile"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/40 hover:border-[#2d4c38] dark:hover:border-emerald-500/50 bg-white dark:bg-[#0c100e] px-4 text-[10px] sm:px-5 sm:text-xs font-bold uppercase tracking-wider text-foreground hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all shadow-sm select-none cursor-pointer whitespace-nowrap"
            >
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" /> Edit Profile
            </Link>
            
            {isAdmin && (
              <Link
                href="/admin"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-4 sm:px-5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md select-none cursor-pointer whitespace-nowrap"
              >
                Admin Panel
              </Link>
            )}
          </div>

        </div>

        {/* Navigation Tab Deck — horizontally scrollable so tabs never spread or wrap */}
        <div className="max-w-6xl mx-auto mt-2 border-b border-border/10">
          <nav className="flex overflow-x-auto scrollbar-none justify-center px-4 sm:px-6 lg:px-8 select-none gap-1 sm:gap-0 sm:space-x-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = pathname === tab.path || (tab.path !== "/account" && pathname.startsWith(tab.path));
              return (
                <Link
                  key={tab.path}
                  href={tab.path}
                  className={`flex items-center gap-1.5 py-3.5 sm:py-4 px-2 sm:px-0 border-b-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? "border-[#2d4c38] text-[#2d4c38] dark:border-emerald-500 dark:text-emerald-400 font-extrabold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  <TabIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="inline sm:hidden">{tab.mobileLabel}</span>
                </Link>
              );
            })}
          </nav>
        </div>

      </div>

      {/* ── Content Canvas ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>

    </div>
  );
}
