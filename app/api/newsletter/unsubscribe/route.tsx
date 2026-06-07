import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { render } from "@react-email/render";
import { UnsubscribeConfirmationEmail } from "@/emails/UnsubscribeConfirmationEmail";
import { sendEmail } from "@/lib/email";

/**
 * GET /api/newsletter/unsubscribe
 * Redirects the user to the rethink survey page
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    await connectToDatabase();

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    // Redirect to the public survey unsubscription confirmation page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const redirectUrl = new URL("/newsletter-unsubscribed", appUrl);
    redirectUrl.searchParams.set("email", email.toLowerCase().trim());
    
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("GET newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to process unsubscribe link" }, { status: 500 });
  }
}

/**
 * POST /api/newsletter/unsubscribe
 * Finalizes unsubscription and registers survey reasons
 */
export async function POST(req: Request) {
  try {
    const { email, reason, feedback } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectToDatabase();

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase().trim() });
    if (!subscriber) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    subscriber.unsubscribeReason = reason || "Not specified";
    subscriber.unsubscribeFeedback = feedback || "";
    subscriber.welcomeEmailSentAt = undefined;
    
    await subscriber.save();

    // Send confirmation email (fire-and-forget — don't block the response)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resubscribeUrl = `${appUrl}/api/newsletter/subscribe?email=${encodeURIComponent(email.toLowerCase().trim())}`;

    render(
      <UnsubscribeConfirmationEmail
        email={email.toLowerCase().trim()}
        resubscribeUrl={resubscribeUrl}
      />
    ).then((html) =>
      sendEmail({
        to: email.toLowerCase().trim(),
        subject: "You've been unsubscribed from Naturalist",
        html,
        text: `Hi,\n\nYou have been successfully unsubscribed from the Naturalist newsletter. We won't send you any more marketing emails.\n\nChanged your mind? Re-subscribe at: ${resubscribeUrl}\n\nNote: you may still receive transactional emails related to your orders and account security.\n\n— The Naturalist Team`,
      })
    ).catch((err) => console.error("Unsubscribe confirmation email failed:", err));

    return NextResponse.json({ message: "Successfully unsubscribed from our newsletter." }, { status: 200 });
  } catch (error) {
    console.error("POST newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
