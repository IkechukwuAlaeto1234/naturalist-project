import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { sendWelcomeEmail } from "@/lib/newsletter";
import { auth } from "@/lib/auth";

// POST /api/admin/newsletter/[id]/send-welcome
// Manually dispatch a welcome email to an active subscriber
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate admin session
    const session = await auth();
    const adminUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const sub = await Newsletter.findById(id);
    if (!sub) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    if (!sub.isActive) {
      return NextResponse.json(
        { error: "Cannot send welcome email to inactive subscriber." },
        { status: 400 }
      );
    }

    if (sub.welcomeEmailSentAt) {
      return NextResponse.json(
        { error: "Welcome email has already been sent to this subscriber." },
        { status: 400 }
      );
    }

    // Call central helper to send welcome email, mark welcomeEmailSentAt, and log the action
    await sendWelcomeEmail(sub, true, adminUser.email);

    return NextResponse.json(sub, { status: 200 });
  } catch (error: any) {
    console.error("POST admin newsletter send-welcome error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send welcome email." },
      { status: 500 }
    );
  }
}
