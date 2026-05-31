import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

/**
 * GET /api/orders/my
 * Fetch the authenticated user's own order history.
 * This must live at /api/orders/my/route.ts so Next.js resolves it
 * BEFORE the dynamic /api/orders/[id] segment catches "my" as an ID.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const orders = await Order.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .select("-__v");

    return NextResponse.json(orders, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders/my error:", error);
    return NextResponse.json({ error: "Failed to retrieve orders" }, { status: 500 });
  }
}
