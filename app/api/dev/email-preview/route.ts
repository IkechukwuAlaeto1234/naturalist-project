import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import React from "react";
import { resolveEmailPlaceholders } from "@/lib/button-generator";

// Import all templates
import { OTPEmail } from "@/emails/OTPEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { EmailSubscriptionEmail } from "@/emails/EmailSubscriptionEmail";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { PasswordResetSuccessEmail } from "@/emails/PasswordResetSuccessEmail";
import { SecurityAlertEmail } from "@/emails/SecurityAlertEmail";
import { LegalUpdateEmail } from "@/emails/LegalUpdateEmail";
import { UnsubscribeConfirmationEmail } from "@/emails/UnsubscribeConfirmationEmail";

export async function GET(req: Request) {
  try {
    // Only allow in development or for local testing purposes
    const { searchParams } = new URL(req.url);
    const templateName = searchParams.get("template") || "";

    let element: React.ReactElement | null = null;

    switch (templateName) {
      case "UnsubscribeConfirmationEmail":
        element = React.createElement(UnsubscribeConfirmationEmail, {
          email: "ikechukwualaeto@gmail.com",
          resubscribeUrl: "http://localhost:3000/api/newsletter/subscribe?email=ikechukwualaeto%40gmail.com",
        });
        break;
      case "OTPEmail":
        element = React.createElement(OTPEmail, {
          otp: "N4TGLO",
          name: "Ikechukwu Alaeto",
        });
        break;
      case "PasswordResetEmail":
        element = React.createElement(PasswordResetEmail, {
          token: "RST829",
          name: "Ikechukwu Alaeto",
        });
        break;
      case "WelcomeEmail":
        element = React.createElement(WelcomeEmail, {
          name: "Ikechukwu Alaeto",
        });
        break;
      case "EmailSubscriptionEmail":
        element = React.createElement(EmailSubscriptionEmail, {
          name: "Ikechukwu Alaeto",
        });
        break;
      case "OrderConfirmationEmail":
        element = React.createElement(OrderConfirmationEmail, {
          orderId: "98321",
          name: "Ikechukwu Alaeto",
          items: [
            { name: "Botanical Cleansing Milk", price: 29.99, quantity: 2 },
            { name: "Squalane Nourishing Face Oil", price: 45.00, quantity: 1 },
          ],
          totalAmount: 104.98,
          shippingAddress: {
            address: "125 Main St",
            city: "San Francisco",
            state: "CA",
            zipCode: "94107",
            country: "United States",
          },
        });
        break;
      case "OrderShippedEmail":
        element = React.createElement(OrderShippedEmail, {
          orderId: "98321",
          name: "Ikechukwu Alaeto",
          carrier: "Naturalist Eco-Courier",
          trackingNumber: "ECO-TRACK-98321-998",
        });
        break;
      case "PasswordResetSuccessEmail":
        element = React.createElement(PasswordResetSuccessEmail, {
          name: "Ikechukwu Alaeto",
        });
        break;
      case "SecurityAlertEmail":
        element = React.createElement(SecurityAlertEmail, {
          name: "Ikechukwu Alaeto",
          device: "Chrome 124 on Windows 11",
          location: "Lagos, Nigeria",
          time: "June 4, 2026, 4:28 PM",
          ipAddress: "197.210.64.218",
        });
        break;
      case "LegalUpdateEmail":
        element = React.createElement(LegalUpdateEmail, {
          name: "Ikechukwu Alaeto",
          documentName: "Terms of Service & Privacy Statement",
          updateDate: "June 15, 2026",
          changesSummary: "We have revised our data storage clauses to comply with global e-commerce and cookie preference directives. This includes a more transparent description of how we handle personal delivery profiles and payment logs.",
        });
        break;
      default:
        return new NextResponse(
          "<h3>Error: Template not found. Available options: UnsubscribeConfirmationEmail, OTPEmail, PasswordResetEmail, WelcomeEmail, EmailSubscriptionEmail, OrderConfirmationEmail, OrderShippedEmail, PasswordResetSuccessEmail, SecurityAlertEmail, LegalUpdateEmail</h3>",
          { status: 404, headers: { "Content-Type": "text/html" } }
        );
    }

    // Compile React components to static email HTML string
    const html = await render(element);

    // Resolve buttons and unsubscribe URLs for preview display
    const resolvedHtml = await resolveEmailPlaceholders(html, "preview-recipient@naturalist.com");

    return new NextResponse(resolvedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Email preview rendering error:", error);
    return new NextResponse(`<h3>Error rendering email: ${error.message}</h3>`, {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }
}
