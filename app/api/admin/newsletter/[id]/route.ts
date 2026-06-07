import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { auth } from "@/lib/auth";

// PUT /api/admin/newsletter/[id]
// Toggle active status (unsubscribe/resubscribe)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { isActive } = await req.json();

    await connectToDatabase();

    const sub = await Newsletter.findById(id);
    if (!sub) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    sub.isActive = isActive;
    if (!isActive) {
      sub.unsubscribedAt = new Date();
      sub.welcomeEmailSentAt = undefined;
    } else {
      sub.unsubscribedAt = undefined;
    }

    await sub.save();
    return NextResponse.json(sub, { status: 200 });
  } catch (error) {
    console.error("PUT admin newsletter error:", error);
    return NextResponse.json({ error: "Failed to update subscriber status" }, { status: 500 });
  }
}

// DELETE /api/admin/newsletter/[id]
// Permanently remove a subscriber
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const sub = await Newsletter.findByIdAndDelete(id);
    if (!sub) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Subscriber deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE admin newsletter error:", error);
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 });
  }
}
