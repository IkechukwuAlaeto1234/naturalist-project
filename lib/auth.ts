import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { connectToDatabase } from "./db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { isAdminEmail, resolveUserRole } from "./admin";
import { parseUserAgent } from "./utils";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  handlers,
} = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        await connectToDatabase();

        const user = await User.findOne({ email: credentials.email.toString().toLowerCase() });
        
        if (!user || !user.password) {
          return null;
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password.toString(),
          user.password
        );

        if (!isPasswordCorrect) {
          return null;
        }

        // Block unverified accounts from signing in
        if (!user.isVerified) {
          throw new Error("EMAIL_NOT_VERIFIED");
        }

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        // Generate real-time session
        const { headers } = await import("next/headers");
        const headersList = await headers();
        const ua = headersList.get("user-agent") || "";
        const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
        const { browser, os, deviceType } = parseUserAgent(ua);

        const newSession = {
          id: crypto.randomUUID(),
          ipAddress: ip,
          userAgent: ua,
          browser,
          os,
          deviceType,
          lastActive: new Date(),
        };

        user.sessions = user.sessions || [];
        user.sessions.push(newSession as any);
        await user.save();

        // Log in AccountLog
        await AccountLog.create({
          email: user.email,
          name: user.name,
          action: "login",
          details: `User signed in successfully from ${browser} on ${os} (${ip}).`,
          ipAddress: ip,
          userAgent: ua,
          browser,
          os,
          deviceType,
        });

        if (isAdminEmail(user.email) && user.role !== "admin") {
          user.role = "admin";
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: resolveUserRole(user.role, user.email),
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() });
          
          if (!dbUser) {
            const role = resolveUserRole("user", user.email);
            dbUser = await User.create({
              name: user.name || "Naturalist User",
              email: user.email?.toLowerCase(),
              image: user.image || undefined,
              role,
              isVerified: true, // Google email is verified
            });
            console.log(`Created new Google user: ${dbUser.email} (${dbUser._id})`);
            
            // Log google registration
            await AccountLog.create({
              email: dbUser.email,
              name: dbUser.name,
              action: "signup",
              details: "User registered through Google OAuth sign-in.",
            });
          } else {
            // Update user image if not present
            if (!dbUser.image && user.image) {
              dbUser.image = user.image || undefined;
            }
            if (isAdminEmail(dbUser.email) && dbUser.role !== "admin") {
              dbUser.role = "admin";
            }
          }

          // Generate real-time session
          const { headers } = await import("next/headers");
          const headersList = await headers();
          const ua = headersList.get("user-agent") || "";
          const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() || headersList.get("x-real-ip") || "127.0.0.1";
          const { browser, os, deviceType } = parseUserAgent(ua);

          const newSession = {
            id: crypto.randomUUID(),
            ipAddress: ip,
            userAgent: ua,
            browser,
            os,
            deviceType,
            lastActive: new Date(),
          };

          dbUser.sessions = dbUser.sessions || [];
          dbUser.sessions.push(newSession as any);
          await dbUser.save();

          // Log in AccountLog
          await AccountLog.create({
            email: dbUser.email,
            name: dbUser.name,
            action: "login",
            details: `User signed in successfully via Google OAuth from ${browser} on ${os} (${ip}).`,
            ipAddress: ip,
            userAgent: ua,
            browser,
            os,
            deviceType,
          });
          
          const signedInUser = user as typeof user & {
            role?: string;
            isVerified?: boolean;
          };

          signedInUser.id = dbUser._id.toString();
          signedInUser.role = resolveUserRole(dbUser.role, dbUser.email);
          signedInUser.isVerified = dbUser.isVerified;
        } catch (error) {
          console.error("Error in signIn callback for Google:", error);
          return false; // prevent sign-in on DB failure
        }
      }
      return true;
    },
  },
});
