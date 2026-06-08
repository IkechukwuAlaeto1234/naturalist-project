import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { auth } from "@/lib/auth";

// GET /api/user/notifications
// Fetch all notifications for the authenticated user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const notifications = await Notification.find({ user: session.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json(notifications, { status: 200 });
  } catch (error) {
    console.error("GET notifications error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

// PUT /api/user/notifications
// Mark notification(s) as read
// Body: { id?: string } — if id is provided, mark that one; otherwise mark all
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { id } = body as { id?: string };

    await connectToDatabase();

    if (id) {
      await Notification.findOneAndUpdate(
        { _id: id, user: session.user.id },
        { $set: { read: true } }
      );
    } else {
      await Notification.updateMany(
        { user: session.user.id, read: false },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT notifications error:", error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
