import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import { auth } from "@/lib/auth";

/**
 * DELETE /api/cart/[itemId]
 * Remove an item from the current user's persistent cart.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params;

    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // 2. Find cart
    const cart = await Cart.findOne({ user: session.user.id });
    if (!cart) {
      return NextResponse.json({ error: "Cart not found" }, { status: 404 });
    }

    // 3. Filter out the item
    cart.items = cart.items.filter((item) => item._id?.toString() !== itemId);

    await cart.save();

    // 4. Return populated cart
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("items.bundle");

    return NextResponse.json(populatedCart, { status: 200 });
  } catch (error) {
    console.error("DELETE cart item error:", error);
    return NextResponse.json({ error: "Failed to delete cart item" }, { status: 500 });
  }
}
