import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { rateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/utils";
import { verifyLookupToken, hashEmail } from "@/lib/lookup-token";
import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import React from "react";

export async function POST(req: Request) {
  try {
    const body = await req.json();



    // 1. Rate limit: max 3 passcode sends per 15 min
    const limiter = await rateLimit("forgot-password", { limit: 3 });
    if (!limiter.success) {
      return NextResponse.json(
        {
          error:
            "Too many password reset attempts. Please wait 15 minutes.",
        },
        { status: 429 }
      );
    }

    // 2. Require and verify the signed lookup token
    const { ref } = body;
    if (!ref || typeof ref !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid lookup token." },
        { status: 400 }
      );
    }

    const payload = await verifyLookupToken(ref);
    if (!payload) {
      return NextResponse.json(
        {
          error:
            "This recovery link has expired or is invalid. Please start over.",
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    // 3. Find user by emailHash — scan is acceptable; index on email hash is
    //    optional but recommended for large user bases.
    //    We hash every stored email on-the-fly for comparison.
    //    More efficient: store emailHash on the User model. For now: findOne
    //    via hashed lookup against all users with a lean query.
    //
    //    Practical approach: re-derive emailHash from the *real* email field
    //    by fetching all candidates whose first-two chars match the masked hint,
    //    then confirming hash. But simplest: store emailHash on User (migration
    //    not in scope here), so we do a full collection scan with lean().
    //
    //    ── For a small/medium store this is fine. ──
    const users = await User.find({}, "email name resetToken resetTokenExpires").lean();
    let matchedUser: (typeof users)[0] | null = null;

    for (const u of users) {
      const h = await hashEmail(u.email as string);
      if (h === payload.emailHash) {
        matchedUser = u;
        break;
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: "No account found for this recovery token." },
        { status: 404 }
      );
    }

    // 4. Generate 6-char OTP and save to user record
    const resetToken = generateOTP(6);
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await User.updateOne(
      { _id: matchedUser._id },
      { resetToken, resetTokenExpires }
    );

    // 5. Send the email
    try {
      const html = await render(
        React.createElement(PasswordResetEmail, {
          token: resetToken,
          name: matchedUser.name as string,
        })
      );
      await sendEmail({
        to: matchedUser.email as string,
        subject: "Reset your Naturalist password",
        devCode: resetToken,
        html,
        text: `You requested a password reset. Your passcode is ${resetToken}. This code is valid for 15 minutes.`,
      });
    } catch (emailError) {
      console.error("Failed to send password reset email:", emailError);
      return NextResponse.json(
        { error: "Failed to dispatch email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message:
          "If an account matches that email, a password reset passcode has been sent.",
        // Return the masked email so the client can confirm to the user where
        // the code was sent — no real address exposed.
        maskedEmail: payload.maskedEmail,
      },
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
