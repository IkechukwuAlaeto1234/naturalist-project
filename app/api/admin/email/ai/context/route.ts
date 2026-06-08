/**
 * GET /api/admin/email/ai/context
 * Assembles a rich grounding context package for the Gemini AI email assistant.
 * Called by the Email Hub on load (with or without an inquiryId).
 *
 * Always returns:
 *  - products:      full active product catalogue
 *  - siteStats:     newsletter subscribers, users, orders, revenue, open tickets
 *  - recentOrders:  last 10 store-wide orders
 *
 * When inquiryId is provided, also returns:
 *  - inquiry:        full contact form submission + reply history
 *  - customer:       registered user profile (if email matches)
 *  - customerOrders: order history for that customer (up to 10 most recent)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import { User } from "@/models/User";
import { Newsletter } from "@/models/Newsletter";

export async function GET(req: Request) {
  try {
    const session = await auth();
    const userEmail = (session?.user as any)?.email?.toLowerCase().trim();
    const isAdmin =
      userEmail === "ikechukwualaeto@gmail.com" ||
      (session?.user as any)?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const inquiryId = searchParams.get("inquiryId");

    await connectToDatabase();

    // 1. Products (always included)
    const products = await Product.find({ isActive: true })
      .select("name slug description price compareAtPrice category stock benefits ingredients usage")
      .sort({ createdAt: -1 })
      .lean();

    // 2. Site-wide stats (always included)
    const [
      totalUsers,
      activeSubscribers,
      totalSubscribers,
      totalOrders,
      openTickets,
      unrepliedTickets,
      paidOrdersAgg,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Newsletter.countDocuments({ isActive: true }),
      Newsletter.countDocuments({}),
      Order.countDocuments({}),
      Contact.countDocuments({ status: "open" }),
      Contact.countDocuments({ status: "open", replies: { $size: 0 } }),
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const siteStats = {
      totalUsers,
      activeSubscribers,
      totalSubscribers,
      totalOrders,
      paidOrders: paidOrdersAgg[0]?.count ?? 0,
      totalRevenue: paidOrdersAgg[0]?.revenue ?? 0,
      openTickets,
      unrepliedTickets,
    };

    // 3. Recent store orders (always included, last 10)
    const recentOrderDocs = await Order.find({})
      .populate("user", "email")
      .select("orderNumber items totalAmount paymentStatus shippingStatus createdAt user")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentOrders = recentOrderDocs.map((o: any) => ({
      ...o,
      userEmail: o.user?.email ?? "guest",
    }));

    // 4. Inquiry (only when inquiryId provided)
    let inquiry = null;
    let customer = null;
    let customerOrders: any[] = [];

    if (inquiryId) {
      inquiry = await Contact.findById(inquiryId).lean();

      if (inquiry) {
        // 5. Customer profile (match by email)
        const registeredUser = await User.findOne({ email: (inquiry as any).email })
          .select("name email about pronouns website username shippingAddress createdAt")
          .lean();

        if (registeredUser) {
          customer = registeredUser;

          // 6. Customer orders
          customerOrders = await Order.find({ user: (registeredUser as any)._id })
            .select("orderNumber items shippingAddress paymentStatus shippingStatus totalAmount createdAt")
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();
        }
      }
    }

    return NextResponse.json({
      inquiry,
      customer,
      customerOrders,
      products,
      siteStats,
      recentOrders,
    });
  } catch (error: any) {
    console.error("Email AI context error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load context" },
      { status: 500 }
    );
  }
}
