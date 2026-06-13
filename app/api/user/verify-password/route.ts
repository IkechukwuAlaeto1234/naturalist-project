import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

/**
 * POST /api/user/verify-password
 * Safely verify user's current password for locked security mutations
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { currentPassword } = await req.json();
    if (!currentPassword) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user || !user.password) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const isCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCorrect) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Password verified!" }, { status: 200 });
  } catch (error) {
    console.error("Verify password error:", error);
    return NextResponse.json({ error: "Failed to verify password" }, { status: 500 });
  }
}
