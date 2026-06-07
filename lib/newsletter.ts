import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { render } from "@react-email/render";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { sendEmail } from "@/lib/email";
import React from "react";

/**
  * Central utility to send a welcome email to a subscriber.
  * Ensures the email is only sent once per subscription cycle,
  * personalizes the greeting if a User profile is found,
  * saves the sent timestamp, and logs the event in the database.
  */
export async function sendWelcomeEmail(
  subscriber: any,
  isManualAdmin: boolean = false,
  adminEmail?: string
) {
  if (subscriber.welcomeEmailSentAt) {
    return; // Already sent in this cycle
  }

  await connectToDatabase();

  let displayName = "Friend";
  const user = await User.findOne({ email: subscriber.email.toLowerCase().trim() });
  if (user && user.name) {
    displayName = user.name;
  }

  // Render our brand-aligned React component to HTML
  const html = await render(React.createElement(WelcomeEmail, { name: displayName }));

  await sendEmail({
    to: subscriber.email,
    subject: "Welcome to Naturalist - Special Gift Inside!",
    html,
    text: "Welcome to Naturalist! Use coupon NATURALGLOW10 for 10% off your first purchase.",
  });

  subscriber.welcomeEmailSentAt = new Date();
  await subscriber.save();

  // Create audit log
  await AccountLog.create({
    email: subscriber.email,
    name: displayName === "Friend" ? "Newsletter Subscriber" : displayName,
    action: isManualAdmin ? "newsletter_welcome_manual" : "newsletter_welcome",
    details: isManualAdmin
      ? `Welcome email manually sent by admin ${adminEmail || "System"} to subscriber ${subscriber.email}.`
      : `Welcome email automatically sent to subscriber ${subscriber.email}.`,
  });
}
