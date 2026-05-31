import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations"; // just uses email validation
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 3 resends per 10 minutes)
    const limiter = await rateLimit("resend-otp", { limit: 3, windowMs: 10 * 60 * 1000 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please wait 10 minutes before requesting again." },
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
      await sendEmail({
        to: normalizedEmail,
        subject: "Your new Naturalist verification passcode",
        devCode: otp,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2dacd; border-radius: 8px; background-color: #fbfbf9;">
            <h2 style="color: #2d4c38; font-family: Georgia, serif; text-align: center;">Verify your email</h2>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p>You requested a new verification passcode for your Naturalist account. Please use the one-time passcode below to verify your email:</p>
            <div style="background-color: #f4efe6; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2d4c38;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #5e6f64;">This passcode is valid for the next 15 minutes. If you did not request this, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #5e6f64; text-align: center;">Naturalist &copy; ${new Date().getFullYear()} | Premium Organic Skincare & Wellness</p>
          </div>
        `,
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
