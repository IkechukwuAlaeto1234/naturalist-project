import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SupportChat } from "@/models/SupportChat";
import { auth } from "@/lib/auth";

// GET /api/admin/chats
// Fetch all support chats (Admin only)
export async function GET() {
  try {
    const session = await auth();
    const userEmail = (session?.user as any)?.email?.toLowerCase().trim();
    const isAdmin =
      userEmail === "ikechukwualaeto@gmail.com" ||
      (session?.user as any)?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    // Fetch support sessions sorted by latest activity
    const chats = await SupportChat.find({}).sort({ updatedAt: -1 });

    return NextResponse.json(chats, { status: 200 });
  } catch (error: any) {
    console.error("GET admin support chats error:", error);
    return NextResponse.json({ error: "Failed to retrieve support chats" }, { status: 500 });
  }
}

// PUT /api/admin/chats
// Update support chat session settings like status or mode (Admin only)
export async function PUT(req: Request) {
  try {
    const session = await auth();
    const userEmail = (session?.user as any)?.email?.toLowerCase().trim();
    const isAdmin =
      userEmail === "ikechukwualaeto@gmail.com" ||
      (session?.user as any)?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { id, status, mode } = body;

    if (!id) {
      return NextResponse.json({ error: "Chat Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const chatSession = await SupportChat.findById(id);
    if (!chatSession) {
      return NextResponse.json({ error: "Support chat not found" }, { status: 404 });
    }

    if (status !== undefined) {
      chatSession.status = status;
      if (status === "resolved") {
        chatSession.messages.push({
          role: "system",
          content: "Conversation marked as resolved by Administrator.",
          timestamp: new Date(),
          senderName: "System",
        });
      }
    }

    if (mode !== undefined) {
      chatSession.mode = mode;
      chatSession.messages.push({
        role: "system",
        content: mode === "human" 
          ? "Specialist has joined the conversation. AI responder is temporarily disabled."
          : "Specialist left the conversation. AI responder is active.",
        timestamp: new Date(),
        senderName: "System",
      });
    }

    await chatSession.save();

    return NextResponse.json({
      success: true,
      chat: chatSession,
    });
  } catch (error: any) {
    console.error("PUT admin support chat error:", error);
    return NextResponse.json({ error: "Failed to update support chat settings" }, { status: 500 });
  }
}
