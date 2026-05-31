import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { productSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { getFirstValidationError } from "@/lib/utils";

/**
 * GET /api/products
 * Fetch all active products. Supports category filter and isFeatured filter.
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const isFeatured = searchParams.get("isFeatured");
    const includeInactive = searchParams.get("includeInactive") === "true";

    const query: Record<string, any> = {};

    // By default, only show active products to public
    if (!includeInactive) {
      query.isActive = true;
    }

    if (category) {
      query.category = category;
    }

    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    const products = await Product.find(query).sort({ createdAt: -1 });
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Failed to retrieve products" }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Create a new product (Admin only)
 */
export async function POST(req: Request) {
  try {
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

    // 3. Check for slug collision
    const slug = result.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existingProduct = await Product.findOne({ slug });
    if (existingProduct) {
      return NextResponse.json(
        { error: "A product with a similar name already exists (slug collision)" },
        { status: 400 }
      );
    }

    // 4. Create product
    const product = await Product.create({
      ...result.data,
      compareAtPrice: result.data.compareAtPrice ?? undefined,
      slug,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("POST product error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
