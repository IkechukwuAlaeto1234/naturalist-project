import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { sendEmail } from "@/lib/email";
import React from "react";

/* ─── Status labels & notes (auto-generated) ──────────────────── */
const STATUS_NOTES: Record<string, string> = {
  pending:           "Order received and awaiting payment confirmation.",
  processing:        "Payment confirmed. Your order has been picked and is being carefully packed.",
  shipped:           "Your order has left our facility and is in transit with NaturaExpress Courier.",
  out_for_delivery:  "Your order is out for delivery and will arrive today.",
  delivered:         "Your order has been delivered successfully. Enjoy your Naturalist products!",
  cancelled:         "This order has been cancelled.",
};

const STATUS_LOCATIONS: Record<string, string> = {
  pending:           "Naturalist Fulfillment Center, Lagos",
  processing:        "Naturalist Fulfillment Center, Lagos",
  shipped:           "NaturaExpress Sorting Hub, Lagos",
  out_for_delivery:  "Local Delivery Station",
  delivered:         "Delivered to recipient",
  cancelled:         "",
};

/* ─── Fake Nigerian route waypoints ──────────────────────────── */
// Simulates a route from Lagos (fulfillment) toward the delivery city.
// We use a few real Nigerian city coords as intermediate points.
const NIGERIAN_HUBS = [
  { lat: 6.4550,  lng: 3.3841,  label: "NaturaExpress Hub, Lagos Island" },
  { lat: 6.5568,  lng: 3.3488,  label: "Ikeja Sorting Depot" },
  { lat: 6.7177,  lng: 3.3959,  label: "Sagamu Junction" },
  { lat: 7.0134,  lng: 3.7244,  label: "Ibadan North Gate" },
  { lat: 7.3775,  lng: 3.9470,  label: "Oyo Express Terminal" },
  { lat: 7.9028,  lng: 4.5560,  label: "Ogbomosho Depot" },
  { lat: 8.5164,  lng: 4.5490,  label: "Ilorin Distribution Center" },
  { lat: 9.0765,  lng: 7.3986,  label: "Abuja Central Hub" },
  { lat: 6.3350,  lng: 5.6037,  label: "Benin City Station" },
  { lat: 4.8156,  lng: 7.0498,  label: "Port Harcourt Terminal" },
];

function generateRouteWaypoints(destCity: string, destState: string) {
  // Always start from Lagos hub
  const start = NIGERIAN_HUBS[0];
  const end   = { lat: 7.3775 + (Math.random() - 0.5) * 2, lng: 3.9470 + (Math.random() - 0.5) * 2, label: `${destCity}, ${destState}` };

  // Pick 2-3 intermediate hubs
  const mid1 = NIGERIAN_HUBS[1];
  const mid2 = NIGERIAN_HUBS[Math.floor(2 + Math.random() * 3)];

  return [start, mid1, mid2, end];
}

function generateTrackingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NTX-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += "-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code; // e.g. NTX-KPJM-48WYR2
}

function addBusinessDays(date: Date, days: number): Date {
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
   PUT /api/admin/orders/[id]
   ══════════════════════════════════════════════════════════════════ */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      shippingStatus,
      paymentStatus,
      // Optional tracking overrides from admin
      trackingNumber: manualTrackingNumber,
      carrier: manualCarrier,
      estimatedDelivery: manualEstimatedDelivery,
    } = body;

    await connectToDatabase();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const oldPaymentStatus  = order.paymentStatus;
    const oldShippingStatus = order.shippingStatus;

    /* ── Update payment status ── */
    if (paymentStatus) {
      const valid = ["pending", "paid", "failed"];
      if (!valid.includes(paymentStatus)) {
        return NextResponse.json({ error: "Invalid payment status" }, { status: 400 });
      }
      order.paymentStatus = paymentStatus;
    }

    /* ── Update shipping status ── */
    if (shippingStatus && shippingStatus !== oldShippingStatus) {
      const valid = ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
      if (!valid.includes(shippingStatus)) {
        return NextResponse.json({ error: "Invalid shipping status" }, { status: 400 });
      }

      order.shippingStatus = shippingStatus;

      /* ── Auto-append status history event ── */
      if (!order.statusHistory) order.statusHistory = [];
      order.statusHistory.push({
        status:    shippingStatus,
        note:      STATUS_NOTES[shippingStatus] ?? `Status updated to ${shippingStatus}.`,
        timestamp: new Date(),
        location:  STATUS_LOCATIONS[shippingStatus] ?? "",
      });

      /* ── When shipped: generate tracking data ── */
      if (shippingStatus === "shipped") {
        order.trackingNumber   = manualTrackingNumber  || generateTrackingNumber();
        order.carrier          = manualCarrier         || "NaturaExpress Courier";
        order.estimatedDelivery = manualEstimatedDelivery
          ? new Date(manualEstimatedDelivery)
          : addBusinessDays(new Date(), 3 + Math.floor(Math.random() * 3)); // 3-5 business days

        // Generate fake GPS route if not already set
        if (!order.routeWaypoints || order.routeWaypoints.length === 0) {
          order.routeWaypoints = generateRouteWaypoints(
            order.shippingAddress?.city  || "Lagos",
            order.shippingAddress?.state || "Lagos"
          );
        }
      }
    }

    await order.save();
    const updatedOrder = await Order.findById(id).populate("user", "name email");

    /* ── Email: payment confirmed ── */
    if (paymentStatus === "paid" && oldPaymentStatus !== "paid" && updatedOrder?.user) {
      try {
        const html = await render(
          React.createElement(OrderConfirmationEmail, {
            orderId: updatedOrder.orderNumber || updatedOrder._id.toString(),
            name: (updatedOrder.user as any).name || "Customer",
            items: updatedOrder.items.map((item: any) => ({
              name: item.name, price: item.price, quantity: item.quantity,
            })),
            totalAmount: updatedOrder.totalAmount,
            shippingAddress: {
              address:  updatedOrder.shippingAddress.address,
              city:     updatedOrder.shippingAddress.city,
              state:    updatedOrder.shippingAddress.state,
              zipCode:  updatedOrder.shippingAddress.zipCode,
              country:  updatedOrder.shippingAddress.country,
            },
          })
        );
        await sendEmail({
          to:      (updatedOrder.user as any).email,
          subject: `Your Naturalist order confirmation — ${updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6).toUpperCase()}`,
          html,
          text:    `Order confirmed. Total: ₦${updatedOrder.totalAmount.toFixed(2)}.`,
        });
      } catch (e) { console.error("Order confirmation email failed:", e); }
    }

    /* ── Email: shipped ── */
    if (shippingStatus === "shipped" && oldShippingStatus !== "shipped" && updatedOrder?.user) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const trackUrl = `${appUrl}/orders/track?id=${updatedOrder.orderNumber || updatedOrder._id}`;

        const html = await render(
          React.createElement(OrderShippedEmail, {
            orderId:        updatedOrder.orderNumber || updatedOrder._id.toString(),
            name:           (updatedOrder.user as any).name || "Customer",
            carrier:        (updatedOrder as any).carrier || "NaturaExpress Courier",
            trackingNumber: (updatedOrder as any).trackingNumber || "",
          })
        );
        await sendEmail({
          to:      (updatedOrder.user as any).email,
          subject: `Your Naturalist order has shipped! — ${updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6).toUpperCase()}`,
          html,
          text:    `Your order has shipped. Track it here: ${trackUrl}`,
        });
      } catch (e) { console.error("Shipped email failed:", e); }
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("PUT admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
