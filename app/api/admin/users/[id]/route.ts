import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";

// PUT /api/admin/users/[id]
// Suspend, unsuspend, verify or change role of a user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    const adminUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin" || !adminUser.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { role, isVerified, isSuspended, name, email, plainPassword } = body;

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't let admin suspend themselves
    if (user._id.toString() === adminUser.id && isSuspended === true) {
      return NextResponse.json({ error: "You cannot suspend your own admin account!" }, { status: 400 });
    }

    // Log changes
    const changes: string[] = [];

    if (name && name !== user.name) {
      changes.push(`name changed from "${user.name}" to "${name}"`);
      user.name = name;
    }

    if (email && email.toLowerCase() !== user.email) {
      changes.push(`email changed from "${user.email}" to "${email.toLowerCase()}"`);
      user.email = email.toLowerCase().trim();
    }

    if (role && role !== user.role) {
      changes.push(`role changed from "${user.role}" to "${role}"`);
      user.role = role;
    }

    if (isVerified !== undefined && isVerified !== user.isVerified) {
      changes.push(`verification status changed from ${user.isVerified} to ${isVerified}`);
      user.isVerified = isVerified;
    }

    if (isSuspended !== undefined && isSuspended !== user.isSuspended) {
      changes.push(isSuspended ? "suspended account" : "unsuspended account");
      user.isSuspended = isSuspended;
    }

    if (plainPassword) {
      changes.push("updated password manually");
      user.plainPassword = plainPassword;
      // Also hash it
      const bcrypt = require("bcryptjs");
      user.password = await bcrypt.hash(plainPassword, 10);
    }

    if (changes.length > 0) {
      await user.save();
      
      // Log this in AccountLog
      await AccountLog.create({
        email: user.email,
        name: user.name,
        action: isSuspended !== undefined && isSuspended !== !user.isSuspended ? (isSuspended ? "suspend" : "unsuspend") : "update",
        details: `Account modified by Admin (${adminUser.email || "System"}). Changes: ${changes.join(", ")}.`,
      });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("PUT admin user update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id]
// Permanently delete a user account
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    const adminUser = session?.user as { id?: string; role?: string; email?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin" || !adminUser.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user._id.toString() === adminUser.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account!" }, { status: 400 });
    }

    await User.findByIdAndDelete(id);

    // Log user deletion in AccountLog
    await AccountLog.create({
      email: user.email,
      name: user.name,
      action: "delete",
      details: `Account permanently deleted by Admin (${adminUser.email || "System"}).`,
    });

    return NextResponse.json({ message: "User account deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE admin user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
