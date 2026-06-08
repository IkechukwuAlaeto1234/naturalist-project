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
    console.log("GET /api/user/profile - session:", {
      id: session?.user?.id,
      email: session?.user?.email,
      name: session?.user?.name
    });

    if (!session || !session.user?.id) {
      console.log("GET /api/user/profile - Unauthorized access (no session or user ID)");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select("-password -otp -otpExpires -resetToken -resetTokenExpires");
    if (!user) {
      console.log(`GET /api/user/profile - User profile not found for ID: ${session.user.id}`);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    console.log(`GET /api/user/profile - Success for user: ${user.email}`);
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
    console.log("PUT /api/user/profile - session:", {
      id: session?.user?.id,
      email: session?.user?.email
    });

    if (!session || !session.user?.id) {
      console.log("PUT /api/user/profile - Unauthorized access (no session or user ID)");
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    console.log("PUT /api/user/profile - request body:", body);

    const { name, image, about, pronouns, website, username, settings } = body;

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      if (!name || name.trim().length < 2) {
        console.log(`PUT /api/user/profile - validation failed: name is too short or empty ("${name}")`);
        return NextResponse.json({ error: "Name must be at least 2 characters" }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (image !== undefined) {
      if (image !== "" && !image.startsWith("https://res.cloudinary.com/") && !image.startsWith("https://lh3.googleusercontent.com")) {
        console.log(`PUT /api/user/profile - validation failed: invalid image URL ("${image}")`);
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
      updates.image = image;
    }

    if (about !== undefined) {
      updates.about = about.trim();
    }

    if (pronouns !== undefined) {
      updates.pronouns = pronouns.trim();
    }

    if (website !== undefined) {
      updates.website = website.trim();
    }

    if (username !== undefined) {
      updates.username = username.trim();
    }

    if (settings !== undefined) {
      updates.settings = settings;
    }

    console.log("PUT /api/user/profile - updates object:", updates);

    if (Object.keys(updates).length === 0) {
      console.log("PUT /api/user/profile - validation failed: updates object is empty");
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findByIdAndUpdate(
      session.user.id,
      updates,
      { new: true }
    ).select("-password -otp -otpExpires -resetToken -resetTokenExpires");

    if (!user) {
      console.log(`PUT /api/user/profile - User profile not found for ID: ${session.user.id}`);
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    console.log(`PUT /api/user/profile - Success updating profile for user: ${user.email}`);
    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("PUT profile error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

