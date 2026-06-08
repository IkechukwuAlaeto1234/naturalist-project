import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DataRequest } from "@/models/DataRequest";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    const adminUser = session?.user as { role?: string } | undefined;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const requests = await DataRequest.find({}).sort({ createdAt: -1 });

    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error("GET admin data requests error:", error);
    return NextResponse.json({ error: "Failed to retrieve data requests" }, { status: 500 });
  }
}
