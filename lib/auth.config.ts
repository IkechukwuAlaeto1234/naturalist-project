import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days matching JWT expiration
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAccount = nextUrl.pathname.startsWith("/account");
      const isOnCheckout = nextUrl.pathname.startsWith("/checkout");

      if (isOnAdmin) {
        // Admin pages require user to be logged in and have the 'admin' role
        if (isLoggedIn && (auth.user as any).role === "admin") return true;
        return Response.redirect(new URL("/login?callbackUrl=" + encodeURIComponent(nextUrl.pathname), nextUrl));
      }

      if (isOnAccount || isOnCheckout) {
        if (isLoggedIn) return true;
        return false; // Will redirect to page.signIn (/login)
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
        token.isVerified = (user as any).isVerified || false;
        token.image = (user as any).image || user.image || null;
      }
      // Support session updates (e.g., after profile updates)
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.role = session.role || token.role;
        token.image = session.image !== undefined ? session.image : token.image;
        token.isVerified = session.isVerified !== undefined ? session.isVerified : token.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).isVerified = token.isVerified as boolean;
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
