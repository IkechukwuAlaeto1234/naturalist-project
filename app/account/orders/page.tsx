"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  items: OrderItem[];
  shippingStatus: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

export default function OrderRegistryPage() {
  const { status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      Promise.resolve().then(() => setLoading(true));
      const res = await fetch("/api/orders/my");
      if (res.ok) {
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => setMounted(true));
    setTimeout(() => { document.title = "Order History | Naturalist"; }, 150);
  }, []);

  useEffect(() => {
    if (mounted) {
      if (status === "unauthenticated") {
        router.push("/login");
      } else if (status === "authenticated") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

  if (!mounted || status === "loading" || loading) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-serif">Querying order records...</p>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="w-full animate-fade-in-up">
      {/* Order Card Container */}
      <div className="bg-white dark:bg-[#0c100e] border border-border/40 dark:border-[#1a241e]/50 rounded-[32px] p-6 shadow-sm space-y-6">
        <div className="border-b border-border/30 dark:border-[#1a241e]/30 pb-4">
          <h2 className="font-serif text-xl font-bold text-foreground">Order Registry & Tracking</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Review transaction history</p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#e2dacd] dark:border-[#232c26] rounded-3xl bg-muted/5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-primary mb-5">
              <ShoppingBag className="h-6 w-6 text-[#2d4c38] dark:text-emerald-400" />
            </div>
            <h3 className="font-serif text-lg font-bold text-foreground">Registry Empty</h3>
            <p className="text-xs text-muted-foreground max-w-xs mt-2.5 leading-relaxed">
              You haven&apos;t initiated any botanical transactions. Start your first holistic journey in our shop.
            </p>
            <Link href="/shop" className="mt-8 flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d4c38] px-8 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#1a2d21] transition-all shadow-[0_2px_12px_rgba(45,76,56,0.3)] select-none cursor-pointer">
              Browse Collection <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {orders.map((order: Order) => {
              const statusKey = order.shippingStatus || "pending";
              const reference = order.orderNumber || `#${order._id?.slice(-6).toUpperCase()}`;
              const statusLabel =
                statusKey === "pending"     ? "Pending" :
                statusKey === "processing"  ? "Processing" :
                statusKey === "shipped"     ? "Shipped" :
                statusKey === "delivered"   ? "Delivered" :
                statusKey === "cancelled"   ? "Cancelled" : "Pending";
              
              let statusClass = "bg-[#b07e3a]/10 text-[#b07e3a]";
              if (statusKey === "delivered") statusClass = "bg-[#2d4c38]/10 text-[#2d4c38] dark:bg-emerald-500/10 dark:text-emerald-400";
              if (statusKey === "shipped") statusClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400";
              if (statusKey === "cancelled") statusClass = "bg-red-500/10 text-red-500";

              return (
                <div
                  key={order._id}
                  className="p-5 rounded-3xl border border-border/40 dark:border-[#1a241e]/50 bg-white dark:bg-[#0c100e] hover:shadow-md hover:border-[#2d4c38]/25 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-11 w-11 rounded-2xl bg-[#2d4c38]/10 dark:bg-emerald-500/10 flex items-center justify-center text-[#2d4c38] dark:text-emerald-400 flex-shrink-0">
                      <Package className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <Link href={`/account/orders/${order._id}`} className="text-sm font-bold truncate hover:underline hover:text-[#b07e3a] transition-colors">
                        Order {reference}
                      </Link>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                        {" · "}{order.items?.length || 0} {order.items?.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black">${(order.totalAmount || 0).toFixed(2)}</p>
                      <span className={`inline-flex text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <Link
                      href={`/orders/track?id=${order.orderNumber || order._id}`}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-border bg-[#2d4c38]/5 px-5 text-[10px] font-bold uppercase tracking-wider text-[#2d4c38] dark:text-[#a3b2a9] hover:bg-[#2d4c38] hover:text-white transition-all no-underline text-decoration-none"
                    >
                      Track Shipment
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
