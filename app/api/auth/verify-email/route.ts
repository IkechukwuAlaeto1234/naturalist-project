import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { verifyOTPSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getFirstValidationError } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── LOCAL SIMULATION BYPASS ──
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
      const { email, otp } = body;
      const normalizedEmail = (email || "").toLowerCase().trim();
      if (!otp || otp.toString().trim().length !== 4) {
        return NextResponse.json({ error: "The passcode must be exactly 4 characters" }, { status: 400 });
      }
      return NextResponse.json(
        {
          message: "Email verification successful! Your account is now active.",
          isVerified: true,
        },
        { status: 200 }
      );
    }

    // 1. Rate Limiting (max 10 verification attempts per 15 minutes)
    const limiter = await rateLimit("verify-email", { limit: 10 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const result = verifyOTPSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid OTP data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // 3. Find User
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "Account is already verified" }, { status: 200 });
    }

    // 4. Verify OTP code and expiration
    if (!user.otp || user.otp !== otp) {
      return NextResponse.json({ error: "The passcode you entered is incorrect" }, { status: 400 });
    }

    if (!user.otpExpires || new Date() > user.otpExpires) {
      return NextResponse.json({ error: "The passcode has expired. Please request a new one." }, { status: 400 });
    }

    // 5. Update verification status
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return NextResponse.json(
      {
        message: "Email verification successful! Your account is now active.",
        isVerified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Email verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
