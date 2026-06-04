export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";

// GET /api/content?key=home
// Public read — no auth required. Used by public pages to fetch editable CMS content.
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        }
      );
    }

    await connectToDatabase();

    const content = await Content.findOne({ key: key.toLowerCase() }).lean();

    if (!content) {
      // Return null — callers fall back to hard-coded defaults
      return NextResponse.json(null, {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      });
    }

    return NextResponse.json(content, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/content error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve content" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }
}
