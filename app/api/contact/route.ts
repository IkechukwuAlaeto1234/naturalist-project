import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { rateLimit } from "@/lib/rate-limit";

/**
 * POST /api/contact
 * Persists contact form inquiries to MongoDB.
 */
export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (max 5 contact submissions per 15 minutes per IP)
    const limiter = await rateLimit("contact-form", { limit: 5 });
    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many contact attempts. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse & Validate input
    const body = await req.json();
    const { name, email, topic, otherTopic, message } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address" }, { status: 400 });
    }
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }
    if (topic === "Other" && (!otherTopic || !otherTopic.trim())) {
      return NextResponse.json({ error: "Please describe your topic" }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 3. Connect to Database & Create record
    await connectToDatabase();

    const contactRecord = await Contact.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      topic,
      otherTopic: topic === "Other" ? otherTopic.trim() : undefined,
      message: message.trim(),
    });

    return NextResponse.json(
      {
        message: "Your message has been received! We'll be in touch soon.",
        contactId: contactRecord._id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST contact error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
