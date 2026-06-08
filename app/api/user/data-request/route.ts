import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DataRequest } from "@/models/DataRequest";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const request = await DataRequest.findOne({ userId: session.user.id }).sort({ createdAt: -1 });

    return NextResponse.json(request || null, { status: 200 });
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

    // Check if there's already a pending request
    const existing = await DataRequest.findOne({
      userId: session.user.id,
      status: "pending",
    });

    if (existing) {
      return NextResponse.json({ error: "You already have a pending data request." }, { status: 400 });
    }

    const newRequest = await DataRequest.create({
      userId: session.user.id,
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
