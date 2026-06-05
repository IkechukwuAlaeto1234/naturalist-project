import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email";
import React from "react";

// Import all templates
import { OTPEmail } from "@/emails/OTPEmail";
import { PasswordResetEmail } from "@/emails/PasswordResetEmail";
import { WelcomeEmail } from "@/emails/WelcomeEmail";
import { OrderConfirmationEmail } from "@/emails/OrderConfirmationEmail";
import { OrderShippedEmail } from "@/emails/OrderShippedEmail";
import { PasswordResetSuccessEmail } from "@/emails/PasswordResetSuccessEmail";
import { SecurityAlertEmail } from "@/emails/SecurityAlertEmail";
import { LegalUpdateEmail } from "@/emails/LegalUpdateEmail";

export async function POST(req: Request) {
  try {
    const { template, toEmail } = await req.json();

    if (!template || !toEmail) {
      return NextResponse.json(
        { error: "Template name and destination email are required." },
        { status: 400 }
      );
    }

    let element: React.ReactElement | null = null;
    let subject = "Naturalist Notification";
    let textFallback = "";

    switch (template) {
      case "OTPEmail":
        element = React.createElement(OTPEmail, {
          otp: "N4TGLO",
          name: "Ikechukwu Alaeto",
        });
        subject = "Confirm your Naturalist email address";
        textFallback = "Your email verification passcode is N4TGLO.";
        break;
      case "PasswordResetEmail":
        element = React.createElement(PasswordResetEmail, {
          token: "RST829",
          name: "Ikechukwu Alaeto",
        });
        subject = "Reset your Naturalist password";
        textFallback = "Your password reset passcode is RST829.";
        break;
      case "WelcomeEmail":
        element = React.createElement(WelcomeEmail, {
          name: "Ikechukwu Alaeto",
        });
        subject = "Welcome to Naturalist - Special Gift Inside!";
        textFallback = "Welcome to Naturalist! Use coupon NATURALGLOW10 for 10% off your first purchase.";
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
        subject = "Naturalist: Order Confirmation #98321";
        textFallback = "Thank you for your purchase from Naturalist! Order #98321 is confirmed.";
        break;
      case "OrderShippedEmail":
        element = React.createElement(OrderShippedEmail, {
          orderId: "98321",
          name: "Ikechukwu Alaeto",
          carrier: "Naturalist Eco-Courier",
          trackingNumber: "ECO-TRACK-98321-998",
        });
        subject = "Naturalist: Your Order Has Shipped! #98321";
        textFallback = "Your Naturalist order #98321 has shipped with tracking number ECO-TRACK-98321-998.";
        break;
      case "PasswordResetSuccessEmail":
        element = React.createElement(PasswordResetSuccessEmail, {
          name: "Ikechukwu Alaeto",
        });
        subject = "Security Alert: Password Updated";
        textFallback = "Your password has been successfully reset.";
        break;
      case "SecurityAlertEmail":
        element = React.createElement(SecurityAlertEmail, {
          name: "Ikechukwu Alaeto",
          device: "Chrome 124 on Windows 11",
          location: "Lagos, Nigeria",
          time: new Date().toLocaleString(),
          ipAddress: "197.210.64.218",
        });
        subject = "Security Alert: New Sign In Detected";
        textFallback = "A new sign-in was detected on your account.";
        break;
      case "LegalUpdateEmail":
        element = React.createElement(LegalUpdateEmail, {
          name: "Ikechukwu Alaeto",
          documentName: "Terms of Service & Privacy Statement",
          updateDate: new Date().toLocaleDateString(),
          changesSummary: "We have revised our data storage clauses to comply with global e-commerce and cookie preference directives.",
        });
        subject = "Naturalist Policy Notice: Updates to Terms of Service";
        textFallback = "Notice: We have updated our Terms of Service & Privacy Policy.";
        break;
      default:
        return NextResponse.json(
          { error: `Template ${template} not found.` },
          { status: 404 }
        );
    }

    // Compile React components to static email HTML string
    const html = await render(element);

    // Send the email using the central sender (Resend or SMTP fallback)
    const result = await sendEmail({
      to: toEmail.trim().toLowerCase(),
      subject,
      html,
      text: textFallback,
      devCode: template === "OTPEmail" ? "N4TGLO" : template === "PasswordResetEmail" ? "RST829" : undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Test email successfully dispatched using provider: ${result.provider}`,
      provider: result.provider,
      id: result.id,
    });
  } catch (error: any) {
    console.error("Test email sending error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
