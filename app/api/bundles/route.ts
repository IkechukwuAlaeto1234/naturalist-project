import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Bundle } from "@/models/Bundle";
import "@/models/Product"; // register Product schema for Bundle.populate("products")
import { bundleSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { getFirstValidationError } from "@/lib/utils";

/**
 * GET /api/bundles
 * Fetch all active bundles. Populates product details inside.
 */
export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "true";
    const isFeatured = searchParams.get("isFeatured");

    const query: Record<string, any> = {};

    if (!includeInactive) {
      query.isActive = true;
    }

    if (isFeatured === "true") {
      query.isFeatured = true;
    }

    const bundles = await Bundle.find(query)
      .populate("products")
      .sort({ createdAt: -1 });

    return NextResponse.json(bundles, { status: 200 });
  } catch (error) {
    console.error("GET bundles error:", error);
    return NextResponse.json({ error: "Failed to retrieve bundles" }, { status: 500 });
  }
}

/**
 * POST /api/bundles
 * Create a new bundle (Admin only)
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
    const result = bundleSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid bundle data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    await connectToDatabase();

    // 3. Generate unique slug
    const slug = result.data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existingBundle = await Bundle.findOne({ slug });
    if (existingBundle) {
      return NextResponse.json(
        { error: "A bundle with a similar name already exists (slug collision)" },
        { status: 400 }
      );
    }

    // 4. Create bundle
    const bundle = await Bundle.create({
      ...result.data,
      compareAtPrice: result.data.compareAtPrice ?? undefined,
      slug,
    });

    const populatedBundle = await bundle.populate("products");
    return NextResponse.json(populatedBundle, { status: 201 });
  } catch (error) {
    console.error("POST bundle error:", error);
    return NextResponse.json({ error: "Failed to create bundle" }, { status: 500 });
  }
}
