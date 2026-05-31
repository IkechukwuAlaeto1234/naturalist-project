import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 3 forgot password requests per 15 minutes)
    const limiter = await rateLimit("forgot-password", { limit: 3 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many password reset attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
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
      await sendEmail({
        to: normalizedEmail,
        subject: "Reset your Naturalist password",
        devCode: resetToken,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2dacd; border-radius: 8px; background-color: #fbfbf9;">
            <h2 style="color: #2d4c38; font-family: Georgia, serif; text-align: center;">Password Reset Request</h2>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p>You requested to reset your password for your Naturalist account. Please use the password reset passcode below to complete the reset process:</p>
            <div style="background-color: #f4efe6; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2d4c38;">${resetToken}</span>
            </div>
            <p style="font-size: 14px; color: #5e6f64;">This passcode is valid for the next 15 minutes. If you did not request this password reset, please ignore this email; your password will remain unchanged.</p>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #5e6f64; text-align: center;">Naturalist &copy; ${new Date().getFullYear()} | Premium Organic Skincare & Wellness</p>
          </div>
        `,
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
