import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { auth } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/newsletter";

// GET /api/admin/newsletter
// Fetch all subscribers (Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const subscribers = await Newsletter.find({}).sort({ subscribedAt: -1 });

    return NextResponse.json(subscribers, { status: 200 });
  } catch (error) {
    console.error("GET admin newsletter error:", error);
    return NextResponse.json({ error: "Failed to retrieve newsletter subscribers" }, { status: 500 });
  }
}

// POST /api/admin/newsletter (Manually subscribe someone)
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const adminEmail = (session.user as any).email || "System";

    await connectToDatabase();

    const existing = await Newsletter.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      if (existing.isActive) {
        return NextResponse.json({ error: "This email is already subscribed" }, { status: 400 });
      }
      existing.isActive = true;
      existing.unsubscribedAt = undefined;
      existing.welcomeEmailSentAt = undefined; // reset to allow sending welcome email
      await existing.save();

      // Dispatch welcome email and log it
      try {
        await sendWelcomeEmail(existing, true, adminEmail);
      } catch (err) {
        console.error("Failed to send welcome email for reactivated manual subscriber:", err);
      }
      
      return NextResponse.json(existing, { status: 200 });
    }

    const newSub = await Newsletter.create({
      email: email.toLowerCase().trim(),
      isActive: true,
    });

    // Dispatch welcome email and log it
    try {
      await sendWelcomeEmail(newSub, true, adminEmail);
    } catch (err) {
      console.error("Failed to send welcome email for new manual subscriber:", err);
    }

    return NextResponse.json(newSub, { status: 201 });
  } catch (error) {
    console.error("POST admin newsletter subscribe error:", error);
    return NextResponse.json({ error: "Failed to add subscriber" }, { status: 500 });
  }
}
