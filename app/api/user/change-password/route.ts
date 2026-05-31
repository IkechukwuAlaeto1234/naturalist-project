import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validations";
import { getFirstValidationError } from "@/lib/utils";

/**
 * POST /api/user/change-password
 * Safely change the authenticated user's password
 */
export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    // 2. Parse & Validate input with Zod
    const body = await req.json();
    const result = changePasswordSchema.safeParse(body);
    if (!result.success) {
      const errorMap = result.error.flatten().fieldErrors;
      const firstError = getFirstValidationError(errorMap) || "Invalid password inputs";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = result.data;

    await connectToDatabase();

    // 3. Find User & Verify current password
    const user = await User.findById(session.user.id);
    if (!user || !user.password) {
      return NextResponse.json({ error: "User account not found" }, { status: 404 });
    }

    const isCurrentPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    // 4. Hash and save new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
