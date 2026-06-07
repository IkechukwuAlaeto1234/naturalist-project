import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { FONT_REGULAR, FONT_BOLD } from "@/lib/hostGroteskFontData";

export const runtime = "edge";

/**
 * Internal image-generation Edge endpoint.
 * Called by button-generator.tsx (Node.js) via fetch() to produce PNG buffers
 * using ImageResponse/Satori, which requires the Edge runtime.
 *
 * GET /api/dev/img-gen?type=button&text=Shop+Collection&variant=primary
 * GET /api/dev/img-gen?type=voucher&subtitle=...&title=...&code=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "button";

  const fontRegular = Buffer.from(FONT_REGULAR, "base64");
  const fontBold    = Buffer.from(FONT_BOLD,    "base64");

  const fonts = [
    { name: "Host Grotesk", data: fontRegular, weight: 400 as const, style: "normal" as const },
    { name: "Host Grotesk", data: fontBold,    weight: 700 as const, style: "normal" as const },
  ];

  // ── Voucher card ────────────────────────────────────────────────────────────
  if (type === "voucher") {
    const subtitle = searchParams.get("subtitle") ?? "Your First Subscriber Gift";
    const title    = searchParams.get("title")    ?? "Get 10% Off Your First Purchase";
    const code     = searchParams.get("code")     ?? "WELCOME10";

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#faf9f5",
            width: "100%",
            height: "100%",
            padding: "36px",
            boxSizing: "border-box",
            borderRadius: "32px",
          }}
        >
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#2d4c38", letterSpacing: "4px", textTransform: "uppercase", fontFamily: "Host Grotesk", marginBottom: "12px" }}>
            {subtitle.toUpperCase()}
          </div>
          <div style={{ fontSize: "38px", fontWeight: 700, color: "#b07e3a", fontFamily: "Host Grotesk", marginBottom: "24px", textAlign: "center" }}>
            {title}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff", borderRadius: "16px", padding: "16px 48px", fontSize: "32px", letterSpacing: "6px", color: "#2d4c38", fontWeight: 700, fontFamily: "Host Grotesk" }}>
            {code.toUpperCase()}
          </div>
        </div>
      ),
      { width: 1040, height: 360, fonts }
    );
  }

  // ── Unsubscribe Header ──────────────────────────────────────────────────────
  if (type === "header") {
    const subtitle = searchParams.get("subtitle") ?? "Subscription Update";
    const title    = searchParams.get("title")    ?? "You've Been Unsubscribed";

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "transparent",
            width: "100%",
            height: "100%",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "#b07e3a",
              letterSpacing: "6px",
              textTransform: "uppercase",
              fontFamily: "Host Grotesk",
              marginBottom: "8px",
              textAlign: "center",
            }}
          >
            {subtitle.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "42px",
              fontWeight: 700,
              color: "#141f19",
              fontFamily: "Host Grotesk",
              textAlign: "center",
              lineHeight: 1.1,
            }}
          >
            {title}
          </div>
        </div>
      ),
      { width: 600, height: 120, fonts }
    );
  }

  // ── Button ──────────────────────────────────────────────────────────────────
  const text    = searchParams.get("text")    ?? "Button";
  const variant = searchParams.get("variant") ?? "primary";
  const customBg = searchParams.get("bg");
  const customColor = searchParams.get("color");

  let bgColor   = customBg ?? "#2d4c38";
  let textColor = customColor ?? "#faf9f5";

  if (!customBg) {
    if (variant === "secondary") { bgColor = "#f4efe6"; textColor = "#2d4c38"; }
    if (variant === "gold")      { bgColor = "#b07e3a"; textColor = "#faf9f5"; }
  }
  if (customColor) {
    textColor = customColor;
  }

  const uppercaseText = text.toUpperCase();
  const btnWidth  = Math.max(160, Math.ceil(uppercaseText.length * 9.5 + (uppercaseText.length - 1) * 3 + 72));
  const btnHeight = 52;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", backgroundColor: "transparent" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: bgColor,
            color: textColor,
            borderRadius: `${btnHeight}px`,
            width: `${btnWidth * 2}px`,
            height: `${btnHeight * 2}px`,
            fontSize: "28px",
            letterSpacing: "6px",
            fontFamily: "Host Grotesk",
            textTransform: "uppercase",
            fontWeight: 700,
            textAlign: "center",
          }}
        >
          {uppercaseText}
        </div>
      </div>
    ),
    { width: btnWidth * 2, height: btnHeight * 2, fonts }
  );
}
