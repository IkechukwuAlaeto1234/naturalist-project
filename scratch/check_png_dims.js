const fs = require('fs');

function getPngDimensions(filePath) {
  const buffer = fs.readFileSync(filePath);
  // PNG signature is 8 bytes. IHDR chunk starts at byte 12.
  // Width is 4 bytes starting at byte 16, Height is 4 bytes starting at byte 20.
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height };
}

try {
  console.log('unsubscribe_button.png:', getPngDimensions('c:/Users/user/Downloads/naturalist-project/public/brand/unsubscribe_button.png'));
} catch (e) {
  console.error('Error reading button:', e);
}

try {
  console.log('unsubscribe_header.png:', getPngDimensions('c:/Users/user/Downloads/naturalist-project/public/brand/unsubscribe_header.png'));
} catch (e) {
  console.error('Error reading header:', e);
}
