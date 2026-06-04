import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations"; // just uses email validation
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { render } from "@react-email/render";
import { OTPEmail } from "@/emails/OTPEmail";
import React from "react";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── LOCAL SIMULATION BYPASS ──
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
      const { email } = body;
      const normalizedEmail = (email || "").toLowerCase().trim();
      return NextResponse.json(
        { message: "A new passcode has been sent to your email address." },
        { status: 200 }
      );
    }

    // 1. Rate Limiting (max 3 resends per 10 minutes)
    const limiter = await rateLimit("resend-otp", { limit: 3, windowMs: 10 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please wait 10 minutes before requesting again." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // 3. Find User
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Account is already verified" }, { status: 400 });
    }

    // 4. Generate new OTP passcode
    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // 5. Dispatch verification email
    try {
      const html = await render(React.createElement(OTPEmail, { otp, name: user.name }));
      await sendEmail({
        to: normalizedEmail,
        subject: "Your new Naturalist verification passcode",
        devCode: otp,
        html,
        text: `Your new Naturalist verification passcode is ${otp}. This code is valid for 15 minutes.`
      });
    } catch (emailError) {
      console.error("Failed to resend OTP email:", emailError);
      return NextResponse.json({ error: "Failed to dispatch email. Please try again." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "A new passcode has been sent to your email address." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
