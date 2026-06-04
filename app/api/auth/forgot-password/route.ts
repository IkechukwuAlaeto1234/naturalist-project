import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import React from "react";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ── LOCAL SIMULATION BYPASS ──
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
      const { email } = body;
      const normalizedEmail = (email || "").toLowerCase().trim();
      
      // Simulate "account not found" if email contains 'nonexistent', 'missing', or 'notfound'
      if (
        normalizedEmail.includes("nonexistent") ||
        normalizedEmail.includes("missing") ||
        normalizedEmail.includes("notfound")
      ) {
        return NextResponse.json(
          { error: "No botanical profile registered under this email." },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: "If an account matches that email, a password reset passcode has been sent." },
        { status: 200 }
      );
    }

    // 1. Rate Limiting (max 3 forgot password requests per 15 minutes)
    const limiter = await rateLimit("forgot-password", { limit: 3 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please wait 15 minutes." },
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
      // Return 200 even if user doesn't exist, to prevent email enumeration attacks!
      // Security best practices!
      return NextResponse.json(
        { message: "If an account matches that email, a password reset passcode has been sent." },
        { status: 200 }
      );
    }

    // 4. Generate 6-digit reset passcode
    const resetToken = generateOTP(6);
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpires;
    await user.save();

    // 5. Send Password Reset Email
    try {
      const html = await render(React.createElement(PasswordResetEmail, { token: resetToken, name: user.name }));
      await sendEmail({
        to: normalizedEmail,
        subject: "Reset your Naturalist password",
        devCode: resetToken,
        html,
        text: `You requested a password reset. Your passcode is ${resetToken}. This code is valid for 15 minutes.`
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json({ error: "Failed to dispatch email. Please try again." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "If an account matches that email, a password reset passcode has been sent." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
