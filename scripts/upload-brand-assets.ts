import * as fs from "fs";
import * as path from "path";
import { v2 as cloudinary } from "cloudinary";
import * as dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

// Validate Cloudinary credentials
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.error("Error: Cloudinary environment variables are missing in .env.local");
  console.error("Please ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set.");
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

const brandDir = path.join(process.cwd(), "public", "brand");

async function uploadFile(filePath: string) {
  const filename = path.basename(filePath);
  const ext = path.extname(filename);
  const publicId = path.basename(filename, ext);

  console.log(`Uploading ${filename} to Cloudinary (public_id: brand/${publicId})...`);

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "brand",
      public_id: publicId,
      overwrite: true,
      invalidate: true,
      resource_type: "image",
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://naturalist-project.onrender.com";
    const cleanAppUrl = appUrl.includes("localhost") ? "https://naturalist-project.onrender.com" : appUrl;
    
    // Strip Cloudinary origin and cloud name from URL to format local CDN proxy URL
    const cloudName = CLOUDINARY_CLOUD_NAME || "dtpwhaxvh";
    const relativePath = result.secure_url.replace(
      new RegExp(`https://res\\.cloudinary\\.com/${cloudName}`),
      ""
    );
    const cdnUrl = `${cleanAppUrl}/cdn${relativePath}`;

    console.log(`\x1b[32m✓ Successfully uploaded ${filename}!\x1b[0m`);
    console.log(`  Cloudinary URL: ${result.secure_url}`);
    console.log(`  Email Asset CDN URL: ${cdnUrl}`);
    console.log(`  Map in emails/assets.ts:`);
    console.log(`  \x1b[36m${toCamelCase(publicId)}: \`\${appUrl}/cdn${relativePath}\`\x1b[0m\n`);

    return { filename, cdnUrl, relativePath };
  } catch (error) {
    console.error(`\x1b[31m✗ Failed to upload ${filename}\x1b[0m`, error);
    throw error;
  }
}

function toCamelCase(str: string): string {
  return str.replace(/([-_][a-z])/ig, ($1) => {
    return $1.toUpperCase()
      .replace("-", "")
      .replace("_", "");
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  if (!fs.existsSync(brandDir)) {
    console.error(`Error: Brand assets directory not found at ${brandDir}`);
    process.exit(1);
  }

  if (args.length > 0) {
    // Upload specific files passed as arguments
    for (const filename of args) {
      const filePath = path.join(brandDir, filename);
      if (fs.existsSync(filePath)) {
        await uploadFile(filePath);
      } else {
        console.error(`Error: File not found in public/brand: ${filename}`);
      }
    }
  } else {
    // If no arguments, upload the default unsubscribe assets
    console.log("No specific file specified. Uploading default unsubscribe assets...");
    const defaultAssets = ["unsubscribe_header.png", "unsubscribe_button.png"];
    
    for (const filename of defaultAssets) {
      const filePath = path.join(brandDir, filename);
      if (fs.existsSync(filePath)) {
        await uploadFile(filePath);
      } else {
        console.error(`Warning: Default file not found: ${filename}`);
      }
    }
    
    console.log("Tip: You can upload any brand asset by passing its filename, e.g.:");
    console.log("  npx tsx scripts/upload-brand-assets.ts logo_transparent.png");
  }
}

main().catch((err) => {
  console.error("Script execution failed:", err);
  process.exit(1);
});
