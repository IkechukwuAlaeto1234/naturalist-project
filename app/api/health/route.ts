import { NextResponse } from "next/server";

// GET /api/health
// Extremely fast, lightweight endpoint for external keep-alive pings (UptimeRobot, Cron-Job.org)
// By bypassing database connection pools, it keeps the instance awake without server load.
export async function GET() {
  return NextResponse.json(
    { 
      status: "healthy", 
      environment: process.env.NODE_ENV || "production",
      timestamp: new Date().toISOString() 
    },
    { status: 200 }
  );
}
