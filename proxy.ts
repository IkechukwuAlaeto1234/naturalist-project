import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";
import { hasAdminAccess } from "./lib/admin";

const { auth } = NextAuth(authConfig);

type ProxyUser = {
  email?: string | null;
  role?: string | null;
};

/**
 * Next.js 16 Proxy Router (replaces deprecated middleware)
 * Handles multi-tenant subdomain routing for admin panels, Cloudinary CDN proxy,
 * and executes secure Auth.js route guards.
 */
export const proxy = auth((req) => {
  const url = req.nextUrl;
  const hostname = req.headers.get("host") || "";

  // Detect custom subdomains (supports both production and local development)
  const isAdminSubdomain = hostname.startsWith("admin.mydomain.com") || hostname.startsWith("admin.localhost");
  const isCdnSubdomain = hostname.startsWith("cdn.mydomain.com") || hostname.startsWith("cdn.localhost");

  // 1. Handle CDN Subdomain
  // Route: cdn.mydomain.com/image.jpg -> internally maps to /cdn/image.jpg
  // next.config.ts will then rewrite /cdn/image.jpg -> Cloudinary URL dtpwhaxvh
  if (isCdnSubdomain) {
    url.pathname = `/cdn${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 2. Handle Admin Subdomain
  // Route: admin.mydomain.com/dashboard -> internally maps to /admin/dashboard
  if (isAdminSubdomain) {
    const isLoggedIn = !!req.auth?.user;

    // Guard: Admin subdomain requires authentication
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Guard: Logged-in user must have 'admin' role
    if (!hasAdminAccess(req.auth?.user as ProxyUser)) {
      // Redirect unauthorized users to the main public site
      const mainDomain = hostname.replace("admin.", "");
      return NextResponse.redirect(new URL(`http://${mainDomain}`, req.url));
    }

    // Rewrite request internally to the admin directory
    if (!url.pathname.startsWith("/admin")) {
      url.pathname = `/admin${url.pathname}`;
    }
    return NextResponse.rewrite(url);
  }

  // For regular public domains, NextAuth will use the standard authorized callbacks
  // in lib/auth.config.ts to protect routes like /account or /checkout.
  return NextResponse.next();
});

export const config = {
  // Let proxy intercept all page routes to enable seamless subdomain mapping
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
