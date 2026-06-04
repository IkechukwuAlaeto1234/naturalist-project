import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { sessionId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find the session to log it
    const targetSession = user.sessions?.find((s: any) => s.id === sessionId);
    const sessionDetail = targetSession 
      ? `${targetSession.browser} on ${targetSession.os} (${targetSession.ipAddress})`
      : "Unknown Device";

    // Remove the session from array
    await User.findByIdAndUpdate(session.user.id, {
      $pull: { sessions: { id: sessionId } }
    });

    // Capture headers for logging the action
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const { parseUserAgent } = await import("@/lib/utils");
    const { browser, os, deviceType } = parseUserAgent(ua);

    // Create Audit Log
    await AccountLog.create({
      email: user.email,
      name: user.name,
      action: "revoke_session",
      details: `Revoked active device session: ${sessionDetail}.`,
      ipAddress: ip,
      userAgent: ua,
      browser,
      os,
      deviceType,
    });

    return NextResponse.json({ success: true, message: "Session revoked successfully" }, { status: 200 });
  } catch (error) {
    console.error("POST revoke-session error:", error);
    return NextResponse.json({ error: "Failed to revoke session" }, { status: 500 });
  }
}
