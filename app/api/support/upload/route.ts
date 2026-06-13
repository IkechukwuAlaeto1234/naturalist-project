import { NextResponse } from "next/server";
import { generateUploadSignature } from "@/lib/cloudinary";

/**
 * POST /api/support/upload
 * Generates a signed Cloudinary upload signature for guest support chat sessions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Valid Session ID is required" }, { status: 400 });
    }

    // Generate signed token specifically for the support subfolder
    const signatureData = generateUploadSignature("naturalist/support");
    
    return NextResponse.json(signatureData, { status: 200 });
  } catch (error: any) {
    console.error("Support Cloudinary signature generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}
