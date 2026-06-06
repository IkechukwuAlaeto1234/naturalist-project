const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// We define simple inline schemas for this task to avoid Next.js alias resolution issues
const userSchema = new mongoose.Schema({
  email: String,
  name: String
}, { collection: "users" });

const cdnImageSchema = new mongoose.Schema({
  url: String,
  publicId: String,
  originalName: String,
  sizeBytes: Number,
  uploadedBy: mongoose.Types.ObjectId
}, { collection: "cdnimages", timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const CdnImage = mongoose.models.CdnImage || mongoose.model('CdnImage', cdnImageSchema);

async function registerLogos() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI missing in .env.local");
    return;
  }
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");
  
  try {
    // 1. Find the admin user
    const adminEmail = process.env.ADMIN_EMAIL || "ikechukwualaeto@gmail.com";
    const admin = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (!admin) {
      console.error(`Error: Admin user with email ${adminEmail} not found in database.`);
      await mongoose.disconnect();
      return;
    }
    console.log(`Found admin user: ${admin.name} (${admin._id})`);
    
    // 2. Read upload results
    const resultsPath = path.join(__dirname, 'upload_all_results.json');
    if (!fs.existsSync(resultsPath)) {
      console.error(`Error: Upload results file not found at ${resultsPath}`);
      await mongoose.disconnect();
      return;
    }
    
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
    const brandDir = path.join(__dirname, '..', 'public', 'brand');
    
    // 3. Register each logo in the database
    for (const [filename, info] of Object.entries(results)) {
      const filePath = path.join(brandDir, filename);
      let sizeBytes = 0;
      if (fs.existsSync(filePath)) {
        sizeBytes = fs.statSync(filePath).size;
      }
      
      console.log(`Registering ${filename} in CdnImage collection...`);
      
      // Update if already exists with same publicId, or insert new
      const doc = await CdnImage.findOneAndUpdate(
        { publicId: info.public_id },
        {
          url: info.secure_url,
          publicId: info.public_id,
          originalName: filename,
          sizeBytes: sizeBytes,
          uploadedBy: admin._id
        },
        { upsert: true, new: true }
      );
      
      console.log(`  Registered ID: ${doc._id}`);
    }
    
    console.log("\n=== Database registration complete! All logos are now visible in the Admin CDN dashboard ===");
  } catch (err) {
    console.error("Database registration failed:", err);
  } finally {
    await mongoose.disconnect();
  }
}

registerLogos();
