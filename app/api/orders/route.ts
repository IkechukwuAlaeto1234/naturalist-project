import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { Cart } from "@/models/Cart";
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

    return NextResponse.json(
      {
        message: "Order placed successfully",
        orderId: order._id,
        checkoutUrl: stripeSession?.url || `/order-confirmation?order_id=${order._id}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST order error:", error);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
