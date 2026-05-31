import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";

// GET /api/admin/logs
// Fetch all registration and user activity logs
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const logs = await AccountLog.find({}).sort({ createdAt: -1 }).limit(100);
    return NextResponse.json(logs, { status: 200 });
  } catch (error) {
    console.error("GET admin logs error:", error);
    return NextResponse.json({ error: "Failed to retrieve logs" }, { status: 500 });
  }
}
