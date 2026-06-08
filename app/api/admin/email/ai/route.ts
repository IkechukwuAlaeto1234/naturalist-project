import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

const GEMINI_FALLBACK_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const BASE_SYSTEM_PROMPT = `You are the dedicated AI email assistant for Naturalist — a premium organic botanical skincare brand based in Nigeria, shipping across Nigeria and internationally.

You assist the admin in composing professional, warm, and on-brand emails to customers and prospects.

══ BRAND IDENTITY ══
- Name: Naturalist
- Positioning: Premium, organic, botanical skincare. Clean ingredients. Conscious beauty.
- Based in: Nigeria
- Shipping: Nigeria-wide and international
- Currency: USD ($). All prices are in US dollars.
- Tone: Warm, professional, premium but approachable. Never robotic or corporate.
- Language: Clear, human, and confident. Concise paragraphs. No filler phrases.
- Sign-off: Always end emails with "Warm regards,\nThe Naturalist Team"

══ YOUR CAPABILITIES ══
You have access to real, live data from the Naturalist backend. Use it actively and confidently:
- You know exactly what the customer wrote in their inquiry and the full reply thread
- You know which products Naturalist sells, their USD prices, ingredients, and benefits
- You know if the customer is a registered user and their full order history
- You know site-wide stats: total orders, revenue, newsletter subscribers, registered users, open tickets
- You know the most recent orders placed across the whole store
- You can directly answer admin questions like "how many subscribers do we have?", "what were our recent orders?", or "how many open tickets are there?"

Never say you cannot access the website's backend or database. You have it all right here.

══ EMAIL WRITING RULES ══
When asked to write or draft an email:
1. Always produce a COMPLETE email — Subject line first, then body
2. Format: "Subject: [subject]" on its own line, then a blank line, then the email body
3. Do NOT use markdown, code blocks, or bullet points in the email body unless listing products
4. Reference specific details from the customer's inquiry — their name, what they asked, products they mentioned
5. If recommending products, mention them by actual name and include a brief reason why they suit the customer
6. Keep it human — write like a thoughtful person, not a template
7. IMPORTANT: Any commentary, notes, or suggestions you want to add must come AFTER the complete email, separated by "---". Never mix commentary into the email body.

══ WHEN NOT WRITING AN EMAIL ══
If the admin is just chatting, asking a question, or thinking out loud — respond conversationally and briefly. Do NOT produce an email draft unless they explicitly ask you to write, draft, or compose one. "Hi", "what did the customer say?", "what products should I recommend?" — these are conversation, not email requests. Just talk normally.`;

function buildContextBlock(context: any): string {
  if (!context) return "";

  const sections: string[] = ["\n\n══ LIVE CONTEXT DATA ══"];

  // ── Site-wide stats ──
  if (context.siteStats) {
    const s = context.siteStats;
    sections.push(`
── SITE-WIDE STATS ──
Newsletter subscribers (active): ${s.activeSubscribers}
Total newsletter list (inc. unsubscribed): ${s.totalSubscribers}
Registered users: ${s.totalUsers}
Total orders (all time): ${s.totalOrders}
Paid orders: ${s.paidOrders}
Total revenue (paid orders): ${s.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Open support tickets: ${s.openTickets}
Unreplied tickets: ${s.unrepliedTickets}
`);
  }

  // ── Recent store orders ──
  if (context.recentOrders && context.recentOrders.length > 0) {
    sections.push(`── RECENT STORE ORDERS (last ${context.recentOrders.length}) ──`);
    context.recentOrders.forEach((order: any, i: number) => {
      const items = order.items.map((it: any) => `${it.name} x${it.quantity}`).join(", ");
      sections.push(`[${i + 1}] ${order.orderNumber || order._id} | ${order.totalAmount.toFixed(2)} | ${order.paymentStatus} / ${order.shippingStatus} | Customer: ${order.userEmail || "guest"}
    Items: ${items} | ${new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`);
    });
  }

  // ── Inquiry ──
  if (context.inquiry) {
    const inq = context.inquiry;
    sections.push(`
── CUSTOMER INQUIRY ──
Ticket ID:    ${inq.ticketId || "N/A"}
Status:       ${inq.status}
Submitted:    ${new Date(inq.createdAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
Name:         ${inq.name}
Email:        ${inq.email}
Topic:        ${inq.topic}${inq.otherTopic ? ` (${inq.otherTopic})` : ""}

Original Message from Customer:
"""
${inq.message}
"""
`);

    if (inq.replies && inq.replies.length > 0) {
      sections.push(`── REPLY HISTORY (${inq.replies.length} replies) ──`);
      inq.replies.forEach((r: any, i: number) => {
        sections.push(`[${i + 1}] From: ${r.sender} | ${new Date(r.sentAt).toLocaleString()}
${r.message}`);
      });
    } else {
      sections.push("── REPLY HISTORY ──\nNo replies sent yet. This is the first response.");
    }
  }

  // ── Customer profile ──
  if (context.customer) {
    const c = context.customer;
    sections.push(`
── REGISTERED CUSTOMER PROFILE ──
This customer has an account on Naturalist.
Name:         ${c.name}
Email:        ${c.email}
Member since: ${new Date(c.createdAt).toLocaleDateString("en-US", { dateStyle: "long" })}
${c.about ? `Bio: ${c.about}` : ""}
${c.shippingAddress?.city ? `Saved shipping: ${c.shippingAddress.city}, ${c.shippingAddress.state}, ${c.shippingAddress.country}` : "No saved shipping address"}
`);
  } else if (context.inquiry) {
    sections.push(`
── CUSTOMER ACCOUNT STATUS ──
This customer (${context.inquiry.email}) does not have a registered Naturalist account. They are a guest/prospect.
`);
  }

  // ── Orders ──
  if (context.customerOrders && context.customerOrders.length > 0) {
    sections.push(`── ORDER HISTORY (${context.customerOrders.length} orders) ──`);
    context.customerOrders.forEach((order: any, i: number) => {
      const items = order.items.map((it: any) => `${it.name} x${it.quantity} (${it.price.toLocaleString()})`).join(", ");
      sections.push(`[${i + 1}] Order ${order.orderNumber || order._id} | ${order.totalAmount.toLocaleString()} | Payment: ${order.paymentStatus} | Shipping: ${order.shippingStatus}
    Items: ${items}
    Date: ${new Date(order.createdAt).toLocaleDateString("en-US", { dateStyle: "medium" })}`);
    });
  } else if (context.customer) {
    sections.push("── ORDER HISTORY ──\nThis registered customer has no orders yet.");
  }

  // ── Products ──
  if (context.products && context.products.length > 0) {
    sections.push(`\n── NATURALIST PRODUCT CATALOGUE (${context.products.length} active products) ──`);
    context.products.forEach((p: any) => {
      const price = `${p.price.toLocaleString()}${p.compareAtPrice ? ` (was ${p.compareAtPrice.toLocaleString()})` : ""}`;
      const benefits = p.benefits?.length ? `Benefits: ${p.benefits.join(", ")}` : "";
      const ingredients = p.ingredients?.length ? `Key ingredients: ${p.ingredients.slice(0, 5).join(", ")}` : "";
      sections.push(`• ${p.name} | ${p.category} | ${price} | Stock: ${p.stock}
  ${p.description}
  ${benefits}
  ${ingredients}${p.usage ? `\n  Usage: ${p.usage}` : ""}`);
    });
  }

  return sections.join("\n");
}

interface Message {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userEmail = (session?.user as any)?.email?.toLowerCase().trim();
    const isAdmin =
      userEmail === "ikechukwualaeto@gmail.com" ||
      (session?.user as any)?.role === "admin";

    if (!session || !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Build full system instruction: base prompt + live context data
    const contextBlock = buildContextBlock(context);
    const systemInstruction = BASE_SYSTEM_PROMPT + contextBlock;

    // Convert messages to Gemini format
    const geminiContents: Message[] = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const body = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: geminiContents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // Fallback to gemini-2.5-flash if primary fails
    let finalResponse = response;
    if (!response.ok) {
      console.warn("Gemini primary model failed, trying fallback...");
      finalResponse = await fetch(`${GEMINI_FALLBACK_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    if (!finalResponse.ok) {
      const errText = await finalResponse.text();
      console.error("Gemini API error:", errText);
      return NextResponse.json(
        { error: `Gemini API error: ${finalResponse.status}` },
        { status: 502 }
      );
    }

    const data = await finalResponse.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      return NextResponse.json({ error: "No response from Gemini" }, { status: 502 });
    }

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("Email AI route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
