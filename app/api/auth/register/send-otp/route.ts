import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { render } from "@react-email/render";
import { OTPEmail } from "@/emails/OTPEmail";
import React from "react";

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit registration requests
    const limiter = await rateLimit("register-send-otp", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 400 }
      );
    }

    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    if (existingUser) {
      existingUser.name = name.trim();
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      await User.create({
        name: name.trim(),
        email: normalizedEmail,
        isVerified: false,
        otp,
        otpExpires,
      });
    }

    // Send the email
    try {
      const html = await render(React.createElement(OTPEmail, { otp, name }));
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your Naturalist account",
        devCode: otp,
        html,
        text: `Welcome to Naturalist. Your verification OTP is ${otp}. This code is valid for 15 minutes.`,
      });
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError);
      return NextResponse.json(
        { error: "Failed to dispatch verification email. Please check SMTP settings." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Verification code sent successfully" });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
