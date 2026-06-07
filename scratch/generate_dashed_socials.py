import os
import sys
import math
import urllib.request
import io
from PIL import Image, ImageDraw

def line_points(xa, ya, xb, yb):
    pts = []
    dx = xb - xa
    dy = yb - ya
    length = math.sqrt(dx*dx + dy*dy)
    if length == 0:
        return [(xa, ya)]
    steps = int(length)
    for i in range(steps + 1):
        t = i / steps
        pts.append((xa + t * dx, ya + t * dy))
    return pts

def arc_points(cx, cy, r, start_deg, end_deg):
    pts = []
    diff = end_deg - start_deg
    arc_len = r * abs(diff) * math.pi / 180.0
    if arc_len == 0:
        return []
    steps = int(arc_len)
    for i in range(steps + 1):
        t = i / steps
        deg = start_deg + t * diff
        rad = deg * math.pi / 180.0
        pts.append((cx + r * math.cos(rad), cy + r * math.sin(rad)))
    return pts

def get_rounded_rect_points(x1, y1, x2, y2, r):
    points = []
    # 1. Top line
    points.extend(line_points(x1 + r, y1, x2 - r, y1))
    # 2. Top-right arc (270 to 360 degrees)
    points.extend(arc_points(x2 - r, y1 + r, r, 270, 360))
    # 3. Right line
    points.extend(line_points(x2, y1 + r, x2, y2 - r))
    # 4. Bottom-right arc (0 to 90 degrees)
    points.extend(arc_points(x2 - r, y2 - r, r, 0, 90))
    # 5. Bottom line
    points.extend(line_points(x2 - r, y2, x1 + r, y2))
    # 6. Bottom-left arc (90 to 180 degrees)
    points.extend(arc_points(x1 + r, y2 - r, r, 90, 180))
    # 7. Left line
    points.extend(line_points(x1, y2 - r, x1, y1 + r))
    # 8. Top-left arc (180 to 270 degrees)
    points.extend(arc_points(x1 + r, y1 + r, r, 180, 270))
    return points

def draw_dashed_points(draw, points, color, width, dash_len=8, gap_len=6):
    cycle = dash_len + gap_len
    for i, pt in enumerate(points):
        if (i % cycle) < dash_len:
            x, y = pt
            draw.ellipse([x - width/2, y - width/2, x + width/2, y + width/2], fill=color)

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.abspath(os.path.join(script_dir, '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)

    # Icons to download and process
    icons = [
        ('social_instagram.png', 'https://img.icons8.com/ios-filled/120/000000/instagram-new.png', 'https://img.icons8.com/ios-filled/120/000000/instagram.png'),
        ('social_x.png', 'https://img.icons8.com/ios-filled/120/000000/twitterx.png', 'https://img.icons8.com/ios-filled/120/000000/twitter.png'),
        ('social_linkedin.png', 'https://img.icons8.com/ios-filled/120/000000/linkedin.png', None),
        ('social_youtube.png', 'https://img.icons8.com/ios-filled/120/000000/youtube-play.png', None),
        ('social_facebook.png', 'https://img.icons8.com/ios-filled/120/000000/facebook-f.png', 'https://img.icons8.com/ios-filled/120/000000/facebook.png'),
        ('social_whatsapp.png', 'https://img.icons8.com/ios-filled/120/000000/whatsapp.png', None),
        ('social_tiktok.png', 'https://img.icons8.com/ios-filled/120/000000/tiktok.png', None)
    ]

    brand_green = (45, 76, 56, 255)  # #2d4c38
    brand_gold = (176, 126, 58, 255)  # #b07e3a
    transparent = (0, 0, 0, 0)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }

    print("Fetching and designing brand social media icons...")

    for filename, url, fallback_url in icons:
        print(f"Processing {filename}...")
        img_data = None
        
        # Try primary URL
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req) as response:
                img_data = response.read()
        except Exception as e:
            print(f"  Primary URL failed: {url} ({e})")
            if fallback_url:
                try:
                    print(f"  Trying fallback URL: {fallback_url}...")
                    req = urllib.request.Request(fallback_url, headers=headers)
                    with urllib.request.urlopen(req) as response:
                        img_data = response.read()
                except Exception as e_fb:
                    print(f"  Fallback URL also failed: {e_fb}")
        
        if not img_data:
            print(f"  Error: Could not retrieve icon for {filename}. Skipping.")
            continue
            
        try:
            # Load the icon image
            icon_img = Image.open(io.BytesIO(img_data)).convert("RGBA")
            
            # Tint icon to brand green
            # We create a solid brand green mask using the original alpha channel
            tinted_icon = Image.new("RGBA", icon_img.size, brand_green)
            icon_final = Image.composite(tinted_icon, Image.new("RGBA", icon_img.size, transparent), icon_img.split()[3])
            
            # Create a 256x256 canvas for the final icon
            canvas_size = 256
            final_img = Image.new("RGBA", (canvas_size, canvas_size), transparent)
            draw = ImageDraw.Draw(final_img)
            
            # Draw the dashed rounded rectangle frame
            # Outer padding: x1=20, y1=20, x2=236, y2=236
            # Border width = 4, radius = 56
            points = get_rounded_rect_points(24, 24, 232, 232, 52)
            draw_dashed_points(draw, points, brand_gold, width=4, dash_len=14, gap_len=8)
            
            # Paste the icon in the center of the canvas
            # Center of 256x256 is 128. Icon size is 120x120.
            # Offset = (256 - 120) / 2 = 68
            icon_w, icon_h = icon_final.size
            offset_x = (canvas_size - icon_w) // 2
            offset_y = (canvas_size - icon_h) // 2
            
            final_img.paste(icon_final, (offset_x, offset_y), icon_final)
            
            # Save the result
            save_path = os.path.join(output_dir, filename)
            final_img.save(save_path, "PNG")
            print(f"  Successfully saved styled icon: {filename}")
            
        except Exception as err:
            print(f"  Failed to process {filename}: {err}")

    print("\nSocial icons generation complete!")

if __name__ == '__main__':
    main()
