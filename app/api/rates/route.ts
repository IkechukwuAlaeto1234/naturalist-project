import { NextResponse } from "next/server";

/**
 * GET /api/rates
 * Server-side proxy for exchange rates (avoids browser CORS issues).
 * Frankfurter.app only supports major currencies — NGN & GHS use static fallbacks.
 * Cached for 1 hour via Next.js ISR.
 */

const FALLBACK: Record<string, number> = {
  USD: 1,
  NGN: 1620,   // Nigerian Naira — not in Frankfurter
  GBP: 0.79,
  EUR: 0.92,
  CAD: 1.37,
  GHS: 15.5,   // Ghanaian Cedi — not in Frankfurter
  ZAR: 18.6,
};

export async function GET() {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=GBP,EUR,CAD,ZAR",
      { next: { revalidate: 3600 } } // ISR: revalidate every hour
    );
    if (!res.ok) throw new Error("Upstream rate fetch failed");
    const data: { rates: Record<string, number> } = await res.json();

    return NextResponse.json({
      USD: 1,
      GBP: data.rates?.GBP ?? FALLBACK.GBP,
      EUR: data.rates?.EUR ?? FALLBACK.EUR,
      CAD: data.rates?.CAD ?? FALLBACK.CAD,
      ZAR: data.rates?.ZAR ?? FALLBACK.ZAR,
      NGN: FALLBACK.NGN,
      GHS: FALLBACK.GHS,
    }, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch {
    // Return fallback rates so UI always works
    return NextResponse.json(FALLBACK);
  }
}
