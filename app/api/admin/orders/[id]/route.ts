import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

/**
 * PUT /api/admin/orders/[id]
 * Updates order shipping or payment status (Admin only)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate and authorize admin
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { shippingStatus, paymentStatus } = await req.json();

    await connectToDatabase();

    const order = await Order.findById(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update fields if provided
    if (shippingStatus) {
      const validShippingStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
      if (!validShippingStatuses.includes(shippingStatus)) {
        return NextResponse.json({ error: "Invalid shipping status value" }, { status: 400 });
      }
      order.shippingStatus = shippingStatus;
    }

    if (paymentStatus) {
      const validPaymentStatuses = ["pending", "paid", "failed"];
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return NextResponse.json({ error: "Invalid payment status value" }, { status: 400 });
      }
      order.paymentStatus = paymentStatus;
    }

    await order.save();
    
    const updatedOrder = await Order.findById(id).populate("user", "name email");
    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("PUT admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
