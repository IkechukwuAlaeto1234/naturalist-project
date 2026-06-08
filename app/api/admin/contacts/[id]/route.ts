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
    console.log(`GET /api/admin/contacts/[id] - ID: "${id}"`);

    const session = await auth();
    console.log("GET /api/admin/contacts/[id] - session:", {
      id: session?.user?.id,
      email: session?.user?.email,
      role: (session?.user as any)?.role
    });

    if (!session || (session.user as any).role !== "admin") {
      console.log("GET /api/admin/contacts/[id] - Unauthorized (not admin)");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();
    console.log(`GET /api/admin/contacts/[id] - querying DB for ID: ${id}`);

    const contact = await Contact.findById(id).lean();
    if (!contact) {
      console.log(`GET /api/admin/contacts/[id] - Contact NOT found in DB for ID: ${id}`);
      return NextResponse.json({ error: "Contact inquiry not found" }, { status: 404 });
    }

    console.log(`GET /api/admin/contacts/[id] - Success finding contact: ${contact.email}`);
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

// PATCH /api/admin/contacts/[id]
// Update status and/or append a reply to the thread (Admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { status, reply } = body as {
      status?: "open" | "replied" | "closed";
      reply?: { sender: string; message: string };
    };

    await connectToDatabase();

    const updateOp: any = {};
    if (status) updateOp.$set = { status };
    if (reply) {
      updateOp.$push = { replies: { ...reply, sentAt: new Date() } };
      // If a reply is being appended and no explicit status override, mark as replied
      if (!status) {
        updateOp.$set = { ...(updateOp.$set ?? {}), status: "replied" };
      }
    }

    const contact = await Contact.findByIdAndUpdate(id, updateOp, { new: true });
    if (!contact) {
      return NextResponse.json({ error: "Contact inquiry not found" }, { status: 404 });
    }

    return NextResponse.json(contact, { status: 200 });
  } catch (error) {
    console.error("PATCH admin contact error:", error);
    return NextResponse.json({ error: "Failed to update contact inquiry" }, { status: 500 });
  }
}
