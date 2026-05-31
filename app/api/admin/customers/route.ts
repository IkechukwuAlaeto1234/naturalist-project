import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";

/**
 * GET /api/admin/customers
 * Retrieves list of customers with LTV (Lifetime Value) and order count metrics
 */
export async function GET() {
  try {
    // 1. Authenticate and authorize admin
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // 2. Fetch all regular users
    const customers = await User.find({ role: "user" }).sort({ createdAt: -1 });

    // 3. Compile lifetime metrics for each customer
    const customersWithStats = [];
    for (const customer of customers) {
      const orders = await Order.find({ user: customer._id });
      const paidOrders = orders.filter((o) => o.paymentStatus === "paid");
      const lifetimeValue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      customersWithStats.push({
        id: customer._id.toString(),
        name: customer.name,
        email: customer.email,
        isVerified: customer.isVerified,
        ordersCount: orders.length,
        lifetimeValue,
        joinedDate: customer.createdAt.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    }

    return NextResponse.json(customersWithStats, { status: 200 });
  } catch (error) {
    console.error("GET admin customers error:", error);
    return NextResponse.json({ error: "Failed to retrieve customers list" }, { status: 500 });
  }
}
