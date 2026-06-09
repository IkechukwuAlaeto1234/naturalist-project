import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set in .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  console.log("🔌 Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅ Connected.\n");

  const db = mongoose.connection.db!;
  const collection = db.collection("cdnimages");

  // Find all images where sizeBytes is 0, null, or undefined
  const images = await collection.find({
    $or: [
      { sizeBytes: { $exists: false } },
      { sizeBytes: null },
      { sizeBytes: 0 }
    ]
  }).toArray();

  console.log(`Found ${images.length} assets with missing/zero file size.`);

  for (const img of images) {
    if (!img.publicId) {
      console.log(`⚠️ Skipping image ${img.originalName} due to missing publicId`);
      continue;
    }
    
    console.log(`⏳ Fetching metadata for ${img.originalName} (ID: ${img.publicId})...`);
    try {
      const resource = await cloudinary.api.resource(img.publicId);
      if (resource && resource.bytes) {
        console.log(`   Fetched size: ${resource.bytes} bytes (${(resource.bytes / 1024).toFixed(2)} KB)`);
        await collection.updateOne(
          { _id: img._id },
          { $set: { sizeBytes: resource.bytes } }
        );
        console.log(`   ✅ Updated!`);
      } else {
        console.log(`   ⚠️ Could not find size for ${img.publicId} (response empty or missing bytes)`);
      }
    } catch (e: any) {
      console.error(`   ❌ Failed to query Cloudinary for ${img.publicId}:`, e.message || e);
    }
  }

  await mongoose.disconnect();
  console.log("\n🔌 Disconnected. Done.");
}

main().catch((err) => {
  console.error("❌ Script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
