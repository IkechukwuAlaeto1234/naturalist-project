"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  MapPin,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Clock,
  Sparkles,
  TreePine,
  ExternalLink,
  Shield,
  Layers,
  Compass,
  FileText,
  Mail,
  Users,
  Phone,
} from "lucide-react";

export default function AccountOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => { document.title = "Overview | Naturalist"; }, 150);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        fetchOverviewData();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const [profRes, ordRes, logsRes] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/orders/my"),
        fetch("/api/user/logs"),
      ]);

      if (profRes.ok) {
        const profData = await profRes.json();
        setProfile(profData);
      }
      if (ordRes.ok) {
        const ordData = await ordRes.json();
        setOrders(Array.isArray(ordData) ? ordData : []);
      }
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(Array.isArray(logsData) ? logsData : []);
      }
    } catch (err) {
      console.error("Failed to load overview data", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Compiling overview...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  const isAdmin = profile?.role === "admin";

  // Calculate dynamic botanical spending tier
  const paidOrders = orders.filter((o) => o.shippingStatus !== "cancelled");
  const totalSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  
  // Tier brackets: $0-$250 (Sprout), $250-$1000 (Sage), $1000+ (Master)
  const tierName =
    totalSpent >= 1000 ? "Gold Master Herbalist" :
    totalSpent >= 250  ? "Silver Sage Herbalist" : "Sprout Naturalist";

  const nextTierTarget = totalSpent >= 1000 ? 5000 : totalSpent >= 250 ? 1000 : 250;
  const progressPercent = Math.min((totalSpent / nextTierTarget) * 100, 100);

  // Address formatting
  const hasAddress = profile?.shippingAddress && profile.shippingAddress.name;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      
      {/* ── Left Column (Bio, level stats, referral widgets) ── */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Bio / About Card */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border/20 dark:border-[#1a241e]/30 pb-3">
            <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
              About Profile
            </h3>
            <Link 
              href="/account/profile" 
              className="text-[10px] uppercase font-bold text-[#b07e3a] hover:underline"
            >
              Edit
            </Link>
          </div>
          
          <div className="space-y-3.5 text-xs">
            <div>
              <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Biography</span>
              <p className="text-foreground leading-relaxed mt-1 font-sans">
                {profile?.about || "No biography added yet. Update your details to tell your organic story."}
              </p>
            </div>
            
            {profile?.website && (
              <div>
                <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">Website</span>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-1 text-[#b07e3a] hover:underline mt-1 font-medium font-sans"
                >
                  {profile.website.replace(/^https?:\/\//i, "")} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Botanical Spend Tier Card (Only for regular users) */}
        {!isAdmin && (
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-foreground text-sm">
              Botanical Tier Level
            </h3>

            <div className="p-4 bg-muted/15 dark:bg-[#151c18]/30 rounded-2xl border border-border/20 dark:border-[#1a241e]/30 space-y-3">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p className="font-serif font-bold text-foreground">Experience Progress</p>
                  <p className="text-[9px] font-bold text-[#b07e3a] dark:text-[#d4a362] uppercase tracking-wider mt-0.5">{tierName}</p>
                </div>
                <span className="font-bold text-foreground">${totalSpent.toFixed(2)} spent</span>
              </div>

              {/* Progress bar */}
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
          </div>
        )}

        {/* Referrals Widget */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="h-8 w-8 rounded-xl bg-[#2d4c38]/15 dark:bg-emerald-500/15 flex items-center justify-center text-[#2d4c38] dark:text-emerald-400">
            <TreePine className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-2 text-xs">
            <h4 className="font-serif font-bold text-foreground">Refer & Plant Trees</h4>
            <p className="text-muted-foreground leading-relaxed">
              Share natural wellness. For every companion who completes their first order, we will plant 10 trees in our reforestation partner's land.
            </p>
          </div>
        </div>

      </div>

      {/* ── Right Column (Transactions list, addresses, admin console) ── */}
      <div className="lg:col-span-8 space-y-6">

        {/* Admin Shortcuts Panel (Visible only to Admin users) */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-border/20 dark:border-[#1a241e]/30 pb-3 flex items-center justify-between">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-[#b07e3a]" /> Administrative Command Panel
              </h3>
              <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                System Console
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Quick access shortcuts to manage database catalogs, fullfill user purchases, dispatch newsletters, or audit active logs.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <Link 
                href="/admin/users" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <Users className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">User Database</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Manage members</p>
                </div>
              </Link>

              <Link 
                href="/admin/orders" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <Package className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Orders Fullfillment</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Ship active logs</p>
                </div>
              </Link>

              <Link 
                href="/admin/products" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <ShoppingBag className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Catalog Products</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Edit formulas</p>
                </div>
              </Link>

              <Link 
                href="/admin/newsletter" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <Mail className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Newsletters</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Dispatch campaigns</p>
                </div>
              </Link>

              <Link 
                href="/admin/contacts" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <Compass className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Inquiries</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Review responses</p>
                </div>
              </Link>

              <Link 
                href="/admin/pages" 
                className="p-4 rounded-2xl border border-border/30 hover:border-[#2d4c38] dark:hover:border-emerald-500/30 bg-muted/5 hover:bg-[#2d4c38]/5 dark:hover:bg-emerald-500/5 transition-all text-left flex flex-col gap-2 group cursor-pointer"
              >
                <FileText className="h-5 w-5 text-muted-foreground group-hover:text-[#2d4c38] dark:group-hover:text-emerald-400" />
                <div>
                  <p className="text-xs font-bold text-foreground">Page Builder</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">Customize layouts</p>
                </div>
              </Link>
            </div>
          </div>
        )}

        {/* Recent Orders Widget */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-border/20 dark:border-[#1a241e]/30 pb-3">
            <h3 className="font-serif font-bold text-foreground text-sm">
              Recent Orders
            </h3>
            <Link 
              href="/account/orders" 
              className="text-[10px] uppercase font-bold text-[#b07e3a] hover:underline flex items-center gap-0.5"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-2xl bg-muted/5">
              <ShoppingBag className="h-8 w-8 text-[#b07e3a] mb-3" />
              <h4 className="font-serif font-bold text-sm text-foreground">Registry Empty</h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1.5">
                No botanical purchases found. Visit the shop to begin your natural skincare journey.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => {
                const statusKey = order.shippingStatus || "pending";
                const reference = order.orderNumber || `#${order._id?.slice(-6).toUpperCase()}`;
                
                let statusClass = "bg-[#b07e3a]/10 text-[#b07e3a]";
                if (statusKey === "delivered") statusClass = "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400";
                if (statusKey === "shipped") statusClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                if (statusKey === "cancelled") statusClass = "bg-red-500/10 text-red-500";

                return (
                  <div 
                    key={order._id}
                    className="p-4 rounded-2xl border border-border/30 dark:border-[#1a241e]/30 bg-muted/5 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 bg-white dark:bg-[#151c18] border border-border/40 dark:border-[#1a241e]/50 rounded-xl flex items-center justify-center text-muted-foreground flex-shrink-0">
                        <Package className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 text-xs">
                        <Link 
                          href={`/account/orders/${order._id}`} 
                          className="font-bold text-foreground hover:underline truncate hover:text-[#b07e3a]"
                        >
                          Order {reference}
                        </Link>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          {" · "}{order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusClass}`}>
                        {statusKey}
                      </span>
                      <p className="text-xs font-bold text-foreground mt-1">${order.totalAmount?.toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grid: Coordinates & Activity Logs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Saved Coordinates Widget */}
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border/20 dark:border-[#1a241e]/30 pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                Shipping Address
              </h3>
              <Link 
                href="/account/addresses" 
                className="text-[10px] uppercase font-bold text-[#b07e3a] hover:underline"
              >
                Manage
              </Link>
            </div>

            {hasAddress ? (
              <div className="text-xs space-y-1 text-muted-foreground">
                <p className="font-bold text-foreground">{profile.shippingAddress.name}</p>
                <p>{profile.shippingAddress.street}</p>
                <p>{profile.shippingAddress.city}, {profile.shippingAddress.state} {profile.shippingAddress.zip}</p>
                <p>{profile.shippingAddress.country}</p>
                <p className="text-[10px] mt-2 flex items-center gap-1.5 font-medium text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-[#b07e3a] dark:text-[#d4a362]" /> {profile.shippingAddress.phone}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-2xl bg-muted/5">
                <MapPin className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-[11px] text-muted-foreground max-w-xs px-2 leading-relaxed">
                  No default shipping coordinates registered in profile logs yet.
                </p>
              </div>
            )}
          </div>

          {/* Quick Activity log Shortcut */}
          <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-border/20 dark:border-[#1a241e]/30 pb-3">
              <h3 className="font-serif font-bold text-foreground text-sm flex items-center gap-2">
                Recent Activity
              </h3>
              <Link 
                href="/account/profile?tab=activity-log" 
                className="text-[10px] uppercase font-bold text-[#b07e3a] hover:underline"
              >
                Log
              </Link>
            </div>

            {logs.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic text-center py-8">
                No activity logged yet.
              </p>
            ) : (
              <div className="space-y-3">
                {logs.slice(0, 3).map((log) => {
                  let badgeColor = "bg-muted-foreground/10 text-muted-foreground";
                  if (log.action === "login") badgeColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                  if (log.action === "password_change" || log.action === "revoke_session") badgeColor = "bg-red-500/10 text-red-500";
                  if (log.action === "cookie_preferences_update") badgeColor = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
                  if (log.action === "signup") badgeColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";

                  return (
                    <div key={log._id} className="text-[11px] leading-tight flex items-start justify-between gap-3 font-medium">
                      <div className="min-w-0">
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider mr-1.5 ${badgeColor}`}>
                          {log.action?.replace("_", " ")}
                        </span>
                        <p className="text-foreground mt-1 text-[10px] leading-relaxed truncate max-w-[170px]" title={log.details}>
                          {log.details}
                        </p>
                      </div>
                      <span className="text-[9px] text-muted-foreground shrink-0 text-right mt-0.5">
                        {new Date(log.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
