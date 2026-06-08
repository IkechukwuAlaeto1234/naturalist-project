import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { DataRequest } from "@/models/DataRequest";
import { auth } from "@/lib/auth";

export async function PUT(
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

    const body = await req.json();
    const { status, downloadUrl } = body;

    if (!status || !["pending", "approved", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    await connectToDatabase();

    const request = await DataRequest.findById(id);
    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    request.status = status;
    if (downloadUrl !== undefined) {
      request.downloadUrl = downloadUrl;
    }
    await request.save();

    return NextResponse.json(request, { status: 200 });
  } catch (error) {
    console.error("PUT admin data request error:", error);
    return NextResponse.json({ error: "Failed to update data request" }, { status: 500 });
  }
}
