export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";
import { auth } from "@/lib/auth";

// GET /api/admin/custom-pages
// Returns all Content docs that are admin-created custom pages (isCustomPage: true)
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        }
      );
    }

    await connectToDatabase();

    const pages = await Content.find({ "metadata.isCustomPage": true })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(pages, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/admin/custom-pages error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve custom pages" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }
}

// DELETE /api/admin/custom-pages?slug=returns-exchanges
// Deletes the Content document representing the custom page by its slug (admin only)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    await connectToDatabase();

    const res = await Content.deleteOne({
      key: `page-${slug.toLowerCase()}`,
      "metadata.isCustomPage": true,
    });

    if (res.deletedCount === 0) {
      return NextResponse.json({ error: "Custom page not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Page /p/${slug} deleted` }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/admin/custom-pages error:", error);
    return NextResponse.json({ error: "Failed to delete custom page" }, { status: 500 });
  }
}
