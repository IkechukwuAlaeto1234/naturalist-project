import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Cart } from "@/models/Cart";
import { Notification } from "@/models/Notification";
import { auth } from "@/lib/auth";
import { checkoutSchema } from "@/lib/validations";
import { createCheckoutSession } from "@/lib/stripe";
import { getFirstValidationError } from "@/lib/utils";

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
    const { items, totalAmount, shippingAddress } = body;

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
    const order = await Order.create({
      orderNumber,
      user: session.user.id,
      items,
      shippingAddress: addressValidation.data,
      totalAmount,
      paymentStatus: "pending",
      shippingStatus: "pending",
      paymentMethod: "stripe",
    });

    // 4. Generate Stripe session
    let stripeSession;
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

    // 5. Clear User's Cart
    await Cart.findOneAndDelete({ user: session.user.id });

    // 6. Create in-app notification for the customer
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const orderRef = order.orderNumber || order._id.toString();
      const orderDetailUrl = `${appUrl}/account/orders/${order._id}`;

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
                  (item: any) =>
                    `<tr style="border-bottom:1px solid #f4efe6;">
                      <td style="padding:10px 12px;font-size:13px;">${item.name}</td>
                      <td style="padding:10px 12px;font-size:13px;text-align:center;color:#5e6f64;">${item.quantity}</td>
                      <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:bold;">${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>`
                )
                .join("")}
              <tr style="background:#faf9f5;">
                <td colspan="2" style="padding:12px;text-align:right;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#5e6f64;">Total Paid:</td>
                <td style="padding:12px;text-align:right;font-size:16px;font-weight:bold;color:#2d4c38;">${totalAmount.toFixed(2)}</td>
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
