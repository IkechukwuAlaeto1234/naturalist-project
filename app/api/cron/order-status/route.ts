import { NextRequest, NextResponse } from "next/server";
import { autoAdvanceShippedOrders } from "@/lib/order-automation";

/**
 * GET /api/cron/order-status
 *
 * Called by Vercel Cron (every 30 minutes) or Render's cron service.
 * Protected by CRON_SECRET — set this in your env variables.
 *
 * Vercel cron config (vercel.json):
 * {
 *   "crons": [{ "path": "/api/cron/order-status", "schedule": "*/30 * * * *" }]
 * }
 *
 * Render: add a Cron Job service pointing to this URL every 30 minutes.
 */
export async function GET(req: NextRequest) {
  try {
    // ── Verify cron secret ──────────────────────────────────────
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Run automation ──────────────────────────────────────────
    const result = await autoAdvanceShippedOrders();

    console.log(`[CRON] order-status: advanced=${result.advanced} errors=${result.errors}`);

    return NextResponse.json({
      ok:       true,
      advanced: result.advanced,
      errors:   result.errors,
      ran_at:   new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CRON] order-status fatal error:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
