import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { sendWelcomeEmail } from "@/lib/newsletter";

/**
 * GET /api/newsletter/subscribe
 * Re-subscribe an email via direct link click (from unsubscribe confirmation email)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    await connectToDatabase();

    let subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (subscriber) {
      subscriber.isActive = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      await subscriber.save();
    } else {
      subscriber = await Newsletter.create({
        email: normalizedEmail,
        isActive: true,
      });
    }

    // Fire-and-forget welcome email
    sendWelcomeEmail(subscriber).catch((e) =>
      console.error("Welcome email send failure on GET resubscribe:", e)
    );

    // Redirect to the branded resubscribed page
    const redirectUrl = new URL("/newsletter-resubscribed", appUrl);
    redirectUrl.searchParams.set("email", normalizedEmail);
    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("GET newsletter subscribe error:", error);
    return NextResponse.json({ error: "An error occurred while re-subscribing. Please try again." }, { status: 500 });
  }
}

/**
 * POST /api/newsletter/subscribe
 * Subscribe an email to the Naturalist newsletter
 */
export async function POST(req: Request) {
  try {
    const limiter = await rateLimit("newsletter-subscribe", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const result = newsletterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    let subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (subscriber) {
      if (subscriber.isActive) {
        if (!subscriber.welcomeEmailSentAt) {
          sendWelcomeEmail(subscriber).catch((e) =>
            console.error("Welcome email send failure on POST:", e)
          );
        }
        return NextResponse.json({ message: "You are already subscribed to our newsletter!" }, { status: 200 });
      }
      subscriber.isActive = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      subscriber.welcomeEmailSentAt = undefined;
      await subscriber.save();
    } else {
      subscriber = await Newsletter.create({
        email: normalizedEmail,
        isActive: true,
      });
    }

    sendWelcomeEmail(subscriber).catch((e) =>
      console.error("Failed to send welcome newsletter email:", e)
    );

    return NextResponse.json(
      { message: "Thank you for subscribing to our newsletter! We've sent a welcome gift to your inbox." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
