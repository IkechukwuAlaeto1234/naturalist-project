import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Cart } from "@/models/Cart";
import { Notification } from "@/models/Notification";
import { auth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { createCheckoutSession } from "@/lib/stripe";
import { getFirstValidationError } from "@/lib/utils";
import { getRouteWaypoints } from "@/lib/geocoding";
import React from "react";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { AdminNewOrderEmail } from "@/emails/AdminNewOrderEmail";
import { sendEmail } from "@/lib/email";
import { autoAdvanceToProcessing } from "@/lib/order-automation";

/**
 * GET /api/orders
 * Fetch the authenticated user's order history.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find({ user: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET orders error:", error);
    return NextResponse.json({ error: "Failed to retrieve orders" }, { status: 500 });
  }
}

/**
 * POST /api/orders
 * Place a new order and generate a Stripe Checkout Session
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

        const body = await req.json();
    const { items, totalAmount, shippingAddress, currency, paymentStatus, paymentMethod } = body;

    // 2. Validate shipping address with Zod
    const addressValidation = checkoutSchema.safeParse(shippingAddress);
    if (!addressValidation.success) {
      const errorMap = addressValidation.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid shipping address";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Order items cannot be empty" }, { status: 400 });
    }

    await connectToDatabase();

    // 3. Create pending Order in DB
    const orderNumber = `NAT-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`;
    
    let routeWaypoints: any[] = [];
    try {
      const addr = addressValidation.data;
      routeWaypoints = await getRouteWaypoints(addr.city, addr.state, addr.country);
    } catch (geoErr) {
      console.error("Failed to pre-geocode shipping address during checkout:", geoErr);
      routeWaypoints = [
        { lat: 6.4550, lng: 3.3841, label: "Lagos Hub" },
        { lat: -25.7479, lng: 28.2292, label: `${addressValidation.data.city}, ${addressValidation.data.country}` }
      ];
    }

    const isPaidSandbox = paymentMethod === "sandbox" && paymentStatus === "paid";

    const order = await Order.create({
      orderNumber,
      user: session.user.id,
      items,
      shippingAddress: addressValidation.data,
      totalAmount,
      currency: currency || "USD",
      paymentStatus: isPaidSandbox ? "paid" : "pending",
      shippingStatus: isPaidSandbox ? "processing" : "pending",
      paymentMethod: paymentMethod || "stripe",
      routeWaypoints,
    });

    // 4. Generate Stripe session
    let stripeSession;
    if (!isPaidSandbox) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        stripeSession = await createCheckoutSession({
          orderId: order._id.toString(),
          items: items.map((item: any) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            images: item.image ? [item.image] : [],
          })),
          customerEmail: session.user.email!,
          successUrl: `${appUrl}/order-confirmation`,
          cancelUrl: `${appUrl}/checkout`,
        });

        // Save Stripe Session ID on order
        order.stripeSessionId = stripeSession.id;
        await order.save();
      } catch (stripeErr) {
        console.error("Stripe session creation failed, proceeding with order placeholder:", stripeErr);
        // Even if stripe fails, we keep the order so user doesn't lose data. We can redirect to custom confirmation
      }
    }

    // 5. Clear User's Cart
    await Cart.findOneAndDelete({ user: session.user.id });

    // 6. Create in-app notification for the customer
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const orderRef = order.orderNumber || order._id.toString();
      const orderDetailUrl = `${appUrl}/account/orders/${order._id}`;

      const EXCHANGE_RATES: Record<string, { symbol: string; rate: number }> = {
        USD: { symbol: "$",  rate: 1 },
        NGN: { symbol: "₦",  rate: 1620 },
        GBP: { symbol: "£",  rate: 0.79 },
        EUR: { symbol: "€",  rate: 0.92 },
        CAD: { symbol: "CA$", rate: 1.37 },
        GHS: { symbol: "₵",  rate: 15.5 },
        ZAR: { symbol: "R",  rate: 18.6 },
      };

      const orderCurrency = (currency || "USD").toUpperCase();
      const currConfig = EXCHANGE_RATES[orderCurrency] || EXCHANGE_RATES.USD;

      await Notification.create({
        user: session.user.id,
        title: "Order Received",
        message: `Your order ${orderRef} has been placed and is being prepared for shipment.`,
        body: `
          <p style="margin: 0 0 12px 0;">Hi <strong>${session.user.name || "there"}</strong>,</p>
          <p style="margin: 0 0 16px 0;">We&rsquo;ve received your order and our team is preparing your botanical formulas. Here&rsquo;s a summary:</p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <thead>
              <tr style="background:#f4efe6;">
                <th style="text-align:left;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#2d4c38;">Item</th>
                <th style="text-align:center;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#2d4c38;">Qty</th>
                <th style="text-align:right;padding:8px 12px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#2d4c38;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item: any) => {
                    const itemPriceTotal = item.price * item.quantity * currConfig.rate;
                    return `<tr style="border-bottom:1px solid #f4efe6;">
                      <td style="padding:10px 12px;font-size:13px;">${item.name}</td>
                      <td style="padding:10px 12px;font-size:13px;text-align:center;color:#5e6f64;">${item.quantity}</td>
                      <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:bold;">${currConfig.symbol}${itemPriceTotal.toFixed(2)}</td>
                    </tr>`;
                  }
                )
                .join("")}
              <tr style="background:#faf9f5;">
                <td colspan="2" style="padding:12px;text-align:right;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#5e6f64;">Total Paid:</td>
                <td style="padding:12px;text-align:right;font-size:16px;font-weight:bold;color:#2d4c38;">${currConfig.symbol}${(totalAmount * currConfig.rate).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <p style="margin:0 0 8px 0;font-size:13px;color:#5e6f64;"><strong style="color:#141f19;">Order reference:</strong> ${orderRef}</p>
          <p style="margin:0 0 20px 0;font-size:13px;color:#5e6f64;">You will receive another notification once your order has shipped with a tracking number.</p>
        `.trim(),
        type: "order",
        read: false,
        link: orderDetailUrl,
      });
    } catch (notifErr) {
      // Non-critical — don't block the order response
      console.error("Failed to create order notification:", notifErr);
    }

    if (isPaidSandbox) {
      // 1. Auto-advance order status to processing
      try {
        await autoAdvanceToProcessing(order._id.toString());
      } catch (autoErr) {
        console.error("Failed to auto-advance order to processing:", autoErr);
      }

      // 2. Send customer confirmation email
      if (session.user.email) {
        try {
          const confirmationHtml = await render(
            React.createElement(OrderConfirmationEmail, {
              orderId: orderNumber,
              name: session.user.name || "Customer",
              items: items.map((item: any) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              totalAmount,
              shippingAddress: {
                address: addressValidation.data.address,
                city: addressValidation.data.city,
                state: addressValidation.data.state,
                zipCode: addressValidation.data.zipCode,
                country: addressValidation.data.country,
              },
            })
          );

          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const orderDetailUrl = `${appUrl}/account/orders/${order._id}`;

          await sendEmail({
            to: session.user.email,
            subject: `Your Naturalist order is confirmed — ${orderNumber}`,
            html: confirmationHtml,
            text: `Thank you for your order ${orderNumber}! Total paid: $${totalAmount.toFixed(2)}. Visit ${orderDetailUrl} to track your order.`,
          });
        } catch (emailErr) {
          console.error("Failed to send customer confirmation email (sandbox):", emailErr);
        }
      }

      // 3. Send admin alert email
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail) {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          const adminOrderUrl = `${appUrl}/admin/orders`;

          const adminHtml = await render(
            React.createElement(AdminNewOrderEmail, {
              orderId: order._id.toString(),
              orderNumber: orderNumber,
              customerName: session.user.name || "Customer",
              customerEmail: session.user.email || "",
              items: items.map((item: any) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
              })),
              totalAmount,
              shippingAddress: {
                name: addressValidation.data.name,
                address: addressValidation.data.address,
                city: addressValidation.data.city,
                state: addressValidation.data.state,
                zipCode: addressValidation.data.zipCode,
                country: addressValidation.data.country,
                phone: addressValidation.data.phone,
              },
              adminOrderUrl,
            })
          );

          await sendEmail({
            to: adminEmail,
            subject: `[Naturalist] New order ${orderNumber} — $${totalAmount.toFixed(2)} from ${session.user.name || "Customer"}`,
            html: adminHtml,
            text: `New order received!\nOrder: ${orderNumber}\nCustomer: ${session.user.name || "Customer"} (${session.user.email || ""})\nTotal: $${totalAmount.toFixed(2)}\nManage at: ${adminOrderUrl}`,
          });
        } catch (emailErr) {
          console.error("Failed to send admin alert email (sandbox):", emailErr);
        }
      }
    }

    return NextResponse.json(
      {
        message: "Order placed successfully",
        orderId: order._id,
        orderNumber: order.orderNumber,
        checkoutUrl: stripeSession?.url || `/order-confirmation?order_id=${order._id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
