import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";

/**
 * GET /api/user/logs
 * Retrieve the active user's audit logs in chronological order
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch the 100 most recent logs for security audits
    const logs = await AccountLog.find({ email: session.user.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("GET user logs error:", error);
    return NextResponse.json({ error: "Failed to retrieve activity logs" }, { status: 500 });
  }
}
