const fs = require('fs');
const path = require('path');
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

const brandDir = path.join(__dirname, '..', 'public', 'brand');
const files = [
  'logo_transparent.png',
  'logo_transparent_white.png',
  'logo_green.png',
  'logo_oatmeal.png',
  'logo_dark.png',
  'logo_white.png'
];

async function uploadLogos() {
  const results = {};
  console.log("Uploading logo variations to Cloudinary...");
  
  for (const file of files) {
    const filePath = path.join(brandDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found at ${filePath}`);
      continue;
    }
    
    const publicId = path.basename(file, '.png');
    console.log(`Uploading ${file} as public_id: brand/${publicId}...`);
    
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        public_id: publicId,
        folder: 'brand',
        overwrite: true,
        resource_type: 'image'
      });
      
      console.log(`  Success! URL: ${result.secure_url}`);
      results[file] = {
        secure_url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height
      };
    } catch (err) {
      console.error(`  Failed to upload ${file}:`, err);
    }
  }
  
  const resultsPath = path.join(__dirname, 'upload_all_results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\n=== All uploads complete! Results saved to ${resultsPath} ===`);
}

uploadLogos();
