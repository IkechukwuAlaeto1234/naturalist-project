import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { auth } from "@/lib/auth";

// GET /api/admin/contacts
// Fetch all contact form inquiries (Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const contacts = await Contact.find({}).sort({ createdAt: -1 });

    return NextResponse.json(contacts, { status: 200 });
  } catch (error) {
    console.error("GET admin contacts error:", error);
    return NextResponse.json({ error: "Failed to retrieve contact inquiries" }, { status: 500 });
  }
}
