import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { connectToDatabase } from "./db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";

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

        if (user.isSuspended) {
          throw new Error("Your account has been suspended. Please contact support.");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image || null,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          await connectToDatabase();
          let dbUser = await User.findOne({ email: user.email?.toLowerCase() });
          
          if (!dbUser) {
            dbUser = await User.create({
              name: user.name || "Naturalist User",
              email: user.email?.toLowerCase(),
              image: user.image,
              role: "user",
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
              dbUser.image = user.image;
              await dbUser.save();
            }
          }
          
          user.id = dbUser._id.toString();
          (user as any).role = dbUser.role;
          (user as any).isVerified = dbUser.isVerified;
        } catch (error) {
          console.error("Error in signIn callback for Google:", error);
          return false; // prevent sign-in on DB failure
        }
      }
      return true;
    },
  },
});
