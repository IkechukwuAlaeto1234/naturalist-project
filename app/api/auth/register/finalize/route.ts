import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendEmail } from "@/lib/email";
import React from "react";

export async function POST(req: Request) {
  try {
    const { email, phone, country } = await req.json();

    if (!email || !phone || !country) {
      return NextResponse.json({ error: "Email, phone, and country are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    // Save shippingAddress fields (country and phone) on the User document
    user.shippingAddress = {
      name: user.name,
      street: "",
      city: "",
      state: "",
      zip: "",
      country: country.trim(),
      phone: phone.trim(),
    };
    
    await user.save();

    // Log the user registration complete
    await AccountLog.create({
      email: normalizedEmail,
      name: user.name,
      action: "signup",
      details: "User completed the multi-step registration wizard details.",
    });

    // Send Welcome Email now that the account is officially finalized
    try {
      const html = await render(React.createElement(WelcomeEmail, { name: user.name }));
      await sendEmail({
        to: normalizedEmail,
        subject: "Welcome to Naturalist",
        html,
        text: `Welcome to Naturalist, ${user.name}! Your account is now active.`
      });
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return NextResponse.json({ success: true, message: "Registration details saved successfully" });
  } catch (error) {
    console.error("Finalize registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
