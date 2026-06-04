import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Contact } from "@/models/Contact";
import { auth } from "@/lib/auth";

// GET /api/admin/contacts/[id]
// Retrieve a single contact inquiry (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const contact = await Contact.findById(id).lean();
    if (!contact) {
      return NextResponse.json({ error: "Contact inquiry not found" }, { status: 404 });
    }

    return NextResponse.json(contact, { status: 200 });
  } catch (error) {
    console.error("GET admin contact error:", error);
    return NextResponse.json({ error: "Failed to retrieve contact inquiry" }, { status: 500 });
  }
}

// DELETE /api/admin/contacts/[id]
// Permanently delete a contact inquiry (Admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) {
      return NextResponse.json({ error: "Contact inquiry not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Inquiry deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE admin contact error:", error);
    return NextResponse.json({ error: "Failed to delete contact inquiry" }, { status: 500 });
  }
}
