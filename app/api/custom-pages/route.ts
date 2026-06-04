export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";

export async function GET() {
  try {
    await connectToDatabase();
    const pages = await Content.find({ "metadata.isCustomPage": true }, { title: 1, "metadata.slug": 1 })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json(pages, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/custom-pages error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve custom pages" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }
}
