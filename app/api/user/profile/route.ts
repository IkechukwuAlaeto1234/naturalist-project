import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

/**
 * GET /api/user/profile
 * Retrieve profile details of logged-in user
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select("-password -otp -otpExpires -resetToken -resetTokenExpires");
    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("GET profile error:", error);
    return NextResponse.json({ error: "Failed to retrieve profile" }, { status: 500 });
  }
}

/**
 * PUT /api/user/profile
 * Update profile details (name and/or image) of logged-in user
 */
export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, image } = body;

    const updates: Record<string, string> = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (image !== undefined) {
      // Validate it's a proper Cloudinary URL or empty string (to remove)
      if (image !== "" && !image.startsWith("https://res.cloudinary.com/")) {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
      updates.image = image;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true }
    ).select("-password -otp -otpExpires -resetToken -resetTokenExpires");

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("PUT profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
