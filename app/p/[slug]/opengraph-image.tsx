import { ImageResponse } from "next/og";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = Buffer.from(b64, "base64");
  return binary.buffer.slice(
    binary.byteOffset,
    binary.byteOffset + binary.byteLength
  ) as ArrayBuffer;
}

async function getFonts() {
  const { FONT_REGULAR, FONT_BOLD } = await import(
    "@/lib/hostGroteskFontData"
  );
  return [
    {
      name: "HostGrotesk",
      data: base64ToArrayBuffer(FONT_REGULAR),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "HostGrotesk",
      data: base64ToArrayBuffer(FONT_BOLD),
      weight: 800 as const,
      style: "normal" as const,
    },
  ];
}

// Built-in page defaults — mirrors the keys in app/p/[slug]/page.tsx generateMetadata
const builtInDefaults: Record<string, { title: string; desc: string }> = {
  home: { title: "Naturalist", desc: "Pure Botanicals. Modern Efficacy." },
  shop: { title: "The Shop | Naturalist", desc: "Every formula, every ritual — crafted from wild-harvested botanicals." },
  bundles: { title: "Ritual Bundles | Naturalist", desc: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy." },
  story: { title: "Our Story | Naturalist", desc: "Built on the belief that pure is powerful — and that skin deserves honesty." },
  sustainability: { title: "Sustainability | Naturalist", desc: "Our pledge to the planet that grows our ingredients — and the closed loop cycle that protects it." },
  blog: { title: "Blog | Naturalist", desc: "Naturalist Journal stories, rituals, and skincare guidance from the brand team." },
  contact: { title: "Contact Us | Naturalist", desc: "Get in touch with the Naturalist team." },
  faq: { title: "Frequently Asked Questions | Naturalist", desc: "Common questions and answers." },
  "refund-policy": { title: "Refund Policy | Naturalist", desc: "Our return and refund policy." },
  "privacy-policy": { title: "Privacy Policy | Naturalist", desc: "Our privacy policy." },
  terms: { title: "Terms of Service | Naturalist", desc: "Our terms of service." },
  "cookie-policy": { title: "Cookie Policy | Naturalist", desc: "Our cookie policy." },
};

/**
 * Text-only, centered OG card for all /p/[slug] pages (terms, privacy, FAQ,
 * contact, sustainability, story, bundles, home, custom pages, etc.).
 *
 * Why text-only:
 *   Most of these pages have decorative/patterned hero sections, not
 *   shareable photography. Pulling a "heroImage" into a photo card risks
 *   showing a broken or nonsensical crop of a background pattern.
 *   Blog is the one place real link-sharing happens with article photos —
 *   that already has its own dedicated image-led OG card.
 *
 * This card replaces the dark "og-default.jpg" fallback uniformly: every
 * /p/[slug] page now gets a clean, on-brand, centered title + description
 * card whenever its link is shared.
 */
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const key = slug === "home" ? "home" : builtInDefaults[slug] ? slug : `page-${slug}`;

  let title = "Naturalist";
  let excerpt = "Premium Organic Skincare & Wellness";

  try {
    await connectToDatabase();
    const content = (await Content.findOne({ key }).lean()) as {
      title?: string;
      metadata?: Record<string, any>;
    } | null;

    const fallback = builtInDefaults[slug];

    if (content) {
      title = content.metadata?.heroHeadline || content.title || fallback?.title || title;
      excerpt = content.metadata?.heroSubtext || fallback?.desc || excerpt;
    } else if (fallback) {
      title = fallback.title;
      excerpt = fallback.desc;
    }
  } catch {
    // fall back to defaults on DB error
  }

  // Strip " | Naturalist" suffix — wordmark is already shown separately
  const displayTitle = title.replace(/\s*\|\s*Naturalist\s*$/i, "").trim() || "Naturalist";
  const clampedTitle = displayTitle.length > 90 ? displayTitle.slice(0, 87) + "…" : displayTitle;
  const displayExcerpt = excerpt.length > 180 ? excerpt.slice(0, 177) + "…" : excerpt;

  const fonts = await getFonts();

  // Larger, centered title sizing — full canvas width available, no image panel to share with
  const titleFontSize =
    clampedTitle.length > 60 ? 64 : clampedTitle.length > 40 ? 76 : 92;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0ebe0",
          fontFamily: "HostGrotesk",
          overflow: "hidden",
          padding: "0 100px",
          textAlign: "center",
        }}
      >
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: 32,
              color: "#2d4c38",
              letterSpacing: "-0.5px",
            }}
          >
            Naturalist
          </span>
          <span style={{ fontWeight: 800, fontSize: 32, color: "#b07e3a" }}>
            .
          </span>
        </div>

        {/* Page title */}
        <h1
          style={{
            fontSize: titleFontSize,
            fontWeight: 800,
            color: "#0d1810",
            lineHeight: 1.08,
            margin: 0,
            letterSpacing: "-2px",
            textAlign: "center",
          }}
        >
          {clampedTitle}
        </h1>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "#b07e3a",
            margin: "28px 0",
            borderRadius: 2,
          }}
        />

        {/* Excerpt */}
        {displayExcerpt && (
          <p
            style={{
              fontSize: 22,
              fontWeight: 400,
              color: "#4a5e50",
              lineHeight: 1.55,
              margin: 0,
              maxWidth: 760,
              textAlign: "center",
            }}
          >
            {displayExcerpt}
          </p>
        )}
      </div>
    ),
    {
      ...size,
      fonts,
      // Same immutable caching strategy as blog/[slug]/opengraph-image.tsx —
      // the URL carries a "?v=<updatedAt>" cache-busting param from generateMetadata,
      // so each rendered version is permanent and safe to cache for a year.
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
