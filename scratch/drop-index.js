const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found");
    return;
  }
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected. Dropping page_1 index from contents collection...");
  try {
    await mongoose.connection.collection("contents").dropIndex("page_1");
    console.log("Successfully dropped page_1 index!");
  } catch (err) {
    console.error("Failed to drop index (it might not exist):", err.message);
  }
  await mongoose.disconnect();
}
run();
