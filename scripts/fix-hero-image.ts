/**
 * fix-hero-image.ts
 * ─────────────────
 * One-time migration: clears the bad /cdn/hero-banner.jpg path that was
 * seeded into the `home` Content document and replaces it with a working
 * Cloudinary fetch URL so the homepage hero displays correctly.
 *
 * Run:  npx tsx scripts/fix-hero-image.ts
 */

import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not set in .env.local");
  process.exit(1);
}

// The real hero banner already uploaded to Cloudinary via the CDN proxy
const WORKING_HERO_IMAGE =
  "/cdn/image/upload/v1780528756/naturalist/pages/kbijaiehbkyygbashfrw.jpg";

async function main() {
  console.log("🔌  Connecting to MongoDB…");
  await mongoose.connect(MONGODB_URI as string);
  console.log("✅  Connected.\n");

  const db = mongoose.connection.db!;
  const collection = db.collection("contents");

  // Find the current home document
  const doc = await collection.findOne({ key: "home" });
  if (!doc) {
    console.warn("⚠️   No 'home' content document found. Nothing to fix.");
    await mongoose.disconnect();
    return;
  }

  const currentHeroImage = doc.metadata?.heroImage ?? "(not set)";
  console.log(`🔍  Current heroImage: "${currentHeroImage}"`);

  const isBroken =
    !currentHeroImage ||
    currentHeroImage === "/cdn/hero-banner.jpg" ||
    (currentHeroImage.startsWith("/cdn/") &&
      !currentHeroImage.includes("/image/upload/") &&
      !currentHeroImage.includes("/image/fetch/"));

  if (!isBroken) {
    console.log("✅  heroImage looks valid — no fix needed.");
    await mongoose.disconnect();
    return;
  }

  // Patch the metadata
  const result = await collection.updateOne(
    { key: "home" },
    {
      $set: {
        "metadata.heroImage": WORKING_HERO_IMAGE,
        updatedAt: new Date(),
      },
    }
  );

  if (result.modifiedCount === 1) {
    console.log(`\n✅  Fixed!`);
    console.log(`   Old: "${currentHeroImage}"`);
    console.log(`   New: "${WORKING_HERO_IMAGE}"\n`);
    console.log("💡  Tip: You can replace this image permanently by going to");
    console.log("         Admin → Pages → Home → Hero Image → Upload.");
  } else {
    console.warn("⚠️   Update matched but modified 0 documents. Check manually.");
  }

  await mongoose.disconnect();
  console.log("🔌  Disconnected. Done.");
}

main().catch((err) => {
  console.error("❌  Script failed:", err);
  mongoose.disconnect();
  process.exit(1);
});
