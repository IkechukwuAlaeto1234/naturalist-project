import { ImageResponse } from "next/og";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://naturalist-project.onrender.com";

function resolveAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
}

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

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let title = "Naturalist Blog";
  let excerpt = "Premium organic skincare insights, guides and rituals.";
  let coverImageUrl: string | null = null;

  try {
    await connectToDatabase();
    const post = (await Blog.findOne({ slug }).lean()) as {
      title?: string;
      excerpt?: string;
      coverImage?: string;
    } | null;

    if (post) {
      title = post.title || title;
      excerpt = post.excerpt || excerpt;
      if (post.coverImage) {
        coverImageUrl = resolveAbsoluteUrl(post.coverImage);
      }
    }
  } catch {
    // fall back to defaults on DB error
  }

  const fonts = await getFonts();

  // Clamp text to prevent layout overflow
  const displayTitle = title.length > 130 ? title.slice(0, 127) + "…" : title;
  const displayExcerpt =
    excerpt.length > 240 ? excerpt.slice(0, 237) + "…" : excerpt;

  const hasCover = !!coverImageUrl;

  // Scale font size based on title length + whether cover takes up half the canvas
  // Go big — Vercel-style dominance
  const titleFontSize = hasCover
    ? displayTitle.length > 55
      ? 40
      : displayTitle.length > 40
        ? 48
        : 56
    : displayTitle.length > 60
      ? 62
      : displayTitle.length > 40
        ? 74
        : 86;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          background: "#f0ebe0",
          fontFamily: "HostGrotesk",
          overflow: "hidden",
        }}
      >
        {/* ── Left text panel ── */}
        <div
          style={{
            width: hasCover ? 568 : 1200,
            height: 630,
            display: "flex",
            flexDirection: "column",
            padding: "72px 52px 60px 60px",
          }}
        >
          {/* Wordmark — padded down from edge */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: 28,
                color: "#2d4c38",
                letterSpacing: "-0.5px",
              }}
            >
              Naturalist
            </span>
            <span
              style={{ fontWeight: 800, fontSize: 28, color: "#b07e3a" }}
            >
              .
            </span>
          </div>

          {/* Centre content block — fills remaining space, centres itself */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Post title */}
            <h1
              style={{
                fontSize: titleFontSize,
                fontWeight: 800,
                color: "#0d1810",
                lineHeight: 1.08,
                margin: 0,
                letterSpacing: "-1.5px",
              }}
            >
              {displayTitle}
            </h1>

            {/* Excerpt */}
            {displayExcerpt && (
              <p
                style={{
                  fontSize: 17,
                  fontWeight: 400,
                  color: "#4a5e50",
                  lineHeight: 1.55,
                  margin: 0,
                  maxWidth: hasCover ? 420 : 740,
                }}
              >
                {displayExcerpt}
              </p>
            )}
          </div>


        </div>

        {/* ── Right panel: framed cover image ── */}
        {hasCover && (
          <div
            style={{
              width: 632,
              height: 630,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingTop: 22,
              paddingBottom: 22,
              paddingRight: 28,
              paddingLeft: 4,
            }}
          >
            {/* Frame */}
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "100%",
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 3,
                borderStyle: "solid",
                borderColor: "rgba(45,76,56,0.15)",
                background: "#ddd5c8",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImageUrl!}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </div>
          </div>
        )}
      </div>
    ),
    {
      ...size,
      fonts,
    }
  );
}
