import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  console.log("Testing email sending...");
  try {
    const { sendEmail } = await import("../lib/email");
    const res = await sendEmail({
      to: "ikechukwualaeto@gmail.com",
      subject: "Test email from Naturalist",
      html: "<p>Hello Ikechukwu! This is a test email sent from the Gmail REST API integration.</p>",
      text: "Hello Ikechukwu! This is a test email sent from the Gmail REST API integration.",
    });
    console.log("Result:", res);
  } catch (e: any) {
    console.error("Failed to send:", e.message || e);
  }
}

main().catch(err => {
  console.error(err);
});
