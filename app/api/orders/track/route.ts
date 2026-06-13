import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { getRouteWaypoints } from "@/lib/geocoding";

/**
 * GET /api/orders/track?id=NAT-xxx
 * Public endpoint — no auth required.
 * Returns only safe tracking fields, no PII beyond recipient name and city.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json({ error: "Order ID is required." }, { status: 400 });
    }

    await connectToDatabase();

    // Look up by orderNumber (NAT-xxx format) or MongoDB _id
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    const query = isObjectId ? { _id: id } : { orderNumber: id };

    const order = await Order.findOne(query)
      .populate("user", "name") // only name, no email
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found. Please check your order ID." }, { status: 404 });
    }

    const resolvedWaypoints = (order.routeWaypoints && order.routeWaypoints.length >= 2)
      ? order.routeWaypoints
      : await getRouteWaypoints(
          order.shippingAddress?.city || "Pretoria",
          order.shippingAddress?.state || "",
          order.shippingAddress?.country || "South Africa"
        ).catch(() => [
          { lat: 6.4550, lng: 3.3841, label: "Lagos Hub" },
          { lat: -25.7479, lng: 28.2292, label: `${order.shippingAddress?.city || "Pretoria"}, ${order.shippingAddress?.country || "South Africa"}` }
        ]);

    /* ── Return only safe public fields ── */
    return NextResponse.json({
      orderNumber:       order.orderNumber,
      shippingStatus:    order.shippingStatus,
      paymentStatus:     order.paymentStatus,
      trackingNumber:    order.trackingNumber   ?? null,
      carrier:           order.carrier          ?? null,
      estimatedDelivery: order.estimatedDelivery ?? null,
      statusHistory:     order.statusHistory     ?? [],
      routeWaypoints:    resolvedWaypoints,
      // Items — name, image, quantity only
      items: order.items.map((item: any) => ({
        name:     item.name,
        image:    item.image,
        quantity: item.quantity,
      })),
      // Address — city + state only, no street/phone
      destination: {
        city:    order.shippingAddress?.city    ?? "",
        state:   order.shippingAddress?.state   ?? "",
        country: order.shippingAddress?.country ?? "Nigeria",
      },
      recipientName: (order.user as any)?.name ?? order.shippingAddress?.name ?? "Customer",
      placedAt:      order.createdAt,
      updatedAt:     order.updatedAt,
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/orders/track error:", error);
    return NextResponse.json({ error: "Failed to fetch tracking info." }, { status: 500 });
  }
}
