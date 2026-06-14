import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { DataRequest } from "@/models/DataRequest";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    let resolvedUserId: mongoose.Types.ObjectId | string = session.user.id;
    if (!mongoose.Types.ObjectId.isValid(session.user.id) && session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
      if (dbUser) {
        resolvedUserId = dbUser._id as mongoose.Types.ObjectId;
      }
    }

    const requests = await DataRequest.find({ userId: resolvedUserId }).sort({ createdAt: -1 });

    return NextResponse.json(requests || [], { status: 200 });
  } catch (error) {
    console.error("GET user data request error:", error);
    return NextResponse.json({ error: "Failed to fetch data request status" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session || !session.user?.id || !session.user?.email || !session.user?.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    let resolvedUserId: mongoose.Types.ObjectId | string = session.user.id;
    if (!mongoose.Types.ObjectId.isValid(session.user.id) && session.user.email) {
      const dbUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
      if (dbUser) {
        resolvedUserId = dbUser._id as mongoose.Types.ObjectId;
      }
    }

    // Check if there's already a pending request
    const existing = await DataRequest.findOne({
      userId: resolvedUserId,
      status: "pending",
    });

    if (existing) {
      return NextResponse.json({ error: "You already have a pending data request." }, { status: 400 });
    }

    const newRequest = await DataRequest.create({
      userId: resolvedUserId,
      userName: session.user.name,
      userEmail: session.user.email,
      status: "pending",
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("POST user data request error:", error);
    return NextResponse.json({ error: "Failed to submit data request" }, { status: 500 });
  }
}
