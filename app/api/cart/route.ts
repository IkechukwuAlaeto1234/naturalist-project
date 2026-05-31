import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Cart } from "@/models/Cart";
import "@/models/Product"; // register Product schema for populate
import "@/models/Bundle";  // register Bundle schema for populate
import { auth } from "@/lib/auth";
import mongoose from "mongoose";

/**
 * GET /api/cart
 * Get the current user's persistent cart. Creates an empty one if not found.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    let cart = await Cart.findOne({ user: session.user.id })
      .populate("items.product")
      .populate("items.bundle");

    if (!cart) {
      // Create empty cart for new user
      cart = await Cart.create({
        user: session.user.id,
        items: [],
      });
    }

    return NextResponse.json(cart, { status: 200 });
  } catch (error) {
    console.error("GET cart error:", error);
    return NextResponse.json({ error: "Failed to retrieve cart" }, { status: 500 });
  }
}

/**
 * POST /api/cart
 * Add an item to cart or update its quantity.
 * Body requires:
 * - productId OR bundleId: string
 * - quantity: number
 * - price: number
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { productId, bundleId, quantity, price } = await req.json();

    if (!productId && !bundleId) {
      return NextResponse.json({ error: "Either productId or bundleId must be provided" }, { status: 400 });
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: "Quantity must be at least 1" }, { status: 400 });
    }

    await connectToDatabase();

    let cart = await Cart.findOne({ user: session.user.id });

    if (!cart) {
      cart = new Cart({
        user: session.user.id,
        items: [],
      });
    }

    // Check if the item already exists in the cart
    let itemIndex = -1;
    if (productId) {
      itemIndex = cart.items.findIndex(
        (item) => item.product?.toString() === productId
      );
    } else if (bundleId) {
      itemIndex = cart.items.findIndex(
        (item) => item.bundle?.toString() === bundleId
      );
    }

    if (itemIndex > -1) {
      // Item exists, update quantity
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].price = price;
    } else {
      // Add new item
      cart.items.push({
        product: productId ? new mongoose.Types.ObjectId(productId) : undefined,
        bundle: bundleId ? new mongoose.Types.ObjectId(bundleId) : undefined,
        quantity,
        price,
      });
    }

    await cart.save();
    
    // Return fully populated cart
    const populatedCart = await Cart.findById(cart._id)
      .populate("items.product")
      .populate("items.bundle");

    return NextResponse.json(populatedCart, { status: 200 });
  } catch (error) {
    console.error("POST cart error:", error);
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}
