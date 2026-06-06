import os
import sys
import base64
import re
import io
from PIL import Image, ImageDraw, ImageFont

def main():
    # Read TypeScript font data file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    font_data_path = os.path.abspath(os.path.join(script_dir, '..', 'lib', 'hostGroteskFontData.ts'))
    
    with open(font_data_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Extract bold base64 data
    bold_match = re.search(r'export const FONT_BOLD\s*=\s*"([^"]+)"', content)
    if not bold_match:
        raise ValueError("Could not find FONT_BOLD in hostGroteskFontData.ts")
    font_base64 = bold_match.group(1)
    
    # Colors
    forest_green = (45, 76, 56, 255)      # #2d4c38
    gold = (176, 126, 58, 255)            # #b07e3a
    oatmeal = (244, 239, 230, 255)        # #f4efe6
    white = (255, 255, 255, 255)          # #ffffff
    midnight_green = (15, 20, 17, 255)     # #0f1411
    transparent = (0, 0, 0, 0)
    
    # Decode font
    font_bytes = base64.b64decode(font_base64)
    font_file = io.BytesIO(font_bytes)
    
    font_size = 96
    font = ImageFont.truetype(font_file, font_size)
    
    # Text parts
    text_main = "Naturalist"
    text_dot = "."
    
    # Draw temp image to measure size
    temp_img = Image.new('RGBA', (2000, 500), transparent)
    temp_draw = ImageDraw.Draw(temp_img)
    
    # Measure widths
    main_width = temp_draw.textlength(text_main, font=font)
    dot_width = temp_draw.textlength(text_dot, font=font)
    total_width = int(main_width + dot_width)
    
    # Measure heights
    bbox_main = temp_draw.textbbox((0, 0), text_main, font=font)
    bbox_dot = temp_draw.textbbox((0, 0), text_dot, font=font)
    
    # Total text bounding box height
    text_height = max(bbox_main[3], bbox_dot[3]) - min(bbox_main[1], bbox_dot[1])
    
    # Padding
    padding_x = 60
    padding_y = 35
    
    img_width = total_width + 2 * padding_x
    img_height = text_height + 2 * padding_y
    
    # Adjust for base line alignment
    offset_y = padding_y - min(bbox_main[1], bbox_dot[1])
    
    logo_variants = [
        # (filename, background_color, text_color, dot_color)
        ('logo_transparent.png', transparent, forest_green, gold),
        ('logo_transparent_white.png', transparent, white, gold),
        ('logo_green.png', forest_green, white, gold),
        ('logo_oatmeal.png', oatmeal, forest_green, gold),
        ('logo_dark.png', midnight_green, white, gold),
        ('logo_white.png', white, forest_green, gold),
    ]
    
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Generating brand logos in: {output_dir}")
    print(f"Canvas size: {img_width}x{img_height}, Text width: {total_width}, Text height: {text_height}")
    
    for filename, bg_color, txt_color, dot_col in logo_variants:
        # Create image
        img = Image.new('RGBA', (img_width, img_height), bg_color)
        draw = ImageDraw.Draw(img)
        
        # Position text
        x_main = padding_x
        y_text = offset_y
        
        # Draw main text
        draw.text((x_main, y_text), text_main, fill=txt_color, font=font)
        
        # Draw dot
        x_dot = x_main + main_width
        draw.text((x_dot, y_text), text_dot, fill=dot_col, font=font)
        
        # Save image
        filepath = os.path.join(output_dir, filename)
        img.save(filepath, 'PNG')
        print(f"  Saved {filename}")
        
    print("Logo generation complete!")

if __name__ == '__main__':
    main()
