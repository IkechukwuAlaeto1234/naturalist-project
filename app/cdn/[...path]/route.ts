import { NextRequest, NextResponse } from "next/server";

/**
 * GET /cdn/[...path]
 *
 * Transparent reverse-proxy for Cloudinary assets.
 *
 * Why this exists:
 *   - Cloudinary URLs are rewritten to /cdn/... throughout the app via toCdnUrl().
 *   - Keeping assets on the same origin avoids CORS issues when the browser tries
 *     to load PDFs / images into an <iframe> or <img> from a third-party domain.
 *   - PDFs loaded cross-origin into an <iframe> are blocked by most browsers with
 *     a 401 / net::ERR_BLOCKED_BY_RESPONSE because Cloudinary treats direct iframe
 *     embeds as an embed violation on unsigned, private-ish resources.
 *   - This route fetches the asset server-side and streams it back to the browser,
 *     so the browser sees it as a same-origin response — no auth, no CORS, no block.
 *
 * Security:
 *   - Only proxies paths that start with known Naturalist Cloudinary prefixes.
 *   - Does NOT proxy arbitrary external URLs.
 *   - No credentials or API secrets are exposed to the browser.
 *
 * Route: /cdn/image/upload/... → https://res.cloudinary.com/<cloud>/image/upload/...
 *        /cdn/raw/upload/...   → https://res.cloudinary.com/<cloud>/raw/upload/...
 *        /cdn/video/upload/... → https://res.cloudinary.com/<cloud>/video/upload/...
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh";
const CLOUDINARY_BASE = `https://res.cloudinary.com/${CLOUD_NAME}`;

// Only allow these Cloudinary resource type prefixes — reject anything else.
const ALLOWED_PREFIXES = ["/image/upload/", "/raw/upload/", "/video/upload/"];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;

  // Reconstruct the Cloudinary path: /image/upload/v123.../naturalist/support/xyz.pdf
  const cloudPath = "/" + path.join("/");

  // Guard: only proxy allowed Cloudinary resource types
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => cloudPath.startsWith(prefix));
  if (!isAllowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const upstreamUrl = `${CLOUDINARY_BASE}${cloudPath}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      // No auth headers — Cloudinary public assets are accessible without credentials
      headers: {
        // Pass through a sensible user-agent so Cloudinary access logs are readable
        "User-Agent": "Naturalist-CDN-Proxy/1.0",
      },
    });

    if (!upstream.ok) {
      return new NextResponse("Asset not found", { status: upstream.status });
    }

    // Stream response body back, forwarding the content-type so the browser
    // knows whether it's a PDF, image, etc.
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");
    const body = upstream.body;

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      // Allow browser to cache assets for 1 hour (they are versioned by Cloudinary v-ID)
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      // Critical: allows the PDF to be rendered in an <iframe> on the same origin
      "X-Frame-Options": "SAMEORIGIN",
      // Explicitly allow embedding from same origin only
      "Content-Security-Policy": "frame-ancestors 'self'",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new NextResponse(body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("CDN proxy error:", error);
    return new NextResponse("Proxy error", { status: 502 });
  }
}
