const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  const db = mongoose.connection.db;
  const content = await db.collection("contents").findOne({ key: "home" });
  console.log("home content:", JSON.stringify(content, null, 2));
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
