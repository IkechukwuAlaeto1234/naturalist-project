import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { registerSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { generateOTP, getFirstValidationError } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { render } from "@react-email/render";
import { OTPEmail } from "@/emails/OTPEmail";
import React from "react";

export async function POST(req: Request) {
  try {
    const body = await req.json();



    // 1. Rate Limiting (max 5 registration attempts per 15 minutes per IP)
    const limiter = await rateLimit("register", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid input data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // 3. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 400 }
      );
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 5. Generate OTP for email verification
    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000);

    // 6. Create User (never persist plaintext password)
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      isVerified: false,
      otp,
      otpExpires,
    });

    // Log user registration
    await AccountLog.create({
      email: normalizedEmail,
      name,
      action: "signup",
      details: "User registered through the website email registration form.",
    });

    // 7. Send OTP Email
    try {
      const html = await render(React.createElement(OTPEmail, { otp, name }));
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your Naturalist account",
        devCode: otp,
        html,
        text: `Welcome to Naturalist. Your verification OTP is ${otp}. This code is valid for 15 minutes.`
      });
    } catch (emailError) {
      console.error("Failed to send registration OTP email:", emailError);
      // We still return 201 because the user was created. They can trigger a resend on the verify page.
    }

    return NextResponse.json(
      {
        message: "Registration successful. Please verify your email.",
        email: user.email,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
