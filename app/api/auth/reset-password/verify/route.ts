import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { verifyLookupToken, hashEmail } from "@/lib/lookup-token";

export async function POST(req: Request) {
  try {
    const { ref, token } = await req.json();

    if (!ref || !token) {
      return NextResponse.json(
        { error: "Security reference token and passcode are required." },
        { status: 400 }
      );
    }

    const payload = await verifyLookupToken(ref);
    if (!payload) {
      return NextResponse.json(
        { error: "This recovery session has expired or is invalid. Please start over." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // Scan users to match emailHash
    const users = await User.find({}, "email").lean();
    let matchedId = null;

    for (const u of users) {
      const h = await hashEmail(u.email as string);
      if (h === payload.emailHash) {
        matchedId = u._id;
        break;
      }
    }

    if (!matchedId) {
      return NextResponse.json(
        { error: "No account matches this recovery session." },
        { status: 404 }
      );
    }

    const matchedUser = await User.findById(matchedId, "resetToken resetTokenExpires").lean();
    if (!matchedUser) {
      return NextResponse.json(
        { error: "No account matches this recovery session." },
        { status: 404 }
      );
    }

    // Verify token match
    if (!matchedUser.resetToken || matchedUser.resetToken !== token) {
      return NextResponse.json(
        { error: "The security passcode you entered is incorrect." },
        { status: 400 }
      );
    }

    // Verify expiration (15 minutes)
    if (!matchedUser.resetTokenExpires || new Date() > matchedUser.resetTokenExpires) {
      return NextResponse.json(
        { error: "The security passcode has expired. Please request a new one." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Passcode verified successfully.",
    });
  } catch (error) {
    console.error("Reset token verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
