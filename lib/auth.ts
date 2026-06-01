import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { connectToDatabase } from "./db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { isAdminEmail, resolveUserRole } from "./admin";

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

        // ── LOCAL SIMULATION BYPASS ──
        if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
          const email = credentials.email.toString().toLowerCase().trim();
          const password = credentials.password.toString();

          if (isAdminEmail(email)) {
            const adminPass = process.env.ADMIN_SEED_PASSWORD || "NaturalistSecureAdmin2026!";
            if (password === adminPass) {
              return {
                id: "mock-admin-id",
                email,
                name: "Naturalist Admin",
                image: null,
                role: "admin",
                isVerified: true,
              };
            }
            return null; // Invalid credentials
          }

          // Regular users can log in with any password in mock mode
          return {
            id: "mock-user-id",
            email: email,
            name: "Naturalist User",
            image: null,
            role: "user",
            isVerified: true,
          };
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

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Please contact support.");
        }

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
            if (dbUser.isModified()) {
              await dbUser.save();
            }
          }
          
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
