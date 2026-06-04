"use client";

import React, { useState, useEffect, useCallback } from "react";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft, Package, Loader2, MapPin, CreditCard, Download,
  CheckCircle, Clock, Truck, Home, XCircle, ChevronRight,
} from "lucide-react";

/* ─── Types ─── */
interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentStatus: "pending" | "paid" | "failed";
  shippingStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

/* ─── Tracking Steps ─── */
const STEPS = [
  { key: "pending",    label: "Order Placed",    icon: CheckCircle },
  { key: "processing", label: "Processing",       icon: Package     },
  { key: "shipped",    label: "Shipped",          icon: Truck       },
  { key: "delivered",  label: "Delivered",        icon: Home        },
] as const;

const STEP_ORDER = ["pending", "processing", "shipped", "delivered"] as const;

function stepIndex(status: string) {
  const i = STEP_ORDER.indexOf(status as any);
  return i === -1 ? 0 : i;
}

/* ─── Status pill helper ─── */
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    pending:    { label: "Pending",    cls: "bg-[#b07e3a]/10 text-[#b07e3a]" },
    processing: { label: "Processing", cls: "bg-[#b07e3a]/10 text-[#b07e3a]" },
    shipped:    { label: "Shipped",    cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    delivered:  { label: "Delivered",  cls: "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400" },
    cancelled:  { label: "Cancelled",  cls: "bg-destructive/10 text-destructive" },
    paid:       { label: "Paid",       cls: "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400" },
    failed:     { label: "Failed",     cls: "bg-destructive/10 text-destructive" },
  };
  const { label, cls } = cfg[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Page ─── */
export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { data: session, status } = useSession();
  const [order,   setOrder]   = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    document.title = "Track Order | Naturalist";
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchOrder = useCallback(async () => {
    if (!id || status !== "authenticated") return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (!res.ok) throw new Error("Order not found");
      const data = await res.json();
      setOrder(data);
    } catch (e: any) {
      setError(e.message || "Failed to load order.");
    } finally {
      setLoading(false);
    }
  }, [id, status]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  /* ── Loading / error states ── */
  if (loading || status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
        <XCircle className="h-10 w-10 text-destructive/50" />
        <p className="font-serif text-lg font-bold">{error || "Order not found"}</p>
        <a href="/account" className="text-xs font-semibold text-[#b07e3a] hover:underline">
          ← Back to Account
        </a>
      </div>
    );
  }

  const isCancelled = order.shippingStatus === "cancelled";
  const currentStep = isCancelled ? -1 : stepIndex(order.shippingStatus);
  const reference = order.orderNumber || order._id;
  const placedAt = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(order.createdAt));

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0d0b] py-10 px-4 sm:px-6 lg:px-8 pb-32 transition-colors">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* ── Back + heading ── */}
        <div className="flex items-center justify-center gap-3 text-center flex-wrap">
          <a
            href="/account"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Orders
          </a>
          <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Track Order
          </span>
        </div>

        <div className="flex flex-col items-center text-center gap-3">
          <div className="space-y-1">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Track Order
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Placed on {placedAt}
            </p>
            <span className="inline-flex items-center rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-foreground/80">
              {reference}
            </span>
          </div>
          {/* PDF download — placeholder */}
          <button
            onClick={() => alert("PDF download coming soon!")}
            className="inline-flex items-center gap-2 h-9 px-5 rounded-full border border-[#e2dacd] dark:border-white/10 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all self-center"
          >
            <Download className="h-3.5 w-3.5" />
            Download PDF
          </button>
        </div>

        {/* ── Order tracking ── */}
        {!isCancelled ? (
          <div className="p-5 sm:p-6 rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-5 text-center">
              Order Tracking
            </p>
            <div className="relative flex items-start gap-0 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0">
              {/* progress bar */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#e2dacd] dark:bg-[#232c26]" style={{ zIndex: 0 }}>
                <div
                  className="h-full bg-[#2d4c38] dark:bg-emerald-500 transition-all duration-700"
                  style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
                />
              </div>

              {STEPS.map((step, i) => {
                const done    = i <= currentStep;
                const active  = i === currentStep;
                const Icon    = step.icon;
                return (
                  <div key={step.key} className="relative flex-1 min-w-[86px] flex flex-col items-center gap-2 px-1" style={{ zIndex: 1 }}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ring-2 transition-all duration-300 ${
                      done
                        ? "bg-[#2d4c38] ring-[#2d4c38] dark:bg-emerald-500 dark:ring-emerald-500 text-white"
                        : "bg-white dark:bg-[#0f1411] ring-[#e2dacd] dark:ring-[#232c26] text-muted-foreground"
                    } ${active ? "scale-110 shadow-lg shadow-[#2d4c38]/20" : ""}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className={`max-w-[84px] text-[10px] font-bold uppercase tracking-wide text-center leading-tight break-words ${
                      done ? "text-[#2d4c38] dark:text-emerald-400" : "text-muted-foreground"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-destructive">Order Cancelled</p>
              <p className="text-xs text-muted-foreground mt-0.5">This order has been cancelled.</p>
            </div>
          </div>
        )}

        {/* ── Items table ── */}
        <div className="rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] overflow-hidden">
          <div className="px-6 py-4 border-b border-border/40 dark:border-[#232c26]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Items ({order.items.length})
            </p>
          </div>

          <div className="divide-y divide-border/30 dark:divide-[#232c26]">
            {order.items.map((item) => (
              <div key={item._id} className="flex items-center gap-4 px-6 py-4">
                {/* image */}
                <div className="relative h-14 w-14 rounded-xl overflow-hidden border border-border/20 flex-shrink-0 bg-muted">
                  <Image
                    src={item.image || "/placeholder.jpg"}
                    alt={item.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                {/* name + qty */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qty {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                {/* line total */}
                <p className="text-sm font-bold text-foreground flex-shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-6 py-4 border-t border-border/40 dark:border-[#232c26] space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">${order.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Shipping</span>
              <span className="font-semibold text-foreground">
                {order.totalAmount >= 75 ? "Free" : "$9.00"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border/30 dark:border-[#232c26]">
              <span>Total</span>
              <span className="text-base font-bold text-[#2d4c38] dark:text-emerald-400 font-serif">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Bottom grid: shipping + payment ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Shipping address */}
          <div className="rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] p-6 space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Shipping Address
              </p>
            </div>
            <div className="text-sm leading-relaxed text-foreground">
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-muted-foreground">{order.shippingAddress.address}</p>
              <p className="text-muted-foreground">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p className="text-muted-foreground">{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && (
                <p className="text-muted-foreground mt-1 text-xs">{order.shippingAddress.phone}</p>
              )}
            </div>
          </div>

          {/* Payment + statuses */}
          <div className="rounded-2xl border border-border/40 dark:border-[#232c26] bg-white dark:bg-[#0f1411] p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400 flex-shrink-0" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Payment
              </p>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="font-semibold text-foreground capitalize">
                  {order.paymentMethod}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <StatusPill status={order.paymentStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shipping Status</span>
                <StatusPill status={order.shippingStatus} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-semibold text-foreground">
                  {new Date(order.updatedAt).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── Help note ── */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Need help with this order?{" "}
          <a href="/contact" className="text-[#b07e3a] hover:text-[#c89348] font-semibold transition-colors">
            Contact Support →
          </a>
        </p>

      </div>
    </div>
  );
}
