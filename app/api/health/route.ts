import { NextResponse } from "next/server";

// GET /api/health
// Extremely fast, lightweight endpoint for external keep-alive pings (UptimeRobot, Cron-Job.org)
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

// HEAD /api/health
// Explicitly support HEAD requests (UptimeRobot's default request method) to prevent 404 Not Found errors
export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      "Content-Type": "application/json",
    }
  });
}
