import { headers } from "next/headers";

interface RateLimitTracker {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitTracker>();

// Clean up stale tracker entries every 5 minutes to prevent memory leaks
if (typeof global !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tracker.entries()) {
      if (now > value.resetTime) {
        tracker.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  limit?: number;      // Maximum requests in the window
  windowMs?: number;   // Window size in milliseconds
}

/**
 * Basic in-memory rate limiter for Next.js API Routes.
 * Returns true if rate limit is exceeded, false otherwise.
 */
export async function rateLimit(
  keyPrefix: string,
  options: RateLimitOptions = {}
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limit = options.limit ?? 100;
  const windowMs = options.windowMs ?? 15 * 60 * 1000; // 15 minutes default

  // Get request IP
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
  const key = `${keyPrefix}:${ip}`;

  const now = Date.now();
  const clientData = tracker.get(key);

  if (!clientData) {
    tracker.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: now + windowMs,
    };
  }

  clientData.count += 1;

  if (clientData.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: clientData.resetTime,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - clientData.count,
    reset: clientData.resetTime,
  };
}
