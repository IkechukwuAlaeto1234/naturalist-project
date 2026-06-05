import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getFirstValidationError } from "@/lib/utils";
import { verifyLookupToken, hashEmail } from "@/lib/lookup-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Rate Limiting (max 5 password resets per 15 minutes)
    const limiter = await rateLimit("reset-password", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid reset data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password } = result.data;
    const { ref } = body;

    if (!ref) {
      return NextResponse.json({ error: "Security reference token is required" }, { status: 400 });
    }

    const payload = await verifyLookupToken(ref);
    if (!payload) {
      return NextResponse.json(
        { error: "This recovery session has expired or is invalid. Please start over." },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 3. Find User
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
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const user = await User.findById(matchedId);
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // 4. Verify Reset Token (passcode)
    if (!user.resetToken || user.resetToken !== token) {
      return NextResponse.json({ error: "The passcode you entered is incorrect" }, { status: 400 });
    }

    if (!user.resetTokenExpires || new Date() > user.resetTokenExpires) {
      return NextResponse.json({ error: "The passcode has expired. Please request a new one." }, { status: 400 });
    }

    // 5. Hash new password & save
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    
    // If user was unverified for some reason, resetting password via verified email verifies them!
    user.isVerified = true; 
    
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return NextResponse.json(
      { message: "Your password has been successfully reset. You can now log in." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Password reset completion error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
