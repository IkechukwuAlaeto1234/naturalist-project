import os
import sys
import base64
import re
import io
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_data_path = os.path.abspath(os.path.join(script_dir, '..', 'lib', 'hostGroteskFontData.ts'))
    
    print("Reading Host Grotesk font data...")
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
    gold = (176, 126, 58, 255)            # #b07e3a
    white = (255, 255, 255, 255)          # #ffffff
    oatmeal = (250, 249, 245, 255)        # #faf9f5
    soft_grey = (244, 239, 230, 255)      # #f4efe6 (pill background color)
    transparent = (0, 0, 0, 0)
    
    output_dir = os.path.abspath(os.path.join(script_dir, '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)
    
    # Buttons definition: (filename, text, bg_color, text_color)
    buttons = [
        # Primary Buttons (Solid)
        ('shop_collection_btn.png', 'Shop Collection', forest_green, oatmeal),
        ('track_shipment_btn.png', 'Track Shipment', forest_green, oatmeal),
        ('security_panel_btn.png', 'Go to Security Panel', forest_green, oatmeal),
        ('change_password_btn.png', 'Change Password', gold, oatmeal),
        ('view_documents_btn.png', 'View Full Documents', forest_green, oatmeal),
        
        # Secondary Buttons (Soft Contrast)
        ('browse_sellers_sec_btn.png', 'Browse Best Sellers', soft_grey, forest_green),
        ('contact_support_sec_btn.png', 'Contact Support', soft_grey, forest_green),
        ('secure_account_sec_btn.png', 'Review Account Activity', soft_grey, forest_green)
    ]
    
    font_size = 13  # Clean premium uppercase size
    font = ImageFont.truetype(font_file, font_size)
    
    print("Generating high-fidelity button PNGs using Host Grotesk Bold...")
    for filename, text, bg_color, text_color in buttons:
        temp_img = Image.new('RGBA', (1000, 100), transparent)
        temp_draw = ImageDraw.Draw(temp_img)
        
        # Upper case text for premium brand aesthetic
        display_text = text.upper()
        
        # Calculate width character-by-character including tracking
        tracking = 2.0  # spacing
        total_text_w = 0
        char_widths = []
        
        for char in display_text:
            char_w = temp_draw.textlength(char, font=font)
            char_widths.append(char_w)
            total_text_w += char_w
            
        total_text_w += tracking * (len(display_text) - 1)
        
        # Measure text height
        bbox = temp_draw.textbbox((0, 0), display_text, font=font)
        text_h = bbox[3] - bbox[1]
        
        # Calculate button dimensions
        padding_x = 32
        padding_y = 14
        btn_w = int(total_text_w) + (2 * padding_x)
        btn_h = 46  # Elegant height
        
        # Create image with padding for shadow
        shadow_padding = 8
        img_w = btn_w + (2 * shadow_padding)
        img_h = btn_h + (2 * shadow_padding)
        
        img = Image.new('RGBA', (img_w, img_h), transparent)
        
        # ── Draw Shadow (Only for primary buttons) ───────────────────────────
        is_primary = bg_color != soft_grey
        if is_primary:
            shadow_mask = Image.new('L', (btn_w, btn_h), 0)
            shadow_draw = ImageDraw.Draw(shadow_mask)
            shadow_draw.rounded_rectangle([0, 0, btn_w, btn_h], radius=23, fill=30)  # opacity 30
            
            shadow_layer = Image.new('RGBA', (img_w, img_h), transparent)
            shadow_layer.paste((0, 0, 0, 255), (shadow_padding, shadow_padding + 2), mask=shadow_mask)  # slightly offset down
            blurred_shadow = shadow_layer.filter(ImageFilter.GaussianBlur(3))
            
            img.alpha_composite(blurred_shadow)
        
        # ── Draw Button Body ────────────────────────────────────────────────
        btn_layer = Image.new('RGBA', (img_w, img_h), transparent)
        btn_draw = ImageDraw.Draw(btn_layer)
        
        btn_x0 = shadow_padding
        btn_y0 = shadow_padding
        btn_x1 = shadow_padding + btn_w
        btn_y1 = shadow_padding + btn_h
        
        btn_draw.rounded_rectangle([btn_x0, btn_y0, btn_x1, btn_y1], radius=23, fill=bg_color)
        
        # Draw Text centered (Corrected math: total_text_w offsets correctly)
        inner_text_x = btn_x0 + (btn_w - total_text_w) / 2
        inner_text_y = btn_y0 + (btn_h - text_h) / 2 - bbox[1]  # vertical alignment adjust
        
        # Draw characters with tracking
        curr_x = inner_text_x
        for char in display_text:
            btn_draw.text((curr_x, inner_text_y), char, fill=text_color, font=font)
            char_w = btn_draw.textlength(char, font=font)
            curr_x += char_w + tracking
            
        img.alpha_composite(btn_layer)
        
        # Save output
        img.save(os.path.join(output_dir, filename), 'PNG')
        print(f"  Saved button: {filename} -> '{text}'")
        
    print("\nAll button assets generated successfully!")

if __name__ == '__main__':
    main()
