"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Check,
} from "lucide-react";

export default function CookiesPreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [cookieAnalytics, setCookieAnalytics] = useState(false);
  const [cookieMarketing, setCookieMarketing] = useState(false);
  const [cookiePromotions, setCookiePromotions] = useState(false);
  const [cookieSaving, setCookieSaving] = useState(false);

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
    document.title = "Cookie Consent Preferences | Naturalist";
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  const handleSaveCookiePrefs = async () => {
    setCookieSaving(true);
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
        triggerSuccessToast("Cookie preferences authorized.");
      } else {
        throw new Error("Failed to save cookie preferences.");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCookieSaving(false);
    }
  };

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Loading preferences console...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

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

        {/* Preferences Container */}
        <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] space-y-6">
          <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4">
            <h2 className="font-serif text-xl font-bold text-foreground">Cookie Consent Preferences</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">GDPR & Legal Compliance</p>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Adjust the optional tracking scripts permitted on your device. Every modification is securely compiled and logged inside your chronological ledger.
          </p>

          <div className="space-y-4 pt-2">
            
            {/* Strictly Essential */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground flex items-center gap-2">
                  Strictly Essential Cookies
                  <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted-foreground/15 text-muted-foreground">Active</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Required for core session validation, cart retention, and transaction checkouts. Cannot be disabled.
                </p>
              </div>
              <div className="relative inline-flex items-center cursor-not-allowed">
                <div className="w-10 h-6 bg-[#2d4c38] rounded-full transition-colors opacity-65" />
                <div className="absolute left-5 w-4 h-4 bg-white rounded-full transition-transform" />
              </div>
            </div>

            {/* Analytics */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Usage & Navigation Analytics</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Permits anonymous data tracking to help us evaluate site performance, loading metrics, and browse trends.
                </p>
              </div>
              <button
                onClick={() => setCookieAnalytics(!cookieAnalytics)}
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
              >
                <div className={`w-10 h-6 rounded-full transition-colors ${cookieAnalytics ? "bg-[#2d4c38]" : "bg-muted"}`} />
                <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${cookieAnalytics ? "left-5" : "left-1"}`} />
              </button>
            </div>

            {/* Marketing */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Holistic Personalization & Ads</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Allows our advertising partners to serve contextually relevant natural wellness banners.
                </p>
              </div>
              <button
                onClick={() => setCookieMarketing(!cookieMarketing)}
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
              >
                <div className={`w-10 h-6 rounded-full transition-colors ${cookieMarketing ? "bg-[#2d4c38]" : "bg-muted"}`} />
                <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${cookieMarketing ? "left-5" : "left-1"}`} />
              </button>
            </div>

            {/* promotions */}
            <div className="p-4 bg-muted/10 border border-border/30 rounded-2xl flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-bold text-foreground">Email Promotions & Newsletter</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Dispatches periodic wellness recommendations, discounts, and forest conservation newsletters.
                </p>
              </div>
              <button
                onClick={() => setCookiePromotions(!cookiePromotions)}
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none bg-transparent border-0 cursor-pointer"
              >
                <div className={`w-10 h-6 rounded-full transition-colors ${cookiePromotions ? "bg-[#2d4c38]" : "bg-muted"}`} />
                <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform ${cookiePromotions ? "left-5" : "left-1"}`} />
              </button>
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-border/30 dark:border-[#1a241e]/30">
            <button
              onClick={handleSaveCookiePrefs}
              disabled={cookieSaving}
              className="h-11 px-8 rounded-full bg-[#2d4c38] text-white hover:bg-[#3a6349] font-bold uppercase tracking-wider text-[10px] transition-all disabled:opacity-50 border-0 cursor-pointer"
            >
              {cookieSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Preferences"}
            </button>
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
