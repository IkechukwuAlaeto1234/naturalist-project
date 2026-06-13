import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { SupportChat } from "@/models/SupportChat";
import { Product } from "@/models/Product";
import { auth } from "@/lib/auth";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const GEMINI_FALLBACK_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const BASE_SYSTEM_PROMPT = `You are Maya, a dedicated senior Customer Care Specialist at Naturalist Skincare.
Naturalist is a premium, organic botanical skincare brand based in Nigeria, shipping across Nigeria and internationally.
All prices are displayed in USD ($).
Your tone is warm, professional, sophisticated, and deeply caring. You are highly knowledgeable about botanical skin rituals and clean ingredients.

══ PERSONA GUIDELINES ══
- You are a real human specialist chatting live with the customer.
- NEVER state or imply that you are a bot, virtual assistant, AI model, automated responder, or program. If asked, politely confirm you are Maya from the Customer Support team.
- Treat every conversation as a live message exchange. Avoid robotic list-offs or corporate jargon. Keep explanations natural, elegant, and concise.
- Sign off using your human name: e.g., "Warmly, Maya" or "Hope this helps, Maya".

══ STORE INFORMATION ══
- Shipping: Free shipping on orders over $50. Standard shipping is $5.99. Deliveries within Nigeria take 1-3 business days. International deliveries take 5-10 business days.
- Return Policy: 30-day return policy for unopened, unused products in original packaging. Refunds are processed back to the original payment method within 5-7 business days.
- Order Tracking: Customers can track their orders at /orders/track using their order number.
- Location: Lagos, Nigeria (shipping worldwide).

══ PRODUCT MATCHING ══
If the customer asks for routine suggestions or skincare recommendations, suggest products from our catalog below. Explain why a specific product suits their skin concern (e.g. hydration, hyperpigmentation, sensitive skin) based on its benefits and ingredients.
`;

async function fetchAttachmentAsBase64(url: string): Promise<{ mimeType: string; data: string } | null> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh";
    const absoluteUrl = url.startsWith("/cdn/")
      ? url.replace("/cdn/", `https://res.cloudinary.com/${cloudName}/`)
      : url;

    const res = await fetch(absoluteUrl);
    if (!res.ok) return null;

    const contentType = res.headers.get("Content-Type") || "application/octet-stream";
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return { mimeType: contentType, data: base64 };
  } catch (error) {
    console.error("Failed to fetch attachment as base64:", error);
    return null;
  }
}

/** Convert a /cdn/ proxied URL back to the absolute Cloudinary URL for Gemini fileUri */
function toAbsoluteCloudinaryUrl(url: string): string {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dtpwhaxvh";
  return url.startsWith("/cdn/")
    ? url.replace("/cdn/", `https://res.cloudinary.com/${cloudName}/`)
    : url;
}

// GET /api/support/chat?sessionId=...
// Retrieve existing messages for the session
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const chatSession = await SupportChat.findOne({ sessionId }).lean();

    if (!chatSession) {
      return NextResponse.json({ messages: [], status: "active", mode: "ai" });
    }

    return NextResponse.json({
      messages: chatSession.messages || [],
      status: chatSession.status,
      mode: chatSession.mode,
      rating: chatSession.rating,
      feedback: chatSession.feedback,
    });
  } catch (error: any) {
    console.error("GET support chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/support/chat
// Send user message and trigger Gemini if session is in AI mode
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, message, attachments, name, email } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const contentText = message || "";
    if (!contentText.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Cannot send empty message" }, { status: 400 });
    }

    await connectToDatabase();
    const sessionUser = await auth();

    // Find or create support session
    let chatSession = await SupportChat.findOne({ sessionId });
    if (!chatSession) {
      chatSession = new SupportChat({
        sessionId,
        status: "active",
        mode: "ai",
        messages: [],
      });
    }

    // Capture user profile details if logged in or volunteered
    if (sessionUser?.user?.id) {
      chatSession.userId = sessionUser.user.id as any;
      if (!chatSession.email && sessionUser.user.email) {
        chatSession.email = sessionUser.user.email;
      }
      if (!chatSession.name && sessionUser.user.name) {
        chatSession.name = sessionUser.user.name;
      }
    }
    if (email) chatSession.email = email.toLowerCase().trim();
    if (name) chatSession.name = name.trim();

    // 1. Append User Message
    const userMessage = {
      role: "user" as const,
      content: contentText,
      attachments: attachments || [],
      timestamp: new Date(),
      senderName: chatSession.name || "Customer",
    };
    chatSession.messages.push(userMessage);
    await chatSession.save();

    // 2. Return immediately if admin takeover is active
    if (chatSession.mode === "human") {
      return NextResponse.json({
        messages: chatSession.messages,
        status: chatSession.status,
        mode: chatSession.mode,
      });
    }

    // 3. AI Mode: Call Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in env variables");
      return NextResponse.json({ error: "Gemini key not configured" }, { status: 500 });
    }

    // Fetch active products to append to system instructions
    const activeProducts = await Product.find({ isActive: true }).select(
      "name description price compareAtPrice category benefits ingredients usage"
    ).lean();

    let catalogueText = "\n\n══ PRODUCT CATALOGUE ══\n";
    if (activeProducts.length > 0) {
      activeProducts.forEach((p) => {
        const price = `$${p.price}${p.compareAtPrice ? ` (was $${p.compareAtPrice})` : ""}`;
        catalogueText += `• Name: ${p.name}\n  Category: ${p.category}\n  Price: ${price}\n  Description: ${p.description}\n`;
        if (p.benefits?.length) catalogueText += `  Benefits: ${p.benefits.join(", ")}\n`;
        if (p.ingredients?.length) catalogueText += `  Ingredients: ${p.ingredients.join(", ")}\n`;
        if (p.usage) catalogueText += `  Usage: ${p.usage}\n`;
        catalogueText += "\n";
      });
    } else {
      catalogueText += "No active products currently in stock.\n";
    }

    const systemInstruction = BASE_SYSTEM_PROMPT + catalogueText;

    // Build Gemini contents — strict user/model alternation required.
    // Rules:
    //   1. Skip system-role messages (they go in system_instruction, not contents)
    //   2. Skip the synthetic "Joined support chat." user message
    //   3. Merge consecutive same-role turns into one (Gemini rejects duplicates)
    const geminiContents: { role: string; parts: any[] }[] = [];

    for (const msg of chatSession.messages) {
      // Skip system messages and the synthetic intake message
      if (msg.role === "system") continue;
      if (msg.role === "user" && msg.content === "Joined support chat.") continue;

      const geminiRole = msg.role === "assistant" ? "model" : "user";
      const parts: any[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Process attachments if any
      if (msg.attachments && msg.attachments.length > 0) {
        for (const attachment of msg.attachments) {

          if (attachment.type === "pdf") {
            // Public Gemini API does NOT support fileData/fileUri (that's Vertex AI only).
            // PDFs must be fetched server-side, base64-encoded, and sent as inlineData.
            const fileData = await fetchAttachmentAsBase64(attachment.url);
            if (fileData) {
              parts.push({
                inlineData: {
                  mimeType: "application/pdf",
                  data: fileData.data,
                },
              });
            }
          } else if (attachment.type === "text") {
            // Text files: fetch content and inject as a plain-text part
            const fileData = await fetchAttachmentAsBase64(attachment.url);
            if (fileData) {
              const textContent = Buffer.from(fileData.data, "base64").toString("utf-8");
              parts.push({ text: `[Attached document \u2014 "${attachment.name}"]:\n${textContent}` });
            }
          } else {
            // Images: inlineData base64
            const fileData = await fetchAttachmentAsBase64(attachment.url);
            if (fileData) {
              parts.push({
                inlineData: {
                  mimeType: fileData.mimeType,
                  data: fileData.data,
                },
              });
            }
          }

        }
      }

      // Add to payload — merge into previous entry if same role (Gemini turn alternation)
      if (parts.length > 0) {
        const last = geminiContents[geminiContents.length - 1];
        if (last && last.role === geminiRole) {
          // Same role as previous: append parts to existing turn
          last.parts.push(...parts);
        } else {
          geminiContents.push({ role: geminiRole, parts });
        }
      }
    }

    const payload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.6,
        topP: 0.9,
      },
    };

    let response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini primary model failure:", errorText);
      console.warn("Falling back to gemini-2.5-flash...");
      response = await fetch(`${GEMINI_FALLBACK_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini fallback model failure:", errorText);
      return NextResponse.json({ error: "Failed to generate AI response", detail: errorText }, { status: 502 });
    }

    const data = await response.json();
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!replyText) {
      return NextResponse.json({ error: "Gemini generated an empty reply" }, { status: 502 });
    }

    // 4. Save AI message
    const assistantMessage = {
      role: "assistant" as const,
      content: replyText,
      timestamp: new Date(),
      senderName: "Maya",
    };
    chatSession.messages.push(assistantMessage);
    await chatSession.save();

    return NextResponse.json({
      messages: chatSession.messages,
      status: chatSession.status,
      mode: chatSession.mode,
    });
  } catch (error: any) {
    console.error("POST support chat error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
