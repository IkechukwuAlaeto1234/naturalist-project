const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  const db = mongoose.connection.db;
  const images = await db.collection("cdnimages").find({}).toArray();
  console.log("Registered CDN Images count:", images.length);
  console.log("Images:");
  images.forEach(img => {
    console.log(`- ${img.originalName} (${img.publicId}): ${img.url}`);
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
