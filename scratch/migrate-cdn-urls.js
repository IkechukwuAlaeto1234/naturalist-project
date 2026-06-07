const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env.local") });
const MONGODB_URI = process.env.MONGODB_URI;

function proxyCloudinaryUrl(url) {
  if (!url) return "";
  if (url.includes("res.cloudinary.com")) {
    const parts = url.split("res.cloudinary.com/");
    if (parts.length > 1) {
      const pathParts = parts[1].split("/");
      const remainingPath = pathParts.slice(1).join("/");
      return `/cdn/${remainingPath}`;
    }
  }
  return url;
}

mongoose.connect(MONGODB_URI).then(async () => {
  console.log("Connected to MongoDB");
  const db = mongoose.connection.db;
  const collection = db.collection("cdnimages");
  
  const images = await collection.find({}).toArray();
  console.log(`Total images in database: ${images.length}`);
  
  let updatedCount = 0;
  for (const img of images) {
    if (img.url && img.url.includes("res.cloudinary.com")) {
      const proxiedUrl = proxyCloudinaryUrl(img.url);
      console.log(`Updating ${img.originalName || img.publicId}:`);
      console.log(`  From: ${img.url}`);
      console.log(`  To:   ${proxiedUrl}`);
      
      await collection.updateOne(
        { _id: img._id },
        { $set: { url: proxiedUrl } }
      );
      updatedCount++;
    }
  }
  
  console.log(`Migration complete. Updated ${updatedCount} image records.`);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
