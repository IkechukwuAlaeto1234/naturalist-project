import { NextResponse } from "next/server";

import { headers } from "next/headers";
import { render } from "@react-email/render";
import React from "react";

import { connectToDatabase } from "@/lib/db";
import { verifyStripeWebhook } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { Order } from "@/models/Order";
import { Notification } from "@/models/Notification";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { AdminNewOrderEmail } from "@/emails/AdminNewOrderEmail";
import { autoAdvanceToProcessing } from "@/lib/order-automation";

/**
 * POST /api/webhooks/stripe
 *
 * Listens for Stripe events. On `checkout.session.completed`:
 *  1. Marks the order as paid in the database.
 *  2. Creates an in-app notification for the customer.
 *  3. Sends the customer a branded order confirmation email.
 *  4. Sends the admin a new-order alert email.
 *
 * IMPORTANT: This route must receive the raw request body for Stripe
 * signature verification. Next.js parses the body as a stream here.
 */
export async function POST(req: Request) {
  // ── 1. Read raw body for signature verification ──────────────────────────
  const rawBody = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature") ?? "";

  // ── 2. Verify webhook signature ──────────────────────────────────────────
  let event;
  try {
    event = verifyStripeWebhook(rawBody, signature);
  } catch (err: any) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook signature invalid: ${err.message}` },
      { status: 400 }
    );
  }

  // ── 3. Handle events ─────────────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const orderId: string | undefined = session.metadata?.orderId || session.client_reference_id;

    if (!orderId) {
      console.warn("Stripe webhook: checkout.session.completed received without orderId in metadata.");
      return NextResponse.json({ received: true });
    }

    try {
      await connectToDatabase();

      // Find and update the order
      const order = await Order.findById(orderId).populate("user", "name email role");
      if (!order) {
        console.error(`Stripe webhook: Order not found for id ${orderId}`);
        return NextResponse.json({ received: true });
      }

      // Guard against duplicate webhook deliveries
      if (order.paymentStatus === "paid") {
        return NextResponse.json({ received: true });
      }

      order.paymentStatus = "paid";
      await order.save();

      // Auto-advance to processing immediately
      await autoAdvanceToProcessing(order._id.toString());

      const customer = order.user as any; // populated
      const customerName: string = customer?.name || "Customer";
      const customerEmail: string = customer?.email || "";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const orderRef = order.orderNumber || order._id.toString();
      const orderDetailUrl = `${appUrl}/account/orders/${order._id}`;
      const adminOrderUrl = `${appUrl}/admin/orders`;

      // ── 3a. In-app notification ──────────────────────────────────────────
      if (customer?._id) {
        try {
          const itemSummary = order.items
            .slice(0, 2)
            .map((i: any) => i.name)
            .join(", ");
          const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} more` : "";

          await Notification.create({
            user: customer._id,
            title: "Order Confirmed",
            message: `Your order ${orderRef} has been received and is being prepared.`,
            body: `
              <p>Hi <strong>${customerName}</strong>,</p>
              <p>We have received your order <strong>${orderRef}</strong> and payment has been confirmed.</p>
              <p><strong>Items:</strong> ${itemSummary}${moreItems}</p>
              <p><strong>Total paid:</strong> $${order.totalAmount.toFixed(2)}</p>
              <p>You will receive another notification once your order ships.</p>
              <p><a href="${orderDetailUrl}">View order details →</a></p>
            `.trim(),
            type: "order",
            read: false,
            link: orderDetailUrl,
          });
        } catch (notifErr) {
          console.error("Failed to create in-app notification:", notifErr);
        }
      }

      // ── 3b. Customer confirmation email ──────────────────────────────────
      if (customerEmail) {
        try {
          const confirmationHtml = await render(
            React.createElement(OrderConfirmationEmail, {
              orderId: orderRef,
              name: customerName,
              items: order.items.map((item: any) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              totalAmount: order.totalAmount,
              shippingAddress: {
                address: order.shippingAddress.address,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                country: order.shippingAddress.country,
              },
            })
          );

          await sendEmail({
            to: customerEmail,
            subject: `Your Naturalist order is confirmed — ${orderRef}`,
            html: confirmationHtml,
            text: `Thank you for your order ${orderRef}! Total paid: $${order.totalAmount.toFixed(2)}. Visit ${orderDetailUrl} to track your order.`,
          });
        } catch (emailErr) {
          console.error("Failed to send customer confirmation email:", emailErr);
        }
      }

      // ── 3c. Admin alert email ─────────────────────────────────────────────
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        try {
          const adminHtml = await render(
            React.createElement(AdminNewOrderEmail, {
              orderId: order._id.toString(),
              orderNumber: orderRef,
              customerName,
              customerEmail,
              items: order.items.map((item: any) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              totalAmount: order.totalAmount,
              shippingAddress: {
                name: order.shippingAddress.name,
                address: order.shippingAddress.address,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                zipCode: order.shippingAddress.zipCode,
                country: order.shippingAddress.country,
                phone: order.shippingAddress.phone,
              },
              adminOrderUrl,
            })
          );

          await sendEmail({
            to: adminEmail,
            subject: `[Naturalist] New order ${orderRef} — $${order.totalAmount.toFixed(2)} from ${customerName}`,
            html: adminHtml,
            text: `New order received!\nOrder: ${orderRef}\nCustomer: ${customerName} (${customerEmail})\nTotal: $${order.totalAmount.toFixed(2)}\nManage at: ${adminOrderUrl}`,
          });
        } catch (emailErr) {
          console.error("Failed to send admin alert email:", emailErr);
        }
      } else {
        console.warn(
          "ADMIN_EMAIL env variable is not set. Skipping admin notification for order:",
          orderRef
        );
      }
    } catch (err) {
      console.error("Stripe webhook handler error:", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Acknowledge all other events
  return NextResponse.json({ received: true });
}
