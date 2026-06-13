import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SupportChat } from "@/models/SupportChat";

/**
 * POST /api/support/end
 * Resolves the support chat session and saves customer rating/feedback reviews.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, rating, feedback } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const chatSession = await SupportChat.findOne({ sessionId });
    if (!chatSession) {
      return NextResponse.json({ error: "Support chat session not found" }, { status: 404 });
    }

    chatSession.status = "resolved";
    
    if (rating !== undefined) {
      const numRating = Number(rating);
      if (numRating >= 1 && numRating <= 5) {
        chatSession.rating = numRating;
      }
    }
    
    if (feedback !== undefined) {
      chatSession.feedback = String(feedback).trim();
    }

    // Append end chat system indicator
    chatSession.messages.push({
      role: "system",
      content: "Conversation has ended. Thank you for your feedback!",
      timestamp: new Date(),
      senderName: "System",
    });

    await chatSession.save();

    return NextResponse.json({
      success: true,
      status: chatSession.status,
      rating: chatSession.rating,
      feedback: chatSession.feedback,
    });
  } catch (error: any) {
    console.error("POST resolve support chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
