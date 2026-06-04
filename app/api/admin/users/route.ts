import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/admin/users
// Retrieve all users (with optional search/role filters)
export async function GET(req: Request) {
  try {
    const session = await auth();
    const adminUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";

    await connectToDatabase();

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    // Sort by most recent
    const users = await User.find(query).sort({ createdAt: -1 });

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error("GET admin users error:", error);
    return NextResponse.json({ error: "Failed to retrieve users" }, { status: 500 });
  }
}

// POST /api/admin/users
// Manually create a user account (admin can generate or set password)
export async function POST(req: Request) {
  try {
    const session = await auth();
    const adminUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, isVerified } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || "user",
      isVerified: isVerified !== undefined ? isVerified : true,
    });

    // Log manual user creation
    await AccountLog.create({
      email: newUser.email,
      name: newUser.name,
      action: "create_manual",
      details: `Account manually created by Admin (${adminUser.email || "System"}). Password stored and revealed.`,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("POST admin user create error:", error);
    return NextResponse.json({ error: "Failed to create user account" }, { status: 500 });
  }
}
