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
