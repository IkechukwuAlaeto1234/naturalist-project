import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { resetPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { getFirstValidationError } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 5 password resets per 15 minutes)
    const limiter = await rateLimit("reset-password", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid reset data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token, password } = result.data;
    // We expect the client to also provide the email to guarantee uniqueness and prevent collisions
    const email = body.email ? body.email.toString().toLowerCase().trim() : null;

    if (!email) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 3. Find User
    const user = await User.findOne({ email });
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
