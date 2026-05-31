import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Bundle } from "@/models/Bundle";
import { bundleSchema } from "@/lib/validations";
import { auth } from "@/lib/auth";
import { getFirstValidationError } from "@/lib/utils";

/**
 * GET /api/bundles/[slug]
 * Fetch a single bundle by slug, populated with its products.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const bundle = await Bundle.findOne({ slug }).populate("products");
    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    return NextResponse.json(bundle, { status: 200 });
  } catch (error) {
    console.error("GET bundle by slug error:", error);
    return NextResponse.json({ error: "Failed to retrieve bundle" }, { status: 500 });
  }
}

/**
 * PUT /api/bundles/[slug]
 * Update a bundle (Admin only)
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
    const result = bundleSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid bundle data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    await connectToDatabase();

    // 3. Find and update bundle
    const bundle = await Bundle.findOne({ slug });
    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    // Update fields
    Object.assign(bundle, {
      ...result.data,
      compareAtPrice: result.data.compareAtPrice ?? undefined,
    });
    
    // Regenerate slug if name changed
    if (result.data.name && result.data.name !== bundle.name) {
      bundle.slug = result.data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
    }

    await bundle.save();
    const populated = await bundle.populate("products");
    return NextResponse.json(populated, { status: 200 });
  } catch (error) {
    console.error("PUT bundle error:", error);
    return NextResponse.json({ error: "Failed to update bundle" }, { status: 500 });
  }
}

/**
 * DELETE /api/bundles/[slug]
 * Delete a bundle (Admin only)
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

    // 2. Find and delete bundle
    const bundle = await Bundle.findOneAndDelete({ slug });
    if (!bundle) {
      return NextResponse.json({ error: "Bundle not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Bundle deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE bundle error:", error);
    return NextResponse.json({ error: "Failed to delete bundle" }, { status: 500 });
  }
}
