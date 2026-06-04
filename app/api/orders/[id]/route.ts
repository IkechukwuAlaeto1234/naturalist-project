import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

/**
 * GET /api/orders/[id]
 * Fetch single order details by order ID
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // 2. Fetch order
    const order = await Order.findById(id).populate("user", "name email");
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 3. Authorization check: must belong to the user, OR user must be an admin
    const isOwner = order.user._id.toString() === session.user.id || (order.user as any) === session.user.id;
    const isAdmin = (session.user as any).role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error("GET order details error:", error);
    return NextResponse.json({ error: "Failed to retrieve order details" }, { status: 500 });
  }
}

/**
 * PUT /api/orders/[id]
 * Let users cancel their pending or processing orders, or request refund
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body;

    await connectToDatabase();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const isOwner = order.user.toString() === session.user.id;
    const isAdmin = (session.user as any).role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    if (action === "cancel") {
      if (order.shippingStatus !== "pending" && order.shippingStatus !== "processing") {
        return NextResponse.json({ error: "Only pending or processing orders can be cancelled." }, { status: 400 });
      }

      order.shippingStatus = "cancelled";
      await order.save();

      // Create an Account Log for this order cancellation
      const { headers } = await import("next/headers");
      const headersList = await headers();
      const ua = headersList.get("user-agent") || "";
      const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
      const { parseUserAgent } = await import("@/lib/utils");
      const { browser, os, deviceType } = parseUserAgent(ua);

      const AccountLog = (await import("@/models/AccountLog")).default;
      await AccountLog.create({
        email: session.user.email || "",
        name: session.user.name || "",
        action: "cancel_order",
        details: `Cancelled order ${order.orderNumber || `#${order._id.toString().slice(-6).toUpperCase()}`} of $${order.totalAmount.toFixed(2)}.`,
        ipAddress: ip,
        userAgent: ua,
        browser,
        os,
        deviceType,
      });

      return NextResponse.json({ success: true, message: "Order cancelled successfully.", order }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PUT order error:", error);
    return NextResponse.json({ error: "Failed to process order update" }, { status: 500 });
  }
}
