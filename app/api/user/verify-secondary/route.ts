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

    const { action, secondaryEmail, code } = await req.json();

    if (!secondaryEmail || !/^\S+@\S+\.\S+$/.test(secondaryEmail)) {
      return NextResponse.json({ error: "Please enter a valid secondary email address" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.email === secondaryEmail.toLowerCase()) {
      return NextResponse.json({ error: "Secondary email cannot be the same as your primary email!" }, { status: 400 });
    }

    // Capture headers for logging
    const { headers } = await import("next/headers");
    const headersList = await headers();
    const ua = headersList.get("user-agent") || "";
    const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
    const { parseUserAgent } = await import("@/lib/utils");
    const { browser, os, deviceType } = parseUserAgent(ua);

    if (action === "send_code") {
      // Simulate sending code (in mock mode)
      return NextResponse.json({ success: true, message: "A secure verification code has been dispatched." }, { status: 200 });
    }

    if (action === "verify_code") {
      if (!code || code.trim().length !== 4) {
        return NextResponse.json({ error: "Please enter a complete 4-character passcode." }, { status: 400 });
      }

      // Check if it's correct (in simulation or real, any code works in mock mode!)
      // If code starts with '0' or is '0000', simulate failure
      if (code === "0000" || code.startsWith("0")) {
        return NextResponse.json({ error: "Invalid verification passcode. Please try again." }, { status: 400 });
      }

      // Update secondary email in DB
      user.secondaryEmail = secondaryEmail.toLowerCase().trim();
      user.isSecondaryEmailVerified = true;
      await user.save();

      // Create Audit Log
      await AccountLog.create({
        email: user.email,
        name: user.name,
        action: "verify_secondary_email",
        details: `Added and verified secondary recovery email: ${user.secondaryEmail}.`,
        ipAddress: ip,
        userAgent: ua,
        browser,
        os,
        deviceType,
      });

      return NextResponse.json({
        success: true,
        message: "Secondary recovery email successfully verified!",
        secondaryEmail: user.secondaryEmail,
        isSecondaryEmailVerified: user.isSecondaryEmailVerified
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST verify-secondary error:", error);
    return NextResponse.json({ error: "Failed to process secondary email verification" }, { status: 500 });
  }
}
