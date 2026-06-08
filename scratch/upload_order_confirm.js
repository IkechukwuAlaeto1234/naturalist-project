const path = require('path');
const dotenv = require('dotenv');
const { v2: cloudinary } = require('cloudinary');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const imagePath = 'c:/Users/user/Downloads/naturalist-project/public/email/An ecommerce concept of order confirm, flat illustration.jpg';

async function upload() {
  try {
    console.log('Uploading Order Confirmation Illustration to Cloudinary...');
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: 'email',
      public_id: 'an_ecommerce_concept_of_order_confirm_flat_illustration',
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });
    console.log('✓ Successfully uploaded!');
    console.log('Cloudinary URL:', result.secure_url);

    // Strip Cloudinary origin and cloud name from URL to format local CDN proxy URL
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dtpwhaxvh';
    const relativePath = result.secure_url.replace(
      new RegExp(`https://res\\.cloudinary\\.com/${cloudName}`),
      ''
    );
    console.log('Email Asset CDN URL snippet to put in emails/assets.ts:');
    console.log(`orderConfirmation: \`\${appUrl}/cdn${relativePath}\``);

    process.exit(0);
  } catch (e) {
    console.error('✗ Upload failed:', e);
    process.exit(1);
  }
}

upload();
