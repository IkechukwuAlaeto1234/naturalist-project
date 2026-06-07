const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Error: Cloudinary credentials missing in .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Inline schemas to avoid Next.js import problems
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

const brandDir = path.join(__dirname, '..', 'public', 'brand');
const emailDir = path.join(__dirname, '..', 'public', 'email');

const brandFiles = [
  'verify_email_header.png',
  'reset_password_header.png',
  'welcome_header.png',
  'confirm_order_header.png',
  'order_shipped_header.png',
  'password_success_header.png',
  'security_alert_header.png',
  'legal_update_header.png',
  'social_instagram.png',
  'social_x.png',
  'social_linkedin.png',
  'social_youtube.png',
  'social_facebook.png',
  'social_tiktok.png',
  'social_whatsapp.png',
  'logo_dark.png',
  'logo_green.png',
  'logo_oatmeal.png',
  'logo_transparent.png',
  'logo_transparent_white.png',
  'logo_white.png'
];

const emailFiles = [
  'Colorful blobs.jpg',
  'Earth tone flat vector illustration.jpg',
  'Illustration of package shipping tracking.jpg',
  'Piratage de LastPass _ quand les gestionnaires de mots de passe se tirent dans les pattes.jpg',
  'Plant Gifts for Delivery _ Plant Gift Baskets _ 1800Flowers.jpg',
  'Task management and planner organizing illustration in Education Paper Cut style download in PNG, SVG.jpg',
  'Web illustrations - Alex Kulieshov.jpg',
  'btanical.jpg',
  'chat.jpg',
  'colored.jpg',
  'newsletter.jpg',
  'password has been reset successfully concept illustration flat design vector eps10_ modern graphic element for landing page, empty state ui, infographic, icon.jpg'
];

async function uploadAndRegister() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI missing in .env.local");
    return;
  }
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected.");

  try {
    const adminEmail = process.env.ADMIN_EMAIL || "ikechukwualaeto@gmail.com";
    const admin = await User.findOne({ email: adminEmail.toLowerCase().trim() });
    if (!admin) {
      console.error(`Error: Admin user with email ${adminEmail} not found.`);
      await mongoose.disconnect();
      return;
    }
    console.log(`Using admin user: ${admin.name} (${admin._id})`);

    const results = {};

    // 1. Upload Brand Files (Headers & Socials)
    console.log("\n--- Uploading brand assets (headers/socials) ---");
    for (const file of brandFiles) {
      const filePath = path.join(brandDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found at ${filePath}`);
        continue;
      }

      const publicId = path.basename(file, path.extname(file));
      const sizeBytes = fs.statSync(filePath).size;
      console.log(`Uploading ${file} to 'brand/' folder...`);

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          folder: 'brand',
          overwrite: true,
          resource_type: 'image'
        });

        console.log(`  Success! URL: ${result.secure_url}`);
        results[file] = result.secure_url;

        // Register in DB
        await CdnImage.findOneAndUpdate(
          { publicId: result.public_id },
          {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file,
            sizeBytes: sizeBytes,
            uploadedBy: admin._id
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`  Failed to upload ${file}:`, err);
      }
    }

    // 2. Upload Email Illustrations
    console.log("\n--- Uploading email illustrations ---");
    for (const file of emailFiles) {
      const filePath = path.join(emailDir, file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Warning: File not found at ${filePath}`);
        continue;
      }

      const publicId = path.basename(file, path.extname(file))
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .toLowerCase()
        .substring(0, 50); // Clean up filename for Cloudinary public ID
      
      const sizeBytes = fs.statSync(filePath).size;
      console.log(`Uploading ${file} to 'email/' folder...`);

      try {
        const result = await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          folder: 'email',
          overwrite: true,
          resource_type: 'image'
        });

        console.log(`  Success! URL: ${result.secure_url}`);
        results[file] = result.secure_url;

        // Register in DB
        await CdnImage.findOneAndUpdate(
          { publicId: result.public_id },
          {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file,
            sizeBytes: sizeBytes,
            uploadedBy: admin._id
          },
          { upsert: true, new: true }
        );
      } catch (err) {
        console.error(`  Failed to upload ${file}:`, err);
      }
    }

    const resultsPath = path.join(__dirname, 'email_assets_results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n=== Asset Upload & Registration Complete! Results saved to ${resultsPath} ===`);

  } catch (err) {
    console.error("Upload & registration failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

uploadAndRegister();
