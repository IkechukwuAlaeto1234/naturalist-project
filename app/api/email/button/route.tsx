import { NextRequest } from "next/server";
import { generateButtonImage } from "@/lib/button-generator";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const text = searchParams.get("text") || "BUTTON";
    const type = searchParams.get("type") || "primary";
    const bg = searchParams.get("bg") || undefined;
    const color = searchParams.get("color") || undefined;

    // Use our native ImageResponse button generator helper
    const buffer = await generateButtonImage(text, type, bg, color);

    // Return raw PNG image with appropriate content type and long-lived client caching headers
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET email button preview error:", error);
    return new Response("Failed to generate button preview", { status: 500 });
  }
}
