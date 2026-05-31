import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";

/**
 * GET /api/newsletter/unsubscribe
 * Handles quick unsubscribes via email link redirects
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

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    // Redirect to a nice public unsubscription confirmation page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(new URL("/newsletter-unsubscribed", appUrl));
  } catch (error) {
    console.error("GET newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}

/**
 * POST /api/newsletter/unsubscribe
 * Standard programmatic unsubscribe route
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

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
    await subscriber.save();

    return NextResponse.json({ message: "Successfully unsubscribed from our newsletter." }, { status: 200 });
  } catch (error) {
    console.error("POST newsletter unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }
}
