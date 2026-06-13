import React from "react";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";
import mongoose from "mongoose";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  MapPin,
  Globe,
  Settings,
  ShieldAlert,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

/* ─── Avatar Component ─── */
function Avatar({
  src,
  name,
  size = 120,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || "Profile"}
        className="rounded-full object-cover w-full h-full"
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

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  
  await connectToDatabase();

  let profile: any = null;
  
  // Resolve by username or MongoDB ID
  if (mongoose.Types.ObjectId.isValid(username)) {
    profile = await User.findById(username).select("-password -otp -otpExpires -resetToken -resetTokenExpires");
  } else {
    profile = await User.findOne({ username: username.toLowerCase().trim() }).select("-password -otp -otpExpires -resetToken -resetTokenExpires");
  }

  if (!profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-[#fdfdfb] dark:bg-[#070908] text-foreground transition-colors duration-300">
        <div className="h-16 w-16 bg-[#2d4c38]/10 text-[#2d4c38] rounded-full flex items-center justify-center mb-6">
          <Globe className="h-8 w-8 text-[#b07e3a]" />
        </div>
        <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">Profile Not Found</h1>
        <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">
          The requested user account "@username" does not exist or has been deactivated.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center px-6 rounded-full bg-[#2d4c38] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#b07e3a] transition-all shadow-md text-decoration-none"
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Get current session
  const session = await auth();
  const isOwner = session?.user?.id === String(profile._id);

  // Fetch some public products to show as "Favorite Remedies"
  const favoriteProducts = await Product.find({}).limit(3);

  // Format account created date
  let memberSince = "Member";
  if (profile.createdAt) {
    const dateObj = new Date(profile.createdAt);
    const formattedDate = dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    memberSince = `Member since ${formattedDate}`;
  }

  const isAdmin = profile.role === "admin";
  const locationStr = profile.shippingAddress?.city && profile.shippingAddress?.country
    ? `${profile.shippingAddress.city}, ${profile.shippingAddress.country}`
    : null;

  return (
    <div className="w-full min-h-screen bg-[#fdfdfb] dark:bg-[#070908] transition-colors duration-300 pb-20">
      
      {/* ── Header Area (Cover banner & overlapping profile photo) ── */}
      <div className="relative w-full">
        {/* Cover banner (CSS gradient with organic grid and gold radial highlights) */}
        <div className="h-28 sm:h-36 md:h-40 w-full relative bg-gradient-to-r from-[#2d4c38] via-[#1e3427] to-[#122218] overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.4)]">
          {/* Subtle gold radial glow at top right */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(176,126,58,0.18),transparent_65%)] pointer-events-none" />
          
          {/* Soft dot grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none" />
          
          {/* Dark gradient mask for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />
        </div>

        {/* Profile Details Overlay Section */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative -mt-14 sm:-mt-18 pb-6 border-b border-border/20 dark:border-[#1a241e]/30 flex flex-col items-center text-center justify-center gap-4">
          
          {/* White-bordered overlapping circular avatar */}
          <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden bg-white dark:bg-[#070908] p-1.5 ring-4 ring-[#fdfdfb] dark:ring-[#070908] shadow-lg flex-shrink-0 relative z-10">
            <Avatar src={profile.image} name={profile.name} size={128} />
          </div>
          
          <div className="space-y-2 flex flex-col items-center text-center">
            {/* Display Name */}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground leading-none">
              {profile.name}
            </h1>
            
            {/* Pronoun and role badge on the SAME line */}
            {(profile.pronouns || isAdmin) && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {profile.pronouns && (
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
              <span className="text-[#b07e3a] dark:text-[#d4a362]">@{profile.username || "member"}</span>
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

          {/* Action Row - Visible only if viewer is owner */}
          {isOwner && (
            <div className="flex items-center justify-center gap-3 relative z-10 shrink-0">
              <Link
                href="/account/profile"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-border/45 bg-white dark:bg-[#0c100e] px-5 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted transition-all shadow-sm text-decoration-none cursor-pointer"
              >
                <Settings className="h-4 w-4" /> Edit Profile
              </Link>
              <Link
                href="/account"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2d4c38] hover:bg-[#3a6349] px-5 text-xs font-bold uppercase tracking-wider text-white transition-all shadow-md text-decoration-none cursor-pointer"
              >
                Dashboard
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* ── Content Area ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: biography / website */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-sm border-b border-border/20 dark:border-[#1a241e]/30 pb-3">
              Profile Summary
            </h3>
            
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Bio</span>
                <p className="text-foreground leading-relaxed mt-1 font-sans font-medium">
                  {profile.about || "This member hasn't added a biography yet."}
                </p>
              </div>
              
              {profile.website && (
                <div>
                  <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Website</span>
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-[#b07e3a] hover:underline mt-1 font-medium font-sans"
                  >
                    {profile.website.replace(/^https?:\/\//i, "")} <Globe className="h-3.5 w-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column: showcase cards */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Favorite remedies showcase */}
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-border/20 dark:border-[#1a241e]/30 pb-3 flex items-center justify-between">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <ShoppingBag className="h-4.5 w-4.5 text-[#2d4c38] dark:text-emerald-400" /> Public saved remedies
              </h3>
              <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-muted/10 text-muted-foreground">
                Showcase
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {favoriteProducts.map((prod) => (
                <div 
                  key={String(prod._id)}
                  className="p-4 rounded-2xl border border-border/40 dark:border-[#1a241e]/50 bg-muted/5 flex flex-col justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-foreground truncate">{prod.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed">{prod.description}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/10">
                    <span className="font-bold text-foreground">${prod.price?.toFixed(2)}</span>
                    <Link href={`/shop`} className="text-[#b07e3a] hover:underline flex items-center gap-0.5 text-[10px] font-bold">
                      Shop <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </main>

    </div>
  );
}
