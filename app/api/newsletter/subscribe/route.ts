import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Newsletter } from "@/models/Newsletter";
import { newsletterSchema } from "@/lib/validations";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

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
        return NextResponse.json({ message: "You are already subscribed to our newsletter!" }, { status: 200 });
      }
      // Re-activate subscription
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

    // 4. Send Welcome Newsletter Email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "You're in. Welcome to Naturalist.",
        html: `
          <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 600px; margin: 0 auto; background: #faf8f4; border-radius: 4px; overflow: hidden; box-shadow: 0 8px 40px rgba(45,76,56,0.12);">

            <!-- HEADER -->
            <div style="background: #111a14; padding: 48px 48px 40px; text-align: center;">
              <p style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; color: #b07e3a; margin: 0 0 20px 0;">A letter from the forest</p>
              <div style="font-size: 36px; font-weight: 700; color: #faf8f4; letter-spacing: -0.02em; margin-bottom: 6px;">Naturalist.</div>
              <p style="font-size: 13px; color: rgba(250,248,244,0.45); font-style: italic; margin: 0;">Skincare rooted in nature</p>
            </div>

            <!-- HERO BAND -->
            <div style="background: #2d4c38; padding: 28px 48px; text-align: center;">
              <h1 style="font-size: 22px; color: #faf8f4; font-weight: 400; margin: 0;">You're in. <em style="color: #b07e3a;">Welcome to the fold.</em></h1>
            </div>

            <!-- BODY -->
            <div style="padding: 44px 48px;">
              <p style="font-size: 17px; color: #141f19; font-style: italic; border-left: 3px solid #b07e3a; padding-left: 16px; margin: 0 0 28px 0; line-height: 1.6;">
                "The earth has enough for everyone's need — we just have to know where to look."
              </p>

              <p style="font-size: 15px; line-height: 1.75; color: #2e3a31; margin: 0 0 20px 0;">
                That belief is at the heart of everything we make at Naturalist. Every formulation begins in the wild — with roots, leaves, and oils that have been trusted for generations — and ends in your hands, thoughtfully crafted and honestly made.
              </p>

              <p style="font-size: 15px; line-height: 1.75; color: #2e3a31; margin: 0 0 32px 0;">
                You've just joined a growing community of people who believe that what you put on your skin matters. We're glad you're here.
              </p>

              <!-- WHAT TO EXPECT -->
              <div style="background: #f4efe6; border-radius: 6px; padding: 28px 32px; margin-bottom: 32px;">
                <h3 style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #5e6f64; margin: 0 0 18px 0;">What comes next</h3>
                <p style="font-size: 14px; color: #2e3a31; line-height: 1.55; margin: 0 0 12px 0; padding-left: 18px; position: relative;"><span style="position: absolute; left: 0; color: #b07e3a;">&#8226;</span> Early access to new launches before they go public — including limited botanical editions.</p>
                <p style="font-size: 14px; color: #2e3a31; line-height: 1.55; margin: 0 0 12px 0; padding-left: 18px; position: relative;"><span style="position: absolute; left: 0; color: #b07e3a;">&#8226;</span> Ingredient spotlights, skin rituals, and honest education about what's in your products.</p>
                <p style="font-size: 14px; color: #2e3a31; line-height: 1.55; margin: 0; padding-left: 18px; position: relative;"><span style="position: absolute; left: 0; color: #b07e3a;">&#8226;</span> Subscriber-only offers and restocks — no noise, no spam.</p>
              </div>

              <!-- COUPON -->
              <div style="border: 1px solid #e2dacd; border-radius: 6px; overflow: hidden; margin-bottom: 36px;">
                <div style="background: #111a14; padding: 20px 28px; display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-family: 'Courier New', monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: rgba(250,248,244,0.5);">Your first-order gift</span>
                  <span style="font-size: 28px; font-weight: 700; color: #b07e3a; letter-spacing: -0.02em;">10% OFF</span>
                </div>
                <div style="background: #faf8f4; padding: 20px 28px; display: flex; align-items: center; justify-content: space-between; gap: 16px;">
                  <span style="font-family: 'Courier New', monospace; font-size: 20px; letter-spacing: 0.15em; color: #2d4c38; font-weight: 700; border: 1.5px dashed #b07e3a; padding: 10px 18px; border-radius: 4px; background: #fff;">NATURALGLOW10</span>
                  <span style="font-size: 12px; color: #8a7f72; font-style: italic; line-height: 1.5; max-width: 180px; text-align: right;">Valid on your first order. No minimum spend required.</span>
                </div>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin-bottom: 36px;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/shop" style="display: inline-block; background: #2d4c38; color: #faf8f4; text-decoration: none; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; padding: 16px 36px; border-radius: 2px;">Shop the Collection &rarr;</a>
              </div>

              <p style="font-size: 13px; color: #8a7f72; line-height: 1.65; margin: 0;">
                If you ever feel like this inbox isn't for you — no hard feelings. You can <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #b07e3a;">unsubscribe here</a> at any time.
              </p>
            </div>

            <!-- FOOTER -->
            <div style="background: #111a14; padding: 32px 48px; text-align: center;">
              <div style="font-size: 18px; font-weight: 700; color: rgba(250,248,244,0.6); margin-bottom: 12px;">Naturalist.</div>
              <div style="width: 40px; height: 1px; background: rgba(250,248,244,0.1); margin: 0 auto 16px;"></div>
              <p style="font-size: 11px; color: rgba(250,248,244,0.3); line-height: 1.7; font-family: 'Courier New', monospace; margin: 0;">
                Premium Organic Skincare &amp; Wellness<br/>
                &copy; ${new Date().getFullYear()} Naturalist. All rights reserved.<br/><br/>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletter/unsubscribe?email=${encodeURIComponent(normalizedEmail)}" style="color: #b07e3a;">Unsubscribe</a> &nbsp;&middot;&nbsp;
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="color: #b07e3a;">Visit our store</a>
              </p>
            </div>

          </div>
        `,
        text: "Thank you for subscribing to the Naturalist newsletter! Enjoy 10% off your first purchase using the coupon code NATURALGLOW10."
      });
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
