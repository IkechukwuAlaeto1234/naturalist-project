import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CdnImage } from "@/models/CdnImage";
import { auth } from "@/lib/auth";

// DELETE /api/admin/cdn/[id]
// Remove an image log from the database
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

    const image = await CdnImage.findByIdAndDelete(id);
    if (!image) {
      return NextResponse.json({ error: "Image record not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Image record deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE admin cdn error:", error);
    return NextResponse.json({ error: "Failed to delete image record" }, { status: 500 });
  }
}
