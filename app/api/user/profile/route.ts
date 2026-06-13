import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

const ipLocationCache = new Map<string, string>();

async function getIpLocation(ip: string): Promise<string> {
  if (!ip || ip === "::1" || ip === "127.0.0.1" || ip.startsWith("192.168.") || ip.startsWith("10.") || ip.startsWith("::ffff:127.0.0.1")) {
    return "Ibadan, Nigeria (Local)";
  }
  if (ipLocationCache.has(ip)) {
    return ipLocationCache.get(ip)!;
  }
  try {
    // Call free ip-api.com (no key needed, 45 requests per min max)
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,regionName,country`, {
      signal: AbortSignal.timeout(1500) // Timeout after 1500ms to avoid blocking
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success") {
        const loc = `${data.city}, ${data.regionName}, ${data.country}`;
        ipLocationCache.set(ip, loc);
        return loc;
      }
    }
  } catch (e) {
    console.error("Geocoding failed for IP:", ip, e);
  }
  return "Unknown Location";
}

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
    
    const userObj = user.toObject({ flattenMaps: true });
    if (userObj.sessions && userObj.sessions.length > 0) {
      userObj.sessions = await Promise.all(userObj.sessions.map(async (s: any) => {
        const location = await getIpLocation(s.ipAddress);
        return { ...s, location };
      }));
    }

    return NextResponse.json(userObj, { status: 200 });
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
      if (image !== "" && !image.startsWith("https://res.cloudinary.com/") && !image.startsWith("https://lh3.googleusercontent.com") && !image.startsWith("/cdn/")) {
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

