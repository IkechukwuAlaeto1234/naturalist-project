import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { hasAdminAccess } from "./lib/admin";

const { auth } = NextAuth(authConfig);

type ProxyUser = {
  email?: string | null;
  role?: string | null;
};

// ── Sensitive file patterns that should never be served ──────────────────────
const BLOCKED_PATTERNS = /(\.(env|git|gitignore|npmrc|nvmrc|prettierrc|eslintrc)|\/\.well-known\/|Thumbs\.db)/i;

const ADMIN_PAGE_PATHS = /^\/admin(\/|$)/;
const ADMIN_API_PATHS = /^\/api\/admin(\/|$)/;

/**
 * Next.js 16 Proxy Router (replaces deprecated middleware)
 * Handles multi-tenant subdomain routing for admin panels, Cloudinary CDN proxy,
 * and executes secure Auth.js route guards.
 */
export const proxy = auth((req) => {
  // Clean internal port :10000 from URLs to avoid redirect loop issues in production
  const cleanReqUrl = req.url.replace(/:10000($|\/)/, "$1");
  const url = req.nextUrl;
  const { pathname } = url;
  const hostname = (req.headers.get("host") || "").replace(/:10000$/, "");

  console.log("PROXY INTERCEPTED pathname:", pathname, "hostname:", hostname);

  // ── Block sensitive file access ──────────────────────────────────────────
  if (BLOCKED_PATTERNS.test(pathname)) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // ── Add request tracing ID to every response ─────────────────────────────
  const requestId = Math.random().toString(16).slice(2, 10);

  // Detect custom subdomains (supports both production and local development)
  const isAdminSubdomain = hostname.startsWith("admin.mydomain.com") || hostname.startsWith("admin.localhost");
  const isCdnSubdomain = hostname.startsWith("cdn.mydomain.com") || hostname.startsWith("cdn.localhost");

  // Helper to attach tracing ID to any response
  const withTracing = (res: NextResponse) => {
    res.headers.set("X-Request-Id", requestId);
    return res;
  };

  // 1. Handle CDN Subdomain
  // Route: cdn.mydomain.com/image.jpg -> internally maps to /cdn/image.jpg
  if (isCdnSubdomain) {
    url.pathname = `/cdn${url.pathname}`;
    return withTracing(NextResponse.rewrite(url));
  }

  // 2. Handle Admin Subdomain
  // Route: admin.mydomain.com/dashboard -> internally maps to /admin/dashboard
  if (isAdminSubdomain) {
    const isLoggedIn = !!req.auth?.user;

    // Guard: Admin subdomain requires authentication
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", cleanReqUrl);
      loginUrl.searchParams.set("callbackUrl", cleanReqUrl);
      return withTracing(NextResponse.redirect(loginUrl));
    }

    // Guard: Logged-in user must have 'admin' role
    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      // Redirect unauthorized users to the main public site
      const mainDomain = hostname.replace("admin.", "");
      return withTracing(NextResponse.redirect(new URL(`http://${mainDomain}`, cleanReqUrl)));
    }

    // Rewrite request internally to the admin directory
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
    }
    return withTracing(NextResponse.rewrite(url));
  }

  // 3. Handle Admin Paths on the main domain (e.g., localhost:3000/admin)
  if (ADMIN_PAGE_PATHS.test(pathname)) {
    const isLoggedIn = !!req.auth?.user;
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", cleanReqUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withTracing(NextResponse.redirect(loginUrl));
    }

    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      // Authenticated but not admin — send to home page
      return withTracing(NextResponse.redirect(new URL("/", cleanReqUrl)));
    }
  }

  // 4. Handle Admin API Paths (e.g., localhost:3000/api/admin/...)
  if (ADMIN_API_PATHS.test(pathname)) {
    const isLoggedIn = !!req.auth?.user;
    if (!isLoggedIn) {
      return withTracing(
        NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      );
    }

    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      return withTracing(
        NextResponse.json(
          { error: "Admin privileges required" },
          { status: 403 }
        )
      );
    }
  }

  // For regular public domains, NextAuth will use the standard authorized callbacks
  // in lib/auth.config.ts to protect routes like /account or /checkout.
  return withTracing(NextResponse.next());
});

export const config = {
  // Let proxy intercept all page routes to enable seamless subdomain mapping and admin checks
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
