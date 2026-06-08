import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const { connectToDatabase } = await import("../lib/db");
  const { Contact } = await import("../models/Contact");

  await connectToDatabase();
  console.log("Connected to database.");
  const contact = await Contact.findById("6a244a117667e2fbcb32755b");
  if (contact) {
    console.log("Contact found:", contact);
  } else {
    console.log("Contact NOT found in database.");
    // Let's count total contacts
    const count = await Contact.countDocuments();
    console.log("Total contact inquiries in database:", count);
  }
  process.exit(0);
}

main().catch(console.error);
