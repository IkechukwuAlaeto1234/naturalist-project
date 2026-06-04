import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

/**
 * POST /api/admin/content/upload-url
 * 
 * Takes an external image URL and uploads it to our Cloudinary CDN.
 * This solves the issue where images pasted from external websites
 * show in the admin panel (which uses <img>) but fail to load on
 * public pages (which use Next.js <Image> with hostname restrictions).
 * 
 * By re-hosting on Cloudinary, all images are served from our own CDN.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // If it's already a Cloudinary URL or our CDN proxy, return as-is
    if (url.includes("res.cloudinary.com") || url.startsWith("/cdn/")) {
      return NextResponse.json({ url }, { status: 200 });
    }

    // Upload the external URL directly to Cloudinary as a standard upload asset
    const result = await cloudinary.uploader.upload(url, {
      folder: "naturalist/pages",
      resource_type: "image",
    });

    return NextResponse.json(
      { url: result.secure_url, publicId: result.public_id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("URL upload to Cloudinary error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image from URL" },
      { status: 500 }
    );
  }
}
