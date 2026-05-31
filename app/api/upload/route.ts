import { NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";
import { auth } from "@/lib/auth";

/**
 * POST /api/upload
 * Generates a signed Cloudinary upload signature.
 * Direct, secure client-side uploads directly to Cloudinary without exposing secret keys!
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse folder name if supplied, default to "naturalist"
    let folder = "naturalist";
    try {
      const body = await req.json();
      if (body.folder && typeof body.folder === "string") {
        folder = body.folder.trim();
      }
    } catch {
      // Allow empty bodies
    }

    // 3. Generate signed token
    const signatureData = generateUploadSignature(folder);
    
    return NextResponse.json(signatureData, { status: 200 });
  } catch (error: any) {
    console.error("Cloudinary signature generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
