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

      if (isOnAdmin) {
        // Admin pages require user to be logged in and have the 'admin' role
        if (isLoggedIn && hasAdminAccess(auth.user as AuthUser)) return true;
        
        // Extract forwarded host and protocol to avoid internal port redirect loop (e.g., localhost:10000)
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || nextUrl.host;
        const proto = request.headers.get("x-forwarded-proto") || "https";
        const redirectUrl = new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, `${proto}://${host}`);
        
        return Response.redirect(redirectUrl);
      }

      if (isOnAccount || isOnCheckout) {
        if (isLoggedIn) return true;
        return false; // Will redirect to page.signIn (/login)
      }

      return true;
    },
    async redirect({ url }) {
      // Force relative redirects so the browser resolves them relative to the active public domain
      try {
        const parsed = new URL(url);
        return `${parsed.pathname}${parsed.search}`;
      } catch {
        if (url.startsWith("/")) return url;
        return "/";
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
