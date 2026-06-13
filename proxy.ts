import { NextResponse, NextRequest } from "next/server";
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
 * Build a clean base URL from forwarded headers, stripping internal ports like :10000.
 * In production on Render, the app runs on an internal port (e.g. 10000) but is
 * exposed externally on 443 via a reverse proxy. We must use the forwarded host/proto
 * for any redirect URLs, otherwise signOut, callbackUrl, etc. include the internal port.
 */
function getPublicBaseUrl(req: NextRequest): string {
  const forwardedProto = req.headers.get("x-forwarded-proto") || "https";
  const proto = forwardedProto.split(",")[0].trim(); // may be comma-list
  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = forwardedHost.split(",")[0].trim().replace(/:10000$/, "");
  return `${proto}://${host}`;
}

/**
 * Next.js 16 Proxy Router (replaces deprecated middleware)
 * Handles multi-tenant subdomain routing for admin panels, Cloudinary CDN proxy,
 * and executes secure Auth.js route guards.
 */
export const proxy = auth((req) => {
  const url = req.nextUrl;
  const { pathname } = url;
  const rawHost = req.headers.get("host") || "";
  const hostname = rawHost.replace(/:10000$/, "");
  // Clean public base URL — used for all redirects so internal port never leaks out
  const publicBase = getPublicBaseUrl(req as any);
  const cleanReqUrl = `${publicBase}${pathname}${url.search}`;

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
      const loginUrl = new URL("/login", publicBase);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withTracing(NextResponse.redirect(loginUrl));
    }

    // Guard: Logged-in user must have 'admin' role
    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      // Redirect unauthorized users to the main public site
      return withTracing(NextResponse.redirect(new URL("/", publicBase)));
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
      const loginUrl = new URL("/login", publicBase);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return withTracing(NextResponse.redirect(loginUrl));
    }

    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      // Authenticated but not admin — send to home page
      return withTracing(NextResponse.redirect(new URL("/", publicBase)));
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
  // Surgical matcher — only intercept routes where the proxy or NextAuth
  // actually needs to do real work (auth guards, subdomain rewrites, API auth).
  //
  // Everything NOT listed here (blog, shop, story, faq, contact, bundles,
  // p/[slug], privacy-policy, terms, sustainability, sitemap, newsletter-*,
  // search, etc.) is left completely alone so Next.js compiles and serves
  // those pages without a blocking middleware round-trip.
  matcher: [
    // ── Admin (page + API) — must be guarded ───────────────────────────────
    "/admin/:path*",
    "/api/admin/:path*",

    // ── Protected user pages — NextAuth authorized() callback gates these ──
    "/account/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/order-confirmation/:path*",
    "/cart",
    "/user/:path*",

    // ── Auth flows — needed so already-logged-in users get redirected away ─
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password/:path*",
    "/verify-email",

    // ── CDN subdomain rewrite ──────────────────────────────────────────────
    "/cdn/:path*",

    // ── All API routes except static Next.js internals and public guest APIs ─
    // Auth APIs, geo, products, etc. need headers/tracing but NOT full page
    // session checks — NextAuth handles session via the route handlers directly.
    // /api/support/* is explicitly excluded: those routes serve unauthenticated
    // guest users (support chat widget) and must not be gated by the middleware.
    "/api/((?!_next|support).*)",
  ],
};
