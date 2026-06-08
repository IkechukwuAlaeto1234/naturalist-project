"use client";

import React, { useState, useEffect } from "react";
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
  Lock,
  ShieldCheck,
  Clock,
  ChevronRight,
  Sparkles,
  TreePine,
  Coins,
} from "lucide-react";
import Image from "next/image";

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

export default function AccountHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    document.title = "My Account | Naturalist";
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchHubData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const fetchHubData = async () => {
    try {
      setLoading(true);
      const [profRes, ordRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/orders/my"),
      ]);

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(Array.isArray(ordData) ? ordData : []);
      }
    } catch (err) {
      console.error("Failed to load hub data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      signOut({ callbackUrl: window.location.origin + "/login?logout=true" });
    } else {
      signOut({ callbackUrl: "/login?logout=true" });
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Loading private portal...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const user = session?.user as any;
  const displayImage = user?.image || null;

  // Calculate dynamic botanical spending tier
  const paidOrders = orders.filter((o) => o.shippingStatus !== "cancelled");
  const totalSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // Tier brackets: $0-$250 (Sprout), $250-$1000 (Herbalist), $1000+ (Master Herbalist)
  const tierName =
    totalSpent >= 1000 ? "Gold Master Herbalist" :
    totalSpent >= 250  ? "Silver Sage Herbalist" : "Sprout Naturalist";

  const nextTierTarget = totalSpent >= 1000 ? 5000 : totalSpent >= 250 ? 1000 : 250;
  const progressPercent = Math.min((totalSpent / nextTierTarget) * 100, 100);

  const subpages = [
    {
      title: "Profile & Backup Coordinates",
      desc: "Manage credentials, update name, and verify recovery email.",
      url: "/account/profile",
      icon: User,
    },
    {
      title: "Botanical Purchase Registry",
      desc: "Track orders, dispatch status, and cancellation history.",
      url: "/account/orders",
      icon: Package,
    },
    {
      title: "Security & Active Terminals",
      desc: "Reset login passwords and revoke active MongoDB device sessions.",
      url: "/account/security",
      icon: Lock,
    },
    {
      title: "Cookie Consent Preferences",
      desc: "GDPR customizations for marketing, analytics, and data tracking.",
      url: "/account/cookies",
      icon: ShieldCheck,
    },
    {
      title: "Audit Ledger Log Activity",
      desc: "Deep security transaction logs linked directly to your account.",
      url: "/account/activity",
      icon: Clock,
    },
    {
      title: "Saved Shipping Address Coordinates",
      desc: "Review and manage saved shipping address references.",
      url: "/account/addresses",
      icon: MapPin,
    },
  ];

  return (
    <div className="w-full min-h-[85vh] bg-[#fdfdfb] dark:bg-[#070908] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors duration-300">
      <div className="mx-auto max-w-xl space-y-6 animate-fade-in-up">
        
        {/* Hub Card Container */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          
          {/* Header Details */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl overflow-hidden ring-2 ring-[#2d4c38]/20 dark:ring-emerald-500/20 flex-shrink-0">
                <Avatar src={displayImage} name={user?.name} size={64} />
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="font-serif text-lg font-bold text-foreground">{user?.name}</h2>
                  <span className="inline-flex items-center gap-0.5 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-[#b07e3a]/10 text-[#b07e3a] dark:text-[#d4a362]">
                    <Sparkles className="h-2 w-2" /> Gold Sage
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{user?.email}</p>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all bg-transparent border-0 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Botanical Tier Progress Tracker */}
          <div className="p-4 bg-muted/15 dark:bg-[#151c18]/30 rounded-2xl border border-border/20 dark:border-[#1a241e]/30 space-y-3">
            <div className="flex justify-between items-start text-xs">
              <div>
                <p className="font-serif font-bold text-foreground">Botanical Experience Level</p>
                <p className="text-[9px] font-bold text-[#b07e3a] dark:text-[#d4a362] uppercase tracking-wider mt-0.5">{tierName}</p>
              </div>
              <span className="font-mono font-bold text-foreground">${totalSpent.toFixed(2)} spent</span>
            </div>

            {/* Progress line */}
            <div className="space-y-1.5">
              <div className="w-full h-2 bg-[#e6dfd3] dark:bg-[#1a241e] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2d4c38] dark:bg-emerald-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[8px] font-black text-muted-foreground uppercase tracking-widest">
                <span>Sprout</span>
                <span>Target: ${nextTierTarget}</span>
              </div>
            </div>
          </div>

          {/* Reforestation Partner Invitation Banner */}
          <div className="p-4 bg-[#2d4c38]/5 dark:bg-emerald-500/5 rounded-2xl border border-[#2d4c38]/10 dark:border-emerald-500/10 flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[#2d4c38]/15 dark:bg-emerald-500/15 flex items-center justify-center text-[#2d4c38] dark:text-emerald-400 flex-shrink-0">
              <TreePine className="h-4 w-4" />
            </div>
            <div className="text-xs space-y-1 leading-relaxed">
              <p className="font-serif font-bold text-foreground">Refer & Plant Trees</p>
              <p className="text-[11px] text-muted-foreground font-medium">
                Share our natural remedies. For every companion who completes their first botanical transaction, we will plant 10 trees in our reforestation partner's land.
              </p>
            </div>
          </div>

          {/* Subpages Navigation deck */}
          <div className="space-y-2 pt-2">
            <p className="text-[9px] font-black uppercase tracking-wider text-muted-foreground px-1 mb-3">Portal Directory</p>
            
            {subpages.map((sp, idx) => (
              <a
                key={idx}
                href={sp.url}
                className="flex items-center justify-between p-4 bg-muted/10 dark:bg-transparent border border-border/30 dark:border-[#1a241e]/30 rounded-2xl hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 hover:border-[#2d4c38]/20 dark:hover:border-emerald-500/20 transition-all duration-300 group cursor-pointer text-decoration-none no-underline"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="h-9 w-9 bg-white dark:bg-[#151c18] border border-border/40 dark:border-[#1a241e]/50 rounded-xl flex items-center justify-center text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400 transition-colors flex-shrink-0">
                    <sp.icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="text-xs font-bold text-foreground leading-none">{sp.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate max-w-[280px] font-medium leading-none">{sp.desc}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </a>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
