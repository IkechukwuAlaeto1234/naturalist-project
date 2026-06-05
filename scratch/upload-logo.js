const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });
const cloudinary = require('cloudinary').v2;

// Verify keys exist
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error("Error: Cloudinary credentials missing in .env.local");
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const localLogoPath = path.join(__dirname, '..', 'public', 'logo.png');

if (!fs.existsSync(localLogoPath)) {
  console.error(`Error: Local logo file not found at ${localLogoPath}`);
  process.exit(1);
}

console.log("Uploading logo to Cloudinary...");

cloudinary.uploader.upload(localLogoPath, {
  public_id: 'naturalist_logo',
  folder: 'brand',
  overwrite: true,
  resource_type: 'image'
})
.then(result => {
  console.log("=== UPLOAD SUCCESSFUL ===");
  console.log("Public URL:", result.secure_url);
  fs.writeFileSync(
    path.join(__dirname, 'upload_result.json'),
    JSON.stringify(result, null, 2)
  );
})
.catch(err => {
  console.error("=== UPLOAD FAILED ===");
  console.error(err);
});
