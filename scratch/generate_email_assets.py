import os
import sys
import base64
import re
import io
from PIL import Image, ImageDraw, ImageFont

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_data_path = os.path.abspath(os.path.join(script_dir, '..', 'lib', 'hostGroteskFontData.ts'))
    
    print("Reading font data...")
    with open(font_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract bold base64 data
    bold_match = re.search(r'export const FONT_BOLD\s*=\s*"([^"]+)"', content)
    if not bold_match:
        raise ValueError("Could not find FONT_BOLD in hostGroteskFontData.ts")
    font_base64 = bold_match.group(1)
    
    # Decode font
    font_bytes = base64.b64decode(font_base64)
    font_file = io.BytesIO(font_bytes)
    
    # Colors
    forest_green = (45, 76, 56, 255)      # #2d4c38
    white = (255, 255, 255, 255)          # #ffffff
    transparent = (0, 0, 0, 0)
    
    output_dir = os.path.abspath(os.path.join(script_dir, '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)
    
    # ── GENERATE TYPOGRAPHIC HEADERS ─────────────────────────────────────────
    headings = [
        ('verify_email_header.png', 'Verify your email address'),
        ('reset_password_header.png', 'Reset your password'),
        ('welcome_header.png', 'Welcome to Naturalist'),
        ('confirm_order_header.png', 'Confirm your order'),
        ('order_shipped_header.png', 'Your order has shipped'),
        ('password_success_header.png', 'Password updated successfully'),
        ('security_alert_header.png', 'Security Device Alert'),
        ('legal_update_header.png', 'Legal Document Updates')
    ]
    
    font_size = 48  # A clean, elegant title size
    font = ImageFont.truetype(font_file, font_size)
    
    print("Generating email typographic headers...")
    for filename, text in headings:
        # Measure size using a temporary image
        temp_img = Image.new('RGBA', (2000, 300), transparent)
        temp_draw = ImageDraw.Draw(temp_img)
        
        # Measure text boundaries
        width = temp_draw.textlength(text, font=font)
        bbox = temp_draw.textbbox((0, 0), text, font=font)
        
        text_w = int(width)
        text_h = bbox[3] - bbox[1]
        
        # Add padding
        padding_x = 24
        padding_y = 16
        
        img_w = text_w + (2 * padding_x)
        img_h = text_h + (2 * padding_y)
        
        # Draw final image
        img = Image.new('RGBA', (img_w, img_h), transparent)
        draw = ImageDraw.Draw(img)
        
        # Position offset to align baseline properly
        offset_y = padding_y - bbox[1]
        
        draw.text((padding_x, offset_y), text, fill=forest_green, font=font)
        
        img.save(os.path.join(output_dir, filename), 'PNG')
        print(f"  Saved header: {filename} -> '{text}'")

    print("\nAll headers generated successfully!")

if __name__ == '__main__':
    main()
