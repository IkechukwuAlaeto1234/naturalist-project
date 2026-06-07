import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { newsletterSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { EMAIL_ASSETS } from "@/emails/assets";
import { sendWelcomeEmail } from "@/lib/newsletter";

/**
 * GET /api/newsletter/subscribe
 * Re-subscribe an email via direct link click (GET request from browser)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new Response("Email parameter is required", { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // Find if already subscribed
    let subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (subscriber) {
      subscriber.isActive = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      await subscriber.save();
    } else {
      // Create new subscription
      subscriber = await Newsletter.create({
        email: normalizedEmail,
        isActive: true,
      });
    }

    // Try sending welcome email in background
    try {
      await sendWelcomeEmail(subscriber);
    } catch (e) {
      console.error("Welcome email send failure on GET:", e);
    }

    // Return a beautiful HTML confirmation page
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Successfully Re-subscribed | Naturalist</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Host+Grotesk:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Host Grotesk', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #faf8f4;
            color: #141f19;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          header {
            padding: 24px;
            border-bottom: 1px solid #eae5db;
            text-align: center;
            background-color: #ffffff;
            width: 100%;
            box-sizing: border-box;
          }
          header img {
            max-height: 48px;
            max-width: 180px;
            display: block;
            margin: 0 auto;
          }
          main {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 24px;
            box-sizing: border-box;
          }
          .card {
            background-color: #ffffff;
            border: 1px solid #eae5db;
            border-radius: 32px;
            padding: 48px 40px;
            text-align: center;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 20px 50px rgba(20, 31, 25, 0.03);
            box-sizing: border-box;
          }
          .icon-wrapper {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 64px;
            height: 64px;
            background-color: #f4efe6;
            color: #b07e3a;
            border-radius: 50%;
            margin-bottom: 24px;
            font-size: 28px;
          }
          h1 {
            font-family: Georgia, serif;
            font-size: 28px;
            font-weight: 900;
            margin: 0 0 16px 0;
            color: #141f19;
            letter-spacing: -0.5px;
            line-height: 1.25;
          }
          p {
            font-size: 14px;
            line-height: 1.6;
            color: #5e6f64;
            margin: 0 0 32px 0;
          }
          .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background-color: #2d4c38;
            color: #faf8f4;
            text-decoration: none;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2.5px;
            height: 48px;
            padding: 0 36px;
            border-radius: 9999px;
            transition: background-color 0.2s, transform 0.2s;
            border: none;
            box-shadow: 0 4px 12px rgba(45, 76, 56, 0.08);
            box-sizing: border-box;
            cursor: pointer;
          }
          .btn:hover {
            background-color: #3a6349;
            transform: translateY(-1px);
          }
          footer {
            text-align: center;
            padding: 24px;
            width: 100%;
            box-sizing: border-box;
          }
          footer p {
            margin: 0 0 8px 0;
            font-size: 11px;
            color: #8a7f72;
          }
          footer a {
            color: #2d4c38;
            text-decoration: underline;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <header>
          <a href="/">
            <img src="${EMAIL_ASSETS.logoTransparent}" alt="Naturalist Logo" />
          </a>
        </header>
        <main>
          <div class="card">
            <div class="icon-wrapper">✓</div>
            <h1>You're back in!</h1>
            <p>We've successfully updated your subscription. You will receive organic skincare guides, ingredient spotlights, and exclusive member offers again at <strong>${normalizedEmail}</strong>.</p>
            <a href="/" class="btn">Return to Store</a>
          </div>
          <footer>
            <p>&copy; ${new Date().getFullYear()} Naturalist. All rights reserved.</p>
            <p>
              <a href="/">Visit our store</a> &nbsp;&middot;&nbsp; 
              <a href="/privacy-policy">Privacy Policy</a>
            </p>
          </footer>
        </main>
      </body>
      </html>
    `;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("GET newsletter subscribe error:", error);
    return new Response("An error occurred while re-subscribing. Please try again.", { status: 500 });
  }
}

/**
 * POST /api/newsletter/subscribe
 * Subscribe an email to the Naturalist newsletter
 */
export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 5 newsletter subscriptions per 15 minutes)
    const limiter = await rateLimit("newsletter-subscribe", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const result = newsletterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    await connectToDatabase();

    // 3. Find if already subscribed
    let subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (subscriber) {
      if (subscriber.isActive) {
        // If welcome email hasn't been sent yet, send it
        if (!subscriber.welcomeEmailSentAt) {
          try {
            await sendWelcomeEmail(subscriber);
          } catch (e) {
            console.error("Welcome email send failure on POST:", e);
          }
        }
        return NextResponse.json({ message: "You are already subscribed to our newsletter!" }, { status: 200 });
      }
      // Re-reactivate subscription
      subscriber.isActive = true;
      subscriber.subscribedAt = new Date();
      subscriber.unsubscribedAt = undefined;
      subscriber.welcomeEmailSentAt = undefined; // Reset to allow welcome email on reactivation
      await subscriber.save();
    } else {
      // Create new subscription
      subscriber = await Newsletter.create({
        email: normalizedEmail,
        isActive: true,
      });
    }

    // 4. Send Welcome Newsletter Email
    try {
      await sendWelcomeEmail(subscriber);
    } catch (emailError) {
      console.error("Failed to send welcome newsletter email:", emailError);
    }

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
