import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { registerSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { generateOTP, getFirstValidationError } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 5 registration attempts per 15 minutes per IP)
    const limiter = await rateLimit("register", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
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
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Generate OTP for email verification
    const otp = generateOTP(6);
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // Expires in 15 minutes

    // 6. Create User
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      plainPassword: password,
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
      await sendEmail({
        to: normalizedEmail,
        subject: "Verify your Naturalist account",
        devCode: otp,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2dacd; border-radius: 8px; background-color: #fbfbf9;">
            <h2 style="color: #2d4c38; font-family: Georgia, serif; text-align: center;">Welcome to Naturalist</h2>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p>Thank you for registering with Naturalist. To complete your account registration, please verify your email address using the one-time passcode below:</p>
            <div style="background-color: #f4efe6; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #2d4c38;">${otp}</span>
            </div>
            <p style="font-size: 14px; color: #5e6f64;">This passcode is valid for the next 15 minutes. If you did not request this registration, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2dacd; margin: 20px 0;" />
            <p style="font-size: 12px; color: #5e6f64; text-align: center;">Naturalist &copy; ${new Date().getFullYear()} | Premium Organic Skincare & Wellness</p>
          </div>
        `,
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
