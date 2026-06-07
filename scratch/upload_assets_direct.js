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

const headerPath = 'c:/Users/user/Downloads/naturalist-project/public/brand/unsubscribe_header.png';
const buttonPath = 'c:/Users/user/Downloads/naturalist-project/public/brand/unsubscribe_button.png';

async function upload() {
  try {
    console.log('Uploading unsubscribe_header.png to Cloudinary...');
    const headerResult = await cloudinary.uploader.upload(headerPath, {
      folder: 'brand',
      public_id: 'unsubscribe_header',
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });
    console.log('Header uploaded successfully!');
    console.log('Header URL:', headerResult.secure_url);

    console.log('Uploading unsubscribe_button.png to Cloudinary...');
    const buttonResult = await cloudinary.uploader.upload(buttonPath, {
      folder: 'brand',
      public_id: 'unsubscribe_button',
      overwrite: true,
      invalidate: true,
      resource_type: 'image',
    });
    console.log('Button uploaded successfully!');
    console.log('Button URL:', buttonResult.secure_url);

    process.exit(0);
  } catch (e) {
    console.error('Upload failed:', e);
    process.exit(1);
  }
}

upload();
