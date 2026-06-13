import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SupportChat } from "@/models/SupportChat";
import { auth } from "@/lib/auth";

/**
 * POST /api/admin/chats/[id]/message
 * Sends a message from the admin to the customer support session.
 * Flips the session mode to "human" automatically.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userEmail = (session?.user as any)?.email?.toLowerCase().trim();
    const isAdmin =
      userEmail === "ikechukwualaeto@gmail.com" ||
      (session?.user as any)?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    await connectToDatabase();

    const chatSession = await SupportChat.findById(id);
    if (!chatSession) {
      return NextResponse.json({ error: "Support chat session not found" }, { status: 404 });
    }

    const wasAI = chatSession.mode === "ai";

    // Set session mode to human since an admin is intervening
    chatSession.mode = "human";

    // Append system message indicating manual override if it was in AI mode previously
    if (wasAI) {
      chatSession.messages.push({
        role: "system",
        content: "Specialist has joined the conversation. AI responder is temporarily disabled.",
        timestamp: new Date(),
        senderName: "System",
      });
    }

    // Append the admin response
    const adminMessage = {
      role: "assistant" as const,
      content: message.trim(),
      timestamp: new Date(),
      senderName: session.user?.name || "Specialist",
    };
    chatSession.messages.push(adminMessage);

    await chatSession.save();

    return NextResponse.json({
      success: true,
      messages: chatSession.messages,
      mode: chatSession.mode,
    });
  } catch (error: any) {
    console.error("POST admin send message error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
