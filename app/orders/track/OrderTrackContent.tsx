"use client";

import React, { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  Navigation,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────────────── */
interface StatusEvent {
  status: string;
  note: string;
  timestamp: string;
  location?: string;
}
interface RouteWaypoint {
  lat: number;
  lng: number;
  label: string;
}
interface TrackingData {
  orderNumber: string;
  shippingStatus: string;
  paymentStatus: string;
  trackingNumber: string | null;
  carrier: string | null;
  estimatedDelivery: string | null;
  statusHistory: StatusEvent[];
  routeWaypoints: RouteWaypoint[];
  items: { name: string; image: string; quantity: number }[];
  destination: { city: string; state: string; country: string };
  recipientName: string;
  placedAt: string;
  updatedAt: string;
}

/* ─── Status config ──────────────────────────────────────────────── */
const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",     icon: Package       },
  { key: "processing",       label: "Being Prepared",   icon: Package       },
  { key: "shipped",          label: "In Transit",       icon: Truck         },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Navigation    },
  { key: "delivered",        label: "Delivered",        icon: CheckCircle2  },
];
const STATUS_ORDER = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];
const getStepIndex = (s: string) => { const i = STATUS_ORDER.indexOf(s); return i === -1 ? 0 : i; };

/* ─── Leaflet Map — dynamic import (no SSR) ─────────────────────── */
const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] rounded-2xl bg-[#f0ebe2] border border-[#e2dacd] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="h-6 w-6 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
        <p className="text-[10px] text-[#8a9e90] uppercase tracking-widest font-bold">Loading map…</p>
      </div>
    </div>
  ),
});

/* ─── Countdown ──────────────────────────────────────────────────── */
function Countdown({ targetDate }: { targetDate: string }) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return setT({ d: 0, h: 0, m: 0, s: 0 });
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-3">
      {[
        { v: t.d, l: "Days" },
        { v: t.h, l: "Hours" },
        { v: t.m, l: "Min" },
        { v: t.s, l: "Sec" }
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center bg-[#faf8f4] border border-[#e2dacd] rounded-xl px-3 py-2 min-w-[58px] shadow-sm hover:scale-105 transition-transform duration-300">
          <span className="font-serif text-xl font-black text-[#2d4c38] tabular-nums tracking-tight">{String(v).padStart(2, "0")}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#8a9e90] font-bold">{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main track content ─────────────────────────────────────────── */
function TrackContent() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get("id") ?? "";

  const [data, setData]           = useState<TrackingData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const fetchTracking = useCallback(async (silent = false) => {
    if (!orderId) { setError("No order ID provided."); setLoading(false); return; }
    if (!silent) setLoading(true); else setRefreshing(true);
    try {
      const res  = await fetch(`/api/orders/track?id=${encodeURIComponent(orderId)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load tracking info.");
      setData(json);
      setLastUpdated(new Date());
      setError("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  /* Poll every 30 s for live updates */
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchTracking(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchTracking]);

  /* ── Hydration Guard ── */
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
      </div>
    );
  }

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="h-14 w-14 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
      <p className="text-xs font-bold uppercase tracking-widest text-[#8a9e90] font-serif animate-pulse">Locating your order…</p>
    </div>
  );

  /* ── Error ── */
  if (error || !data) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
      <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
        <AlertCircle className="h-7 w-7 text-red-400" />
      </div>
      <h2 className="font-serif text-xl font-bold text-foreground">Order Not Found</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{error || "We couldn't find an order with that ID."}</p>
      <a href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d4c38] hover:underline">
        Return to store <ChevronRight className="h-3.5 w-3.5" />
      </a>
    </div>
  );

  const isCancelled = data.shippingStatus === "cancelled";
  const isDelivered = data.shippingStatus === "delivered";
  const currentStep = getStepIndex(data.shippingStatus);
  const hasRoute    = data.routeWaypoints.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#b07e3a]">Order Tracking</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-black text-foreground mt-0.5">{data.orderNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Recipient: <span className="font-bold text-foreground">{data.recipientName}</span>
            &nbsp;·&nbsp;{data.destination.city}, {data.destination.state}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {isCancelled ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">
              <XCircle className="h-3.5 w-3.5" /> Cancelled
            </span>
          ) : isDelivered ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/25 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-[#b07e3a] animate-pulse" />
              {STATUS_STEPS[currentStep]?.label ?? "In Progress"}
            </span>
          )}
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <p className="hidden sm:block text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              onClick={() => fetchTracking(true)}
              disabled={refreshing}
              className="flex items-center gap-1 text-[10px] font-bold text-[#2d4c38] border border-[#e2dacd] rounded-full px-2.5 py-1 hover:bg-[#f0ebe2] transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left — map + ETA + carrier + items */}
        <div className="lg:col-span-3 space-y-5">

          {/* Leaflet Map */}
          {!isCancelled && hasRoute && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Live Route Tracking</p>
                </div>
                {data.trackingNumber && (
                  <span className="text-[10px] font-mono font-black text-[#b07e3a] bg-[#b07e3a]/10 border border-[#b07e3a]/20 rounded-full px-2.5 py-0.5">
                    {data.trackingNumber}
                  </span>
                )}
              </div>
              <LeafletMap
                key={data.routeWaypoints.map(w => `${w.lat},${w.lng}`).join('|')}
                waypoints={data.routeWaypoints}
                currentStep={currentStep}
                totalSteps={STATUS_ORDER.length - 1}
              />
              {data.statusHistory.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-[#b07e3a] flex-shrink-0" />
                  {data.statusHistory[data.statusHistory.length - 1]?.location || "In transit"}
                </div>
              )}
            </div>
          )}

          {/* ETA countdown */}
          {!isCancelled && !isDelivered && data.estimatedDelivery && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Estimated Delivery In</p>
              <Countdown targetDate={data.estimatedDelivery} />
              <p className="text-xs text-muted-foreground mt-3">
                Expected by{" "}
                <span className="font-bold text-foreground">
                  {new Date(data.estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                </span>
              </p>
            </div>
          )}

          {/* Carrier info */}
          {data.trackingNumber && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Carrier Details</p>
              <div className="space-y-3">
                {[
                  { label: "Courier",     value: data.carrier },
                  { label: "Tracking No", value: data.trackingNumber, mono: true },
                  { label: "Destination", value: `${data.destination.city}, ${data.destination.state}` },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    <span className={`text-xs font-bold text-foreground ${mono ? "font-mono text-[#b07e3a]" : ""}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Items in this Order</p>
            <div className="space-y-3">
              {data.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-[#f0ebe2] border border-[#e2dacd] flex-shrink-0 overflow-hidden">
                    {item.image
                      ? <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      : <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-[#b07e3a]" /></div>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — progress stepper + activity log + help */}
        <div className="lg:col-span-2 space-y-5">

          {/* Progress stepper */}
          <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-5">Delivery Progress</p>

            {isCancelled ? (
              <div className="flex flex-col items-center py-4 gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                  <XCircle className="h-7 w-7 text-red-500" />
                </div>
                <p className="text-sm font-bold text-red-600">Order Cancelled</p>
                <p className="text-xs text-muted-foreground">Contact support if you need assistance.</p>
              </div>
            ) : (
              <div>
                {STATUS_STEPS.map((step, i) => {
                  const Icon       = step.icon;
                  const isComplete = i < currentStep;
                  const isActive   = i === currentStep;
                  const histEvent  = data.statusHistory.find(h => h.status === step.key);

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`
                          h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300
                          ${isComplete ? "bg-[#2d4c38] border-[#2d4c38]"
                            : isActive  ? "bg-[#b07e3a] border-[#b07e3a] shadow-[0_0_0_4px_rgba(176,126,58,0.15)]"
                            : "bg-white border-[#e2dacd]"}
                        `}>
                          {isComplete
                            ? <CheckCircle2 className="h-4 w-4 text-white" />
                            : <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#c8bfb0]"}`} />
                          }
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className={`w-0.5 h-8 mt-1 rounded-full transition-all duration-500 ${isComplete ? "bg-[#2d4c38]" : "bg-[#e2dacd]"}`} />
                        )}
                      </div>
                      <div className="pb-8 flex-1 min-w-0 mt-1.5">
                        <p className={`text-sm font-bold leading-none ${isComplete || isActive ? "text-foreground" : "text-[#c8bfb0]"}`}>
                          {step.label}
                          {isActive && (
                            <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-[#b07e3a] bg-[#b07e3a]/10 px-2 py-0.5 rounded-full">Now</span>
                          )}
                        </p>
                        {histEvent && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(histEvent.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity log */}
          {data.statusHistory.length > 0 && (
            <div className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Activity Log</p>
              <div className="space-y-4">
                {[...data.statusHistory].reverse().map((event, i, arr) => (
                  <div key={i} className={`relative pl-5 ${i < arr.length - 1 ? "pb-4 border-l-2 border-[#f0ebe2]" : ""}`}>
                    <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#b07e3a] border-2 border-white" />
                    <p className="text-xs font-bold text-foreground capitalize">{event.status.replace(/_/g, " ")}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{event.note}</p>
                    {event.location && (
                      <p className="text-[10px] text-muted-foreground/70 flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />{event.location}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground/50 mt-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(event.timestamp).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="bg-[#f0ebe2] rounded-2xl border border-[#e2dacd] p-5">
            <p className="text-xs font-bold text-foreground mb-1">Need help with your order?</p>
            <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">Our team is ready to assist with any delivery concerns.</p>
            <a href="/contact" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d4c38] hover:underline">
              Contact Support <ChevronRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Export with Suspense (useSearchParams requirement) ─────────── */
export default function OrderTrackContent() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
