import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { BaseEmailLayout } from "@/emails/BaseEmailLayout";
import * as React from "react";

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

    const { to, subject, body, ticketId, inquiryId } = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: "To, subject, and body are required." },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json({ error: "Invalid recipient email address." }, { status: 400 });
    }

    // Convert plain text body paragraphs into proper HTML nodes
    const sansSerifStack = "'Host Grotesk', Verdana, Geneva, sans-serif";
    const paragraphs = body
      .split("\n\n")
      .map((para: string) =>
        React.createElement(
          "p",
          {
            key: para.slice(0, 20),
            style: { margin: "0 0 16px 0", fontFamily: sansSerifStack, fontSize: "14px", color: "#141f19", lineHeight: "1.7" },
          },
          // preserve single line-breaks within a paragraph
          para.split("\n").reduce((acc: React.ReactNode[], line, i, arr) => {
            acc.push(line);
            if (i < arr.length - 1) acc.push(React.createElement("br", { key: i }));
            return acc;
          }, [])
        )
      );

    // Ticket reference footer line (if applicable)
    const ticketRef = ticketId && ticketId !== "undefined"
      ? React.createElement(
          "p",
          { style: { margin: "16px 0 0 0", fontSize: "11px", color: "#8a9e90", fontFamily: sansSerifStack } },
          `Reference: Ticket ${ticketId}`
        )
      : null;

    const emailContent = React.createElement(
      React.Fragment,
      null,
      ...paragraphs,
      ticketRef
    );

    const htmlBody = await render(
      React.createElement(BaseEmailLayout, { title: subject, previewText: subject, children: emailContent })
    );

    const result = await sendEmail({
      to: to.trim().toLowerCase(),
      subject: subject.trim(),
      html: htmlBody,
      text: body,
    });

    // If this is a reply to a ticket, update the ticket status to "replied"
    if (inquiryId) {
      try {
        const { connectToDatabase } = await import("@/lib/db");
        const { Contact } = await import("@/models/Contact");
        await connectToDatabase();
        await Contact.findByIdAndUpdate(inquiryId, {
          status: "replied",
          $push: {
            replies: {
              sender: "Naturalist Team",
              message: body,
              sentAt: new Date(),
            },
          },
        });
      } catch (dbErr) {
        // Non-fatal — email was sent, just log the DB error
        console.error("Failed to update ticket status after reply:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Email dispatched successfully via ${result.provider}.`,
      provider: result.provider,
      id: result.id,
    });
  } catch (error: any) {
    console.error("Email dispatch error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
