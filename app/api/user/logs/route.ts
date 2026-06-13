import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AccountLog } from "@/models/AccountLog";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

/**
 * GET /api/user/logs
 * Retrieve the active user's audit logs in chronological order (Admins only)
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // Verify requesting user is admin
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden access" }, { status: 403 });
    }

    // Fetch the 100 most recent logs for security audits
    const logs = await AccountLog.find({ email: dbUser.email.toLowerCase() })
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("GET user logs error:", error);
    return NextResponse.json({ error: "Failed to retrieve activity logs" }, { status: 500 });
  }
}
