import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

// GET /api/admin/orders
// Fetch all orders in the system (Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find({})
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET admin orders error:", error);
    return NextResponse.json({ error: "Failed to retrieve orders list" }, { status: 500 });
  }
}
