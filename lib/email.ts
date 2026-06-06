import { Resend } from "resend";
import nodemailer from "nodemailer";

const isDev = process.env.NODE_ENV === "development";

const resend =
  process.env.RESEND_API_KEY &&
  !process.env.RESEND_API_KEY.startsWith("re_12345")
    ? new Resend(process.env.RESEND_API_KEY)
    : null;

// Setup SMTP Transporter fallback
const smtpTransporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Pass the raw OTP/code so dev logs can surface it clearly */
  devCode?: string;
}

/**
 * Extract a 6-digit numeric code from a plain-text string (used as a fallback
 * when devCode is not explicitly passed).
 */
function extractCode(text: string): string | null {
  const match = text.match(/\b\d{6}\b/);
  return match ? match[0] : null;
}

/**
 * Pretty-print a dev email to the terminal so developers don't need a real
 * email provider during local development.
 */
function printDevEmail({
  to,
  subject,
  text,
  devCode,
}: {
  to: string;
  subject: string;
  text: string;
  devCode?: string;
}) {
  const code = devCode || extractCode(text) || extractCode(subject) || "—";
  const bar  = "═".repeat(56);
  const line = "─".repeat(56);

  console.log(`\n╔${bar}╗`);
  console.log(`║${"  📧  DEV EMAIL INTERCEPTED".padEnd(56)}║`);
  console.log(`╠${bar}╣`);
  console.log(`║  TO:      ${to.padEnd(45)}║`);
  console.log(`║  SUBJECT: ${subject.substring(0, 45).padEnd(45)}║`);
  console.log(`╠${bar}╣`);
  console.log(`║${"".padEnd(56)}║`);
  console.log(`║  🔑  CODE / PASSCODE:${"".padEnd(35)}║`);
  console.log(`║${"".padEnd(56)}║`);
  console.log(`║      ┌${line}┐  ║`);
  console.log(`║      │  ${code.padEnd(54)}│  ║`);
  console.log(`║      └${line}┘  ║`);
  console.log(`║${"".padEnd(56)}║`);
  console.log(`╚${bar}╝\n`);
}

/**
 * Robust email dispatcher.
 *
 * – Tries Resend first, SMTP second.
 * – In development or production, if no credentials are set, falls back to printing to terminal.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  devCode,
}: SendEmailOptions) {
  const fromEmail = process.env.EMAIL_FROM || "hello@naturalist.com";
  const fromName  = process.env.EMAIL_FROM_NAME || "Naturalist";
  const from      = `${fromName} <${fromEmail}>`;
  const plainText = text || "";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const unsubscribeUrl = `${appUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(to)}`;

  // ── Resend primary ──────────────────────────────────────────────────────
  if (resend) {
    try {
      // Resend sandbox/unverified domains require sending from onboarding@resend.dev
      const isPublicOrUnverified = 
        fromEmail.endsWith("gmail.com") || 
        fromEmail.endsWith("yahoo.com") || 
        fromEmail.endsWith("hotmail.com") || 
        fromEmail.endsWith("outlook.com") || 
        fromEmail.endsWith("naturalist.com");

      const resendFrom = isPublicOrUnverified 
        ? `${fromName} <onboarding@resend.dev>` 
        : from;

      const response = await resend.emails.send({
        from: resendFrom,
        to,
        subject,
        html,
        text: plainText,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (!response.error) {
        return { success: true, id: response.data?.id, provider: "resend" };
      }
      console.warn("Resend email failed, trying SMTP fallback...", response.error);
    } catch (err) {
      console.error("Resend connection error, trying SMTP fallback...", err);
    }
  }

  // ── SMTP secondary ──────────────────────────────────────────────────────
  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from,
        to,
        subject,
        html,
        text: plainText,
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      return { success: true, id: info.messageId, provider: "smtp" };
    } catch (err) {
      console.error("SMTP fallback failed...", err);
      console.warn("EMAIL SEND WARNING: Both Resend and SMTP failed in production. Falling back to terminal printing to prevent blocking user actions.");
    }
  }

  // ── Fallback terminal print ────────────────────────────────────────────
  printDevEmail({ to, subject, text: plainText, devCode });
  return { success: true, id: `dev-${Date.now()}`, provider: "terminal" };
}
