export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";
import { auth } from "@/lib/auth";

// GET /api/admin/content?key=home
// Fetch a single page content document by key (admin only)
export async function GET(req: NextRequest) {
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
    return NextResponse.json(content || null, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/admin/content error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve content" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }
}

// DELETE /api/admin/content?key=terms&versionId=<id>
// Remove a specific archived version from a page's versions array
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const versionId = searchParams.get("versionId");

    if (!key || !versionId) {
      return NextResponse.json({ error: "key and versionId are required" }, { status: 400 });
    }

    await connectToDatabase();

    const content = await Content.findOne({ key: key.toLowerCase() });
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const before = content.versions.length;
    content.versions = content.versions.filter(
      (v: any) => String(v._id) !== versionId
    );
    const after = content.versions.length;

    if (before === after) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await content.save();
    return NextResponse.json({ success: true, deleted: versionId }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to delete version" }, { status: 500 });
  }
}

// POST /api/admin/content
// Upsert (create or update) page content by key (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, title, body: bodyText, images, metadata } = body;

    if (!key || !title) {
      return NextResponse.json({ error: "key and title are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Content.findOne({ key: key.toLowerCase() });
    let versions = existing ? (existing.versions || []) : [];

    if (existing && body.isNewVersion !== false) {
      const snapshot = {
        metadata: existing.metadata || {},
        title: existing.title,
        body: existing.body,
        savedAt: existing.updatedAt || new Date(),
        savedBy: (session.user as any).email || "Admin",
        note: body.versionNote || `Updated at ${new Date().toLocaleString()}`,
      };
      versions.push(snapshot);
      if (versions.length > 20) {
        versions = versions.slice(versions.length - 20);
      }
    }

    const content = await Content.findOneAndUpdate(
      { key: key.toLowerCase() },
      {
        key: key.toLowerCase(),
        title,
        body: bodyText || "",
        images: images || [],
        metadata: metadata || {},
        updatedBy: (session.user as any).id,
        versions,
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error("POST /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
