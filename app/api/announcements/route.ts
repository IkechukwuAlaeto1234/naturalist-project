import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Announcement } from "@/models/Announcement";

/**
 * GET /api/announcements
 * Returns all active announcements ordered by priority.
 * Optional ?all=1 returns all (for admin use).
 */
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all") === "1";

    const now = new Date();
    const query = all
      ? {}
      : {
          isActive: true,
          $or: [
            { startsAt: { $exists: false } },
            { startsAt: null },
            { startsAt: { $lte: now } },
          ],
          $and: [
            {
              $or: [
                { endsAt: { $exists: false } },
                { endsAt: null },
                { endsAt: { $gte: now } },
              ],
            },
          ],
        };

    const announcements = await Announcement.find(query)
      .sort({ priority: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(announcements);
  } catch (error) {
    console.error("[GET /api/announcements]", error);
    return NextResponse.json(
      { error: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/announcements  — admin only, creates new announcement
 */
export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const announcement = await Announcement.create(body);
    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("[POST /api/announcements]", error);
    return NextResponse.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/announcements  — admin, update by id
 */
export async function PATCH(req: NextRequest) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const doc = await Announcement.findByIdAndUpdate(id, update, { new: true });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

/**
 * DELETE /api/announcements?id=xxx — admin
 */
export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await Announcement.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
