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

    let { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    // If it's already a Cloudinary URL or our CDN proxy, return as-is
    if (url.includes("res.cloudinary.com") || url.startsWith("/cdn/")) {
      return NextResponse.json({ url }, { status: 200 });
    }

    let targetUrl = url;

    // Attempt to detect if it's an HTML page (like Unsplash/Pexels photo page)
    // and extract the raw image URL.
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          const html = await response.text();
          
          // Regex to search for og:image or twitter:image meta tags
          const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
                               html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
                               
          const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
                                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i);

          const extractedUrl = ogImageMatch ? ogImageMatch[1] : (twitterImageMatch ? twitterImageMatch[1] : null);
          
          if (extractedUrl) {
            targetUrl = extractedUrl.replace(/&amp;/g, "&");
            console.log(`Extracted direct image URL from page: ${targetUrl}`);
          }
        }
      }
    } catch (fetchErr) {
      console.warn("Failed to pre-fetch URL for HTML check, falling back to direct upload:", fetchErr);
    }

    // Upload the external URL directly to Cloudinary as a standard upload asset
    const result = await cloudinary.uploader.upload(targetUrl, {
      folder: "naturalist/pages",
      resource_type: "image",
    });

    return NextResponse.json(
      { url: result.secure_url, publicId: result.public_id, sizeBytes: result.bytes },
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
