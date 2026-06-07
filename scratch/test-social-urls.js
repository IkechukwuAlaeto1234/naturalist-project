const https = require('https');

const urls = {
  instagram: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787291/brand/social_instagram.png',
  x: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787292/brand/social_x.png',
  linkedin: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787294/brand/social_linkedin.png',
  youtube: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787295/brand/social_youtube.png',
  facebook: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787296/brand/social_facebook.png',
  tiktok: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787298/brand/social_tiktok.png',
  whatsapp: 'https://res.cloudinary.com/dtpwhaxvh/image/upload/v1780787299/brand/social_whatsapp.png'
};

function checkUrl(name, url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      console.log(`- ${name}: status ${res.statusCode}, content-type: ${res.headers['content-type']}`);
      resolve();
    }).on('error', (e) => {
      console.error(`- ${name} error:`, e.message);
      resolve();
    });
  });
}

async function run() {
  console.log("Checking Cloudinary URLs...");
  for (const [name, url] of Object.entries(urls)) {
    await checkUrl(name, url);
  }
}

run();
