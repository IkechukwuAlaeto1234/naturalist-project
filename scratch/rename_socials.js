const fs = require('fs');
const path = require('path');
const brandDir = path.join(__dirname, '..', 'public', 'brand');
const mapping = {
  'icons8-facebook-96.png': 'social_facebook.png',
  'icons8-instagram-96.png': 'social_instagram.png',
  'icons8-linkedin-96.png': 'social_linkedin.png',
  'icons8-tiktok-96.png': 'social_tiktok.png',
  'icons8-whatsapp-96.png': 'social_whatsapp.png',
  'icons8-x-96.png': 'social_x.png',
  'icons8-youtube-96.png': 'social_youtube.png',
};
for (const [src, dest] of Object.entries(mapping)) {
  const srcPath = path.join(brandDir, src);
  const destPath = path.join(brandDir, dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${src} to ${dest}`);
  } else {
    console.log(`Source not found: ${srcPath}`);
  }
}
