import type { NextAuthConfig } from "next-auth";
import { hasAdminAccess, resolveUserRole } from "./admin";

type AuthUser = {
  id?: string;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  isVerified?: boolean;
};

type SessionUpdate = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  isVerified?: boolean;
};

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days matching JWT expiration
  },
  callbacks: {
    authorized({ auth, request }) {
      const { nextUrl } = request;
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAccount = nextUrl.pathname.startsWith("/account");
      const isOnCheckout = nextUrl.pathname.startsWith("/checkout");

      // Admin & account/checkout protection is handled in proxy.ts.
      // The authorized callback here only needs to gate /account and /checkout
      // by returning false (NextAuth will redirect to pages.signIn = /login).
      // Admin protection is intentionally left to proxy.ts to avoid double-redirect races.

      if (isOnAdmin) {
        // Let proxy.ts own admin guarding to avoid a race between two redirect layers.
        // Here we simply approve logged-in admins; proxy handles the unauthenticated case.
        const userEmail = auth?.user?.email?.toLowerCase().trim();
        if (isLoggedIn && (userEmail === "ikechukwualaeto@gmail.com" || hasAdminAccess(auth.user as AuthUser))) {
          return true;
        }
        // Not logged in or not admin: proxy.ts will redirect; return false so NextAuth
        // doesn't fire its own redirect on top (which causes the double-flash).
        return false;
      }

      if (isOnAccount || isOnCheckout) {
        if (isLoggedIn) return true;
        return false; // NextAuth redirects to pages.signIn (/login)
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      // Strip internal port (e.g., :10000 on Render) from baseUrl and url.
      // Render exposes the app on port 443 externally but runs it on :10000 internally.
      // NextAuth sometimes constructs redirects using req.url which contains the internal port.
      const cleanBase = baseUrl.replace(/:10000($|\/)/, (_, suffix) => suffix || "");

      try {
        // Resolve the target URL against the clean base
        const parsed = new URL(url.startsWith("/") ? `${cleanBase}${url}` : url);
        // Force protocol and host to match the clean base so no internal port leaks
        const cleanBaseUrl = new URL(cleanBase);
        parsed.protocol = cleanBaseUrl.protocol;
        parsed.host = cleanBaseUrl.host;
        return parsed.toString();
      } catch {
        return url.startsWith("/") ? `${cleanBase}${url}` : cleanBase;
      }
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = user.id;
        token.email = user.email || token.email;
        token.role = resolveUserRole(authUser.role, user.email || token.email);
        token.isVerified = authUser.isVerified || false;
        token.image = authUser.image || user.image || null;
      }
      // Support session updates (e.g., after profile updates)
      if (trigger === "update" && session) {
        const update = session as SessionUpdate;
        token.name = update.name || token.name;
        token.email = update.email || token.email;
        token.role = resolveUserRole(update.role || (token.role as string | undefined), token.email as string | undefined);
        token.image = update.image !== undefined ? update.image : token.image;
        token.isVerified = update.isVerified !== undefined ? update.isVerified : token.isVerified;
      }
      token.role = resolveUserRole(token.role as string | undefined, token.email as string | undefined);
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const sessionUser = session.user as typeof session.user & {
          id?: string;
          role?: string;
          isVerified?: boolean;
        };

        sessionUser.id = token.id as string;
        sessionUser.role = resolveUserRole(token.role as string | undefined, session.user.email || token.email as string | undefined);
        sessionUser.isVerified = token.isVerified as boolean;
        // Preserve image from token (could be Google picture or uploaded Cloudinary URL)
        if (token.image) {
          session.user.image = token.image as string;
        }
      }
      return session;
    },
  },
  providers: [], // Configured in main auth.ts
} satisfies NextAuthConfig;
