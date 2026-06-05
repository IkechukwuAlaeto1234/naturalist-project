import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { forgotPasswordSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rate-limit";
import { signLookupToken, hashEmail } from "@/lib/lookup-token";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Rate limit: max 10 searches per 15 min per IP
    const limiter = await rateLimit("forgot-password-search", { limit: 10 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many search attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    // 2. Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const normalizedEmail = result.data.email.toLowerCase().trim();

    await connectToDatabase();

    // 3. Look up the user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with that email address." },
        { status: 404 }
      );
    }

    // 4. Build masked email  (ja*****@gmail.com)
    const [localPart, domainPart = ""] = user.email.split("@");
    const maskedLocal =
      localPart.length > 2
        ? localPart.slice(0, 2) + "*".repeat(Math.max(localPart.length - 2, 5))
        : localPart + "*****";
    const maskedEmail = `${maskedLocal}@${domainPart}`;

    // 5. Build initials
    const initials = user.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || user.name.slice(0, 2).toUpperCase();

    // 6. Sign the lookup token — real email is hashed, never in the URL
    const emailHash = await hashEmail(normalizedEmail);
    const token = await signLookupToken({
      name: user.name,
      maskedEmail,
      emailHash,
      // We slip initials into the payload via a cast; consumers treat it as
      // extra display metadata alongside the core LookupPayload fields.
      ...(initials ? { initials } : {}),
    } as any);

    return NextResponse.json({ success: true, token });
  } catch (error) {
    console.error("Forgot password search error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
