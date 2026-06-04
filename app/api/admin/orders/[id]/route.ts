import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Order } from "@/models/Order";
import { auth } from "@/lib/auth";
import { render } from "@react-email/render";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { sendEmail } from "@/lib/email";
import React from "react";

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

    const oldPaymentStatus = order.paymentStatus;
    const oldShippingStatus = order.shippingStatus;

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

    // Email dispatch logic
    if (paymentStatus === "paid" && oldPaymentStatus !== "paid" && updatedOrder?.user) {
      try {
        const html = await render(
          React.createElement(OrderConfirmationEmail, {
            orderId: updatedOrder.orderNumber || updatedOrder._id.toString(),
            name: (updatedOrder.user as any).name || "Customer",
            items: updatedOrder.items.map((item: any) => ({
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
            totalAmount: updatedOrder.totalAmount,
            shippingAddress: {
              address: updatedOrder.shippingAddress.address,
              city: updatedOrder.shippingAddress.city,
              state: updatedOrder.shippingAddress.state,
              zipCode: updatedOrder.shippingAddress.zipCode,
              country: updatedOrder.shippingAddress.country,
            },
          })
        );
        
        await sendEmail({
          to: (updatedOrder.user as any).email,
          subject: `Your Naturalist order confirmation - ${updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6).toUpperCase()}`,
          html,
          text: `Thank you for your order! Order ID: ${updatedOrder.orderNumber || updatedOrder._id}. Total Paid: $${updatedOrder.totalAmount.toFixed(2)}.`,
        });
      } catch (emailErr) {
        console.error("Failed to send order confirmation email:", emailErr);
      }
    }

    if (shippingStatus === "shipped" && oldShippingStatus !== "shipped" && updatedOrder?.user) {
      try {
        const html = await render(
          React.createElement(OrderShippedEmail, {
            orderId: updatedOrder.orderNumber || updatedOrder._id.toString(),
            name: (updatedOrder.user as any).name || "Customer",
          })
        );
        
        await sendEmail({
          to: (updatedOrder.user as any).email,
          subject: `Your Naturalist order has been shipped! - ${updatedOrder.orderNumber || updatedOrder._id.toString().slice(-6).toUpperCase()}`,
          html,
          text: `Great news! Your Naturalist order ${updatedOrder.orderNumber || updatedOrder._id} has been shipped.`,
        });
      } catch (emailErr) {
        console.error("Failed to send order shipped email:", emailErr);
      }
    }

    return NextResponse.json(updatedOrder, { status: 200 });
  } catch (error) {
    console.error("PUT admin order update error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
