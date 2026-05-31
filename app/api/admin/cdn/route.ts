import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { CdnImage } from "@/models/CdnImage";
import { auth } from "@/lib/auth";

// GET /api/admin/cdn
// Fetch all uploaded CDN images
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const images = await CdnImage.find({}).sort({ createdAt: -1 });
    return NextResponse.json(images, { status: 200 });
  } catch (error) {
    console.error("GET admin cdn error:", error);
    return NextResponse.json({ error: "Failed to retrieve images" }, { status: 500 });
  }
}

// POST /api/admin/cdn
// Log a newly uploaded image URL
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { url, publicId, originalName, sizeBytes } = await req.json();

    if (!url || !publicId || !originalName) {
      return NextResponse.json({ error: "url, publicId, and originalName are required" }, { status: 400 });
    }

    await connectToDatabase();

    const image = await CdnImage.create({
      url,
      publicId,
      originalName,
      sizeBytes: sizeBytes || 0,
      uploadedBy: session.user.id,
    });

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error("POST admin cdn error:", error);
    return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
  }
}
