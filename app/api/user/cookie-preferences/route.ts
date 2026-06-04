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

    const { analytics, marketing, promotions } = await req.json();

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Capture headers for logging the action
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const { parseUserAgent } = await import("@/lib/utils");
    const { browser, os, deviceType } = parseUserAgent(ua);

    const activePrefs = [];
    if (analytics) activePrefs.push("Analytics");
    if (marketing) activePrefs.push("Marketing & Personalization");
    if (promotions) activePrefs.push("Email Promotions & Newsletter");

    const prefDetails = activePrefs.length > 0 
      ? `Authorized cookie preferences: Essential (Locked), ${activePrefs.join(", ")}`
      : "Authorized cookie preferences: Essential (Locked) only";

    // Create Audit Log
    await AccountLog.create({
      email: user.email,
      name: user.name,
      action: "cookie_preferences_update",
      details: prefDetails,
      ipAddress: ip,
      userAgent: ua,
      browser,
      os,
      deviceType,
    });

    return NextResponse.json({ success: true, message: "Cookie preferences successfully updated!" }, { status: 200 });
  } catch (error) {
    console.error("POST cookie-preferences error:", error);
    return NextResponse.json({ error: "Failed to update cookie preferences" }, { status: 500 });
  }
}
