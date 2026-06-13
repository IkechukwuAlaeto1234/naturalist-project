import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { AccountLog } from "@/models/AccountLog";
import { auth } from "@/lib/auth";

// GET /api/admin/users/[id]
// Retrieve a single user account and sessions (Admin only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const adminUser = session?.user as { role?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(id).lean();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("GET admin user error:", error);
    return NextResponse.json({ error: "Failed to retrieve user" }, { status: 500 });
  }
}

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
    const { role, isVerified, isSuspended, name, email, plainPassword, secondaryEmail, isSecondaryEmailVerified } = body;

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

    // Track whether a role or suspension change is happening — these require
    // immediate session invalidation so the user can't keep acting under
    // their old JWT-cached role/status.
    const roleChanging    = role !== undefined && role !== user.role;
    const suspendChanging = isSuspended !== undefined && isSuspended !== user.isSuspended;

    if (roleChanging) {
      changes.push(`role changed from "${user.role}" to "${role}"`);
      user.role = role;
    }

    if (isVerified !== undefined && isVerified !== user.isVerified) {
      changes.push(`verification status changed from ${user.isVerified} to ${isVerified}`);
      user.isVerified = isVerified;
    }

    if (suspendChanging) {
      changes.push(isSuspended ? "suspended account" : "unsuspended account");
      user.isSuspended = isSuspended;
    }

    if (secondaryEmail !== undefined && secondaryEmail !== user.secondaryEmail) {
      changes.push(`secondary recovery email changed from "${user.secondaryEmail || "none"}" to "${secondaryEmail}"`);
      user.secondaryEmail = secondaryEmail.toLowerCase().trim();
      user.isSecondaryEmailVerified = isSecondaryEmailVerified !== undefined ? isSecondaryEmailVerified : true;
    }

    if (body.revokeSessionId) {
      const sessionToEvict = user.sessions?.find((s: any) => s.id === body.revokeSessionId);
      const sessionInfo = sessionToEvict 
        ? `${sessionToEvict.browser} on ${sessionToEvict.os} (${sessionToEvict.ipAddress})`
        : body.revokeSessionId;
      changes.push(`revoked session: ${sessionInfo}`);
      user.sessions = user.sessions?.filter((s: any) => s.id !== body.revokeSessionId) || [];
    }

    if (plainPassword) {
      changes.push("updated password manually");
      const bcrypt = require("bcryptjs");
      user.password = await bcrypt.hash(plainPassword, 12);
    }

    // ── Session invalidation ────────────────────────────────────────────────
    // If the role or suspension status changed, wipe ALL stored sessions for
    // the affected user. Auth.js JWT tokens remain valid on the client until
    // they expire, but clearing the DB sessions means the next server-side
    // auth check (proxy middleware / API guard) will find no active session
    // record and redirect the user to sign in again with their new role/status.
    if (roleChanging || suspendChanging) {
      changes.push("all active sessions invalidated (re-login required)");
      user.sessions = [];
    }

    if (changes.length > 0) {
      await user.save();
      
      // Log this in AccountLog
      await AccountLog.create({
        email: user.email,
        name: user.name,
        action: suspendChanging ? (isSuspended ? "suspend" : "unsuspend") : "update",
        details: `Account modified by Admin (${adminUser.email || "System"}). Changes: ${changes.join(", ")}.`,
      });
    }

    // Tell the client whether a forced sign-out is required so the admin UI
    // can show an appropriate message.
    return NextResponse.json(
      { ...user.toObject(), _sessionInvalidated: roleChanging || suspendChanging },
      { status: 200 }
    );
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
