import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { productSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { getFirstValidationError } from "@/lib/utils";

/**
 * GET /api/products/[slug]
 * Fetch a single product by its slug
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("GET product by slug error:", error);
    return NextResponse.json({ error: "Failed to retrieve product" }, { status: 500 });
  }
}

/**
 * PUT /api/products/[slug]
 * Update a product (Admin only)
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Authenticate and authorize admin
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const result = productSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid product data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    await connectToDatabase();

    // 3. Find and update product
    const product = await Product.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Save original name for slug comparison
    const originalName = product.name;

    // Update fields (only set provided fields to avoid overwriting Mongoose internals)
    product.name = result.data.name;
    product.description = result.data.description;
    product.price = result.data.price;
    product.compareAtPrice = result.data.compareAtPrice ?? undefined;
    product.images = result.data.images;
    product.category = result.data.category;
    product.stock = result.data.stock;
    product.isActive = result.data.isActive;
    product.isFeatured = result.data.isFeatured;
    if (result.data.benefits !== undefined) product.benefits = result.data.benefits;
    if (result.data.ingredients !== undefined) product.ingredients = result.data.ingredients;
    if (result.data.usage !== undefined) product.usage = result.data.usage;

    // Regenerate slug if name changed
    if (result.data.name && result.data.name !== originalName) {
      product.slug = result.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    await product.save();
    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error("PUT product error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update product";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * DELETE /api/products/[slug]
 * Delete a product (Admin only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // 1. Authenticate and authorize admin
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // 2. Find and delete product
    const product = await Product.findOneAndDelete({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Product deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE product error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
