"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

/* ─── Status config ─────────────────────────────────────────────── */
const STATUS_STEPS = [
  { key: "pending",          label: "Order Placed",      icon: Package },
  { key: "processing",       label: "Being Prepared",    icon: Package },
  { key: "shipped",          label: "In Transit",        icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery",  icon: Navigation },
  { key: "delivered",        label: "Delivered",         icon: CheckCircle2 },
];

const STATUS_ORDER = ["pending", "processing", "shipped", "out_for_delivery", "delivered"];

function getStepIndex(status: string) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

/* ─── Nigeria SVG Map + animated dot ───────────────────────────── */
// Simplified bounding box: lat 4.2 - 13.9, lng 2.7 - 14.7
const MAP_BOUNDS = { latMin: 4.2, latMax: 13.9, lngMin: 2.7, lngMax: 14.7 };
const SVG_W = 340, SVG_H = 280;

function latLngToSvg(lat: number, lng: number) {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * SVG_W;
  const y = SVG_H - ((lat - MAP_BOUNDS.latMin) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * SVG_H;
  return { x, y };
}

// Simplified Nigeria outline as SVG path (approximate polygon)
const NIGERIA_PATH = "M 60,240 L 30,210 L 20,180 L 25,150 L 15,120 L 30,90 L 55,70 L 80,60 L 110,55 L 140,45 L 175,40 L 210,48 L 240,55 L 265,70 L 280,90 L 290,115 L 310,130 L 325,150 L 320,175 L 305,195 L 285,210 L 265,225 L 240,235 L 210,245 L 180,255 L 150,260 L 120,258 L 90,252 Z";

function NigeriaMap({ waypoints, currentStep }: { waypoints: RouteWaypoint[]; currentStep: number }) {
  const [animProgress, setAnimProgress] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  const ANIM_DURATION = 8000; // 8 seconds per full loop

  useEffect(() => {
    if (!waypoints.length) return;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = (elapsed % ANIM_DURATION) / ANIM_DURATION;
      setAnimProgress(progress);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [waypoints]);

  // Interpolate dot position along the route
  const getDotPosition = () => {
    if (!waypoints.length) return { x: SVG_W / 2, y: SVG_H / 2 };

    // How far along the active segment (based on currentStep and animation)
    const totalSegments = waypoints.length - 1;
    // Map currentStep to a base progress fraction
    const baseProgress = Math.min(currentStep / (STATUS_ORDER.length - 1), 1);
    // Add oscillation within the current segment for "live movement" effect
    const oscillation = (Math.sin(animProgress * Math.PI * 2) * 0.5 + 0.5) * (1 / Math.max(totalSegments, 1)) * 0.6;
    const totalProgress = Math.min(baseProgress + oscillation, 1);

    const segmentF = totalProgress * totalSegments;
    const segIdx   = Math.min(Math.floor(segmentF), totalSegments - 1);
    const segT     = segmentF - segIdx;

    const p1 = latLngToSvg(waypoints[segIdx].lat, waypoints[segIdx].lng);
    const p2 = latLngToSvg(waypoints[segIdx + 1]?.lat ?? waypoints[segIdx].lat, waypoints[segIdx + 1]?.lng ?? waypoints[segIdx].lng);

    return {
      x: p1.x + (p2.x - p1.x) * segT,
      y: p1.y + (p2.y - p1.y) * segT,
    };
  };

  const dot = getDotPosition();

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full h-auto" style={{ maxHeight: 220 }}>
        {/* Map background */}
        <rect width={SVG_W} height={SVG_H} fill="#f0ebe2" rx={12} />

        {/* Nigeria fill */}
        <path d={NIGERIA_PATH} fill="#e2dacd" stroke="#c8bfb0" strokeWidth={1.5} />

        {/* Route line */}
        {waypoints.length > 1 && (
          <polyline
            points={waypoints.map(w => {
              const p = latLngToSvg(w.lat, w.lng);
              return `${p.x},${p.y}`;
            }).join(" ")}
            fill="none"
            stroke="#b07e3a"
            strokeWidth={2}
            strokeDasharray="5,4"
            opacity={0.7}
          />
        )}

        {/* Waypoint dots */}
        {waypoints.map((w, i) => {
          const p = latLngToSvg(w.lat, w.lng);
          const isFirst = i === 0;
          const isLast  = i === waypoints.length - 1;
          return (
            <g key={i}>
              <circle
                cx={p.x} cy={p.y} r={isFirst || isLast ? 6 : 4}
                fill={isFirst ? "#2d4c38" : isLast ? "#b07e3a" : "#8a9e90"}
                stroke="white" strokeWidth={1.5}
              />
            </g>
          );
        })}

        {/* Animated delivery truck dot */}
        <g transform={`translate(${dot.x}, ${dot.y})`}>
          {/* Pulse ring */}
          <circle r={14} fill="#b07e3a" opacity={0.15}>
            <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
          </circle>
          {/* Main dot */}
          <circle r={8} fill="#b07e3a" stroke="white" strokeWidth={2} />
          {/* Truck icon (simplified unicode-style dot) */}
          <circle r={3} fill="white" />
        </g>

        {/* Labels for first and last waypoint */}
        {waypoints.length > 0 && (() => {
          const first = latLngToSvg(waypoints[0].lat, waypoints[0].lng);
          const last  = latLngToSvg(waypoints[waypoints.length - 1].lat, waypoints[waypoints.length - 1].lng);
          return (
            <>
              <text x={first.x + 10} y={first.y - 8} fontSize={8} fill="#2d4c38" fontWeight="bold">Origin</text>
              <text x={last.x + 10}  y={last.y - 8}  fontSize={8} fill="#b07e3a" fontWeight="bold">Destination</text>
            </>
          );
        })()}
      </svg>

      {/* Live badge */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/90 border border-[#e2dacd] rounded-full px-2.5 py-1 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[9px] font-black uppercase tracking-widest text-[#2d4c38]">Live Tracking</span>
      </div>
    </div>
  );
}

/* ─── Countdown timer ───────────────────────────────────────────── */
function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      const days    = Math.floor(diff / 86400000);
      const hours   = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      setTimeLeft({ days, hours, minutes });
    };
    calc();
    const id = setInterval(calc, 60000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <div className="flex items-center gap-3">
      {[
        { v: timeLeft.days,    l: "Days"    },
        { v: timeLeft.hours,   l: "Hours"   },
        { v: timeLeft.minutes, l: "Minutes" },
      ].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center bg-[#faf8f4] border border-[#e2dacd] rounded-xl px-3 py-2 min-w-[52px]">
          <span className="font-serif text-xl font-black text-[#2d4c38]">{String(v).padStart(2, "0")}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#8a9e90] font-bold">{l}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main content ──────────────────────────────────────────────── */
function TrackContent() {
  const searchParams  = useSearchParams();
  const orderId       = searchParams.get("id") ?? "";

  const [data, setData]       = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing]   = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchTracking = useCallback(async (silent = false) => {
    if (!orderId) { setError("No order ID provided."); setLoading(false); return; }
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(orderId)}`);
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

  // Initial fetch
  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  // Poll every 30 seconds
  useEffect(() => {
    intervalRef.current = setInterval(() => fetchTracking(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchTracking]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#8a9e90] font-serif animate-pulse">Locating your order…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-red-100 p-8 shadow-sm text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center mx-auto border border-red-100">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h2 className="font-serif text-xl font-bold text-[#141f19]">Order Not Found</h2>
          <p className="text-sm text-[#5e6f64] leading-relaxed">{error || "We couldn't find an order with that ID. Please check your order confirmation email."}</p>
          <a href="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#2d4c38] hover:underline">
            Return to store <ChevronRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  const isCancelled = data.shippingStatus === "cancelled";
  const isDelivered = data.shippingStatus === "delivered";
  const currentStep = getStepIndex(data.shippingStatus);
  const hasTracking = !!data.trackingNumber;
  const hasRoute    = data.routeWaypoints.length > 1;

  return (
    <div className="min-h-screen bg-[#faf8f4]">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-[#e2dacd] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="/" className="font-serif text-xl font-black text-[#141f19] hover:opacity-70 transition-opacity">
            Naturalist<span className="text-[#b07e3a]">.</span>
          </a>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <p className="hidden sm:block text-[10px] text-[#8a9e90] uppercase tracking-wider">
                Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <button
              onClick={() => fetchTracking(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2d4c38] border border-[#e2dacd] rounded-full px-3 py-1.5 hover:bg-[#f0ebe2] transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-24">

        {/* ── Header ── */}
        <div className="bg-white rounded-3xl border border-[#e2dacd] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-1">Tracking Order</p>
              <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#141f19]">{data.orderNumber}</h1>
              <p className="text-sm text-[#5e6f64] mt-1">
                Recipient: <span className="font-bold text-[#141f19]">{data.recipientName}</span>
                &nbsp;&middot;&nbsp;
                {data.destination.city}, {data.destination.state}
              </p>
            </div>
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              {isCancelled ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-red-50 text-red-600 border border-red-200 uppercase tracking-widest">
                  <XCircle className="h-4 w-4" /> Cancelled
                </span>
              ) : isDelivered ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-widest">
                  <CheckCircle2 className="h-4 w-4" /> Delivered
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/25 uppercase tracking-widest">
                  <span className="h-2 w-2 rounded-full bg-[#b07e3a] animate-pulse" />
                  {STATUS_STEPS[currentStep]?.label ?? "In Progress"}
                </span>
              )}
              <p className="text-[10px] text-[#8a9e90]">
                Placed {new Date(data.placedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left column — map + ETA + carrier */}
          <div className="lg:col-span-3 space-y-6">

            {/* Map */}
            {!isCancelled && hasRoute && (
              <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90]">Live Route</p>
                  {hasTracking && (
                    <p className="text-[10px] font-mono font-bold text-[#b07e3a] bg-[#b07e3a]/10 border border-[#b07e3a]/20 rounded-full px-2.5 py-0.5">
                      {data.trackingNumber}
                    </p>
                  )}
                </div>
                <NigeriaMap waypoints={data.routeWaypoints} currentStep={currentStep} />
                {/* Current location label */}
                {data.statusHistory.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-[#5e6f64]">
                    <MapPin className="h-3.5 w-3.5 text-[#b07e3a] flex-shrink-0" />
                    <span>{data.statusHistory[data.statusHistory.length - 1]?.location || "In transit"}</span>
                  </div>
                )}
              </div>
            )}

            {/* ETA countdown */}
            {!isCancelled && !isDelivered && data.estimatedDelivery && (
              <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-3">Estimated Delivery In</p>
                <Countdown targetDate={data.estimatedDelivery} />
                <p className="text-xs text-[#5e6f64] mt-3">
                  Expected by <span className="font-bold text-[#141f19]">
                    {new Date(data.estimatedDelivery).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </p>
              </div>
            )}

            {/* Carrier info */}
            {hasTracking && (
              <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-4">Carrier Details</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5e6f64] font-medium">Courier</span>
                    <span className="text-xs font-bold text-[#141f19]">{data.carrier}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5e6f64] font-medium">Tracking No.</span>
                    <span className="text-xs font-mono font-black text-[#b07e3a]">{data.trackingNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#5e6f64] font-medium">Destination</span>
                    <span className="text-xs font-bold text-[#141f19]">{data.destination.city}, {data.destination.state}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Items */}
            <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-4">Items in this Order</p>
              <div className="space-y-3">
                {data.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-[#f0ebe2] border border-[#e2dacd] flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-[#b07e3a]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#141f19] truncate">{item.name}</p>
                      <p className="text-xs text-[#8a9e90]">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column — progress stepper + history */}
          <div className="lg:col-span-2 space-y-6">

            {/* Progress stepper */}
            <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-5">Delivery Progress</p>

              {isCancelled ? (
                <div className="flex flex-col items-center py-4 gap-3 text-center">
                  <div className="h-14 w-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                    <XCircle className="h-7 w-7 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-red-600">Order Cancelled</p>
                  <p className="text-xs text-[#5e6f64]">This order was cancelled. Contact support if you need assistance.</p>
                </div>
              ) : (
                <div className="space-y-0">
                  {STATUS_STEPS.map((step, i) => {
                    const StepIcon   = step.icon;
                    const isComplete = i < currentStep;
                    const isActive   = i === currentStep;
                    const isPending  = i > currentStep;

                    return (
                      <div key={step.key} className="flex gap-4">
                        {/* Icon + line */}
                        <div className="flex flex-col items-center">
                          <div className={`
                            h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all
                            ${isComplete ? "bg-[#2d4c38] border-[#2d4c38]"
                              : isActive  ? "bg-[#b07e3a] border-[#b07e3a] shadow-[0_0_0_4px_rgba(176,126,58,0.15)]"
                              : "bg-white border-[#e2dacd]"}
                          `}>
                            {isComplete ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : (
                              <StepIcon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#c8bfb0]"}`} />
                            )}
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`w-0.5 h-8 mt-1 rounded-full transition-all ${isComplete ? "bg-[#2d4c38]" : "bg-[#e2dacd]"}`} />
                          )}
                        </div>

                        {/* Label */}
                        <div className="pb-8 flex-1 min-w-0">
                          <p className={`text-sm font-bold leading-none mt-2 ${isComplete || isActive ? "text-[#141f19]" : "text-[#c8bfb0]"}`}>
                            {step.label}
                            {isActive && <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-[#b07e3a] bg-[#b07e3a]/10 px-2 py-0.5 rounded-full">Now</span>}
                          </p>
                          {/* Timestamp from history */}
                          {data.statusHistory.find(h => h.status === step.key) && (
                            <p className="text-[10px] text-[#8a9e90] mt-0.5">
                              {new Date(data.statusHistory.find(h => h.status === step.key)!.timestamp).toLocaleString("en-US", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detailed history log */}
            {data.statusHistory.length > 0 && (
              <div className="bg-white rounded-3xl border border-[#e2dacd] p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90] mb-4">Activity Log</p>
                <div className="space-y-4">
                  {[...data.statusHistory].reverse().map((event, i) => (
                    <div key={i} className={`relative pl-5 ${i < data.statusHistory.length - 1 ? "pb-4 border-l-2 border-[#f0ebe2]" : ""}`}>
                      <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-[#b07e3a] border-2 border-white" />
                      <p className="text-xs font-bold text-[#141f19] capitalize">{event.status.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-[#5e6f64] mt-0.5 leading-relaxed">{event.note}</p>
                      {event.location && (
                        <p className="text-[10px] text-[#8a9e90] flex items-center gap-1 mt-0.5">
                          <MapPin className="h-2.5 w-2.5" /> {event.location}
                        </p>
                      )}
                      <p className="text-[10px] text-[#b0a090] mt-1 flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(event.timestamp).toLocaleString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Help */}
            <div className="bg-[#f0ebe2] rounded-3xl border border-[#e2dacd] p-5">
              <p className="text-xs font-bold text-[#141f19] mb-1">Need help with your order?</p>
              <p className="text-[11px] text-[#5e6f64] mb-3 leading-relaxed">Our support team is ready to assist with any delivery concerns.</p>
              <a
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2d4c38] hover:underline"
              >
                Contact Support <ChevronRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderTrackContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#faf8f4] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
      </div>
    }>
      <TrackContent />
    </Suspense>
  );
}
