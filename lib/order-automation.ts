/**
 * lib/order-automation.ts
 *
 * Central automation engine for order status transitions.
 *
 * Hybrid model:
 *  - pending  → processing   : auto, fires immediately on payment confirmation
 *  - processing → shipped    : admin only (physical handoff to courier)
 *  - shipped  → out_for_delivery : auto, fires X hours after shipped (by city)
 *  - out_for_delivery → delivered : auto, fires 12 hours after out_for_delivery
 */

import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Notification } from "@/models/Notification";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import React from "react";

/* ─── Transit time by state (hours after shipped) ──────────────── */
const TRANSIT_HOURS_BY_STATE: Record<string, number> = {
  // Same-city / Lagos area
  "lagos":    20,
  "ogun":     22,
  // South-West
  "oyo":      28,
  "osun":     30,
  "ondo":     32,
  "ekiti":    34,
  "kwara":    36,
  // South-South
  "edo":      36,
  "delta":    38,
  "rivers":   48,
  "bayelsa":  52,
  "akwa ibom": 50,
  "cross river": 54,
  // South-East
  "anambra":  42,
  "imo":      44,
  "abia":     46,
  "enugu":    48,
  "ebonyi":   50,
  // North-Central
  "fct":      44,
  "abuja":    44,
  "kogi":     46,
  "benue":    50,
  "plateau":  52,
  "nasarawa": 46,
  "niger":    48,
  // North-West
  "kano":     60,
  "kaduna":   56,
  "zamfara":  68,
  "katsina":  66,
  "sokoto":   72,
  "kebbi":    70,
  "jigawa":   64,
  // North-East
  "bauchi":   62,
  "gombe":    64,
  "yobe":     72,
  "borno":    78,
  "adamawa":  68,
  "taraba":   66,
};

const DEFAULT_TRANSIT_HOURS = 48;
const OUT_FOR_DELIVERY_HOURS = 12; // hours after out_for_delivery before auto-delivered

export function getTransitHours(state: string): number {
  const key = (state || "").toLowerCase().trim();
  return TRANSIT_HOURS_BY_STATE[key] ?? DEFAULT_TRANSIT_HOURS;
}

/* ─── Status notes (same as admin route) ───────────────────────── */
const STATUS_NOTES: Record<string, string> = {
  processing:        "Payment confirmed. Your order has been picked and is being carefully packed.",
  out_for_delivery:  "Great news! Your order is out for delivery and will arrive today.",
  delivered:         "Your order has been delivered successfully. Enjoy your Naturalist products!",
};

const STATUS_LOCATIONS: Record<string, string> = {
  processing:        "Naturalist Fulfillment Center, Lagos",
  out_for_delivery:  "Local Delivery Station",
  delivered:         "Delivered to recipient",
};

/* ─── Tracking number + route generators (same as admin route) ─── */
function generateTrackingNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NTX-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const NIGERIAN_HUBS = [
  { lat: 6.4550, lng: 3.3841, label: "NaturaExpress Hub, Lagos Island" },
  { lat: 6.5568, lng: 3.3488, label: "Ikeja Sorting Depot" },
  { lat: 6.7177, lng: 3.3959, label: "Sagamu Junction" },
  { lat: 7.0134, lng: 3.7244, label: "Ibadan North Gate" },
  { lat: 7.3775, lng: 3.9470, label: "Oyo Express Terminal" },
  { lat: 8.5164, lng: 4.5490, label: "Ilorin Distribution Center" },
  { lat: 9.0765, lng: 7.3986, label: "Abuja Central Hub" },
  { lat: 6.3350, lng: 5.6037, label: "Benin City Station" },
  { lat: 4.8156, lng: 7.0498, label: "Port Harcourt Terminal" },
];

export function generateRouteWaypoints(city: string, state: string) {
  const start = NIGERIAN_HUBS[0];
  const dest = {
    lat: 6.5 + (Math.random() - 0.5) * 6,
    lng: 3.5 + (Math.random() - 0.5) * 8,
    label: `${city}, ${state}`,
  };
  const mid1 = NIGERIAN_HUBS[1];
  const mid2 = NIGERIAN_HUBS[2 + Math.floor(Math.random() * 4)];
  return [start, mid1, mid2, dest];
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

/* ══════════════════════════════════════════════════════════════════
   autoAdvanceToProcessing
   Call this immediately after payment is confirmed.
   ══════════════════════════════════════════════════════════════════ */
export async function autoAdvanceToProcessing(orderId: string): Promise<void> {
  const order = await Order.findById(orderId).populate("user", "name email");
  if (!order || order.shippingStatus !== "pending") return;

  order.shippingStatus = "processing";
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status:    "processing",
    note:      STATUS_NOTES.processing,
    timestamp: new Date(),
    location:  STATUS_LOCATIONS.processing,
  });
  await order.save();
}

/* ══════════════════════════════════════════════════════════════════
   autoAdvanceShippedOrders
   Call this from the cron job.
   Scans shipped orders and auto-advances based on elapsed time.
   ══════════════════════════════════════════════════════════════════ */
export async function autoAdvanceShippedOrders(): Promise<{
  advanced: number;
  errors: number;
}> {
  await connectToDatabase();

  const now = new Date();
  let advanced = 0;
  let errors = 0;

  /* ── 1. shipped → out_for_delivery ─────────────────────────── */
  const shippedOrders = await Order.find({
    shippingStatus: "shipped",
    paymentStatus:  "paid",
  }).populate("user", "name email");

  for (const order of shippedOrders) {
    try {
      // Find when it was marked shipped
      const shippedEvent = order.statusHistory?.find((e: any) => e.status === "shipped");
      if (!shippedEvent) continue;

      const shippedAt = new Date(shippedEvent.timestamp);
      const transitHours = getTransitHours(order.shippingAddress?.state || "");
      const outForDeliveryAt = new Date(shippedAt.getTime() + transitHours * 3600000);

      if (now >= outForDeliveryAt) {
        order.shippingStatus = "out_for_delivery";
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
          status:    "out_for_delivery",
          note:      STATUS_NOTES.out_for_delivery,
          timestamp: now,
          location:  `${order.shippingAddress?.city || "Local"} Delivery Station`,
        });
        await order.save();
        advanced++;

        // Fire in-app notification
        await fireStatusNotification(order, "out_for_delivery");
      }
    } catch (e) {
      console.error(`autoAdvance shipped→OFD error for order ${order._id}:`, e);
      errors++;
    }
  }

  /* ── 2. out_for_delivery → delivered ───────────────────────── */
  const ofdOrders = await Order.find({
    shippingStatus: "out_for_delivery",
    paymentStatus:  "paid",
  }).populate("user", "name email");

  for (const order of ofdOrders) {
    try {
      const ofdEvent = order.statusHistory?.find((e: any) => e.status === "out_for_delivery");
      if (!ofdEvent) continue;

      const ofdAt = new Date(ofdEvent.timestamp);
      const deliveredAt = new Date(ofdAt.getTime() + OUT_FOR_DELIVERY_HOURS * 3600000);

      if (now >= deliveredAt) {
        order.shippingStatus = "delivered";
        if (!order.statusHistory) order.statusHistory = [];
        order.statusHistory.push({
          status:    "delivered",
          note:      STATUS_NOTES.delivered,
          timestamp: now,
          location:  STATUS_LOCATIONS.delivered,
        });
        await order.save();
        advanced++;

        // Fire in-app notification
        await fireStatusNotification(order, "delivered");
      }
    } catch (e) {
      console.error(`autoAdvance OFD→delivered error for order ${order._id}:`, e);
      errors++;
    }
  }

  return { advanced, errors };
}

/* ─── In-app notification helper ───────────────────────────────── */
async function fireStatusNotification(order: any, status: string) {
  const customer = order.user as any;
  if (!customer?._id) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const orderRef = order.orderNumber || order._id.toString();
  const trackUrl = `${appUrl}/orders/track?id=${orderRef}`;

  const NOTIF_CONTENT: Record<string, { title: string; message: string; body: string }> = {
    out_for_delivery: {
      title:   "Your order is out for delivery!",
      message: `Order ${orderRef} is out for delivery and will arrive today.`,
      body:    `<p>Hi <strong>${customer.name || "there"}</strong>,</p><p>Your Naturalist order <strong>${orderRef}</strong> is out for delivery and will arrive at your doorstep today.</p><p><a href="${trackUrl}">Track your order →</a></p>`,
    },
    delivered: {
      title:   "Your order has been delivered!",
      message: `Order ${orderRef} has been delivered. Enjoy your Naturalist products!`,
      body:    `<p>Hi <strong>${customer.name || "there"}</strong>,</p><p>Your Naturalist order <strong>${orderRef}</strong> has been delivered successfully.</p><p>We hope you love your new botanical formulas. If you have any issues, <a href="${appUrl}/contact">contact us</a>.</p>`,
    },
  };

  const content = NOTIF_CONTENT[status];
  if (!content) return;

  try {
    await Notification.create({
      user:    customer._id,
      title:   content.title,
      message: content.message,
      body:    content.body,
      type:    "order",
      read:    false,
      link:    trackUrl,
    });
  } catch (e) {
    console.error("fireStatusNotification error:", e);
  }
}
