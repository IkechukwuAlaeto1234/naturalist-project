#!/usr/bin/env python3
"""
generate_og_image.py
--------------------
Generates public/og-default.jpg using the project's own Host Grotesk
fonts (already stored base64-encoded in lib/hostGroteskFontData.ts).

Usage (run from the project root):
    pip install pillow
    python generate_og_image.py

Output: public/og-default.jpg  (1200 × 630 px, ~70-100 KB)
"""

import base64
import math
import os
import re
import tempfile
from pathlib import Path

# ── Dependency check ─────────────────────────────────────────────────────────
try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    raise SystemExit("Pillow is not installed. Run:  pip install pillow")

# ── 1. Extract font TTF bytes from the TypeScript source ─────────────────────
TS_FILE = Path("lib/hostGroteskFontData.ts")
if not TS_FILE.exists():
    raise SystemExit(f"Cannot find {TS_FILE}. Run from the project root.")

src = TS_FILE.read_text(encoding="utf-8")

def extract_font(src: str, var_name: str) -> bytes:
    """Pull the base64 string for a given export const name."""
    # The value is a very long single-quoted string on one line
    pattern = rf'export const {var_name}\s*=\s*"([^"]+)"'
    m = re.search(pattern, src)
    if not m:
        raise ValueError(f"Could not find {var_name} in {TS_FILE}")
    return base64.b64decode(m.group(1))

print("Extracting fonts from hostGroteskFontData.ts …")
regular_bytes = extract_font(src, "FONT_REGULAR")
bold_bytes    = extract_font(src, "FONT_BOLD")
print(f"  Regular: {len(regular_bytes):,} bytes")
print(f"  Bold:    {len(bold_bytes):,} bytes")

# Write to a temp dir so PIL can load them by path
tmp = Path(tempfile.mkdtemp())
regular_ttf = tmp / "HostGrotesk-Regular.ttf"
bold_ttf    = tmp / "HostGrotesk-Bold.ttf"
regular_ttf.write_bytes(regular_bytes)
bold_ttf.write_bytes(bold_bytes)

# ── 2. Build the 1200 × 630 card ─────────────────────────────────────────────
W, H   = 1200, 630
BG     = ( 26,  46,  31)   # #1a2e1f — deep forest green
ACCENT = (176, 126,  58)   # #b07e3a — gold
IVORY  = (252, 251, 250)   # #fcfbfa — warm off-white
MUTED  = (163, 178, 169)   # #a3b2a9 — muted sage
BORDER = ( 55,  75,  60)   # subtle green border

img  = Image.new("RGB", (W, H), BG)

# ── Radial vignette (darker edges) ───────────────────────────────────────────
vig   = Image.new("RGBA", (W, H), (0, 0, 0, 0))
vd    = ImageDraw.Draw(vig)
cx, cy, max_r, steps = W // 2, H // 2, math.hypot(W // 2, H // 2), 55
for i in range(steps, 0, -1):
    r     = int(max_r * i / steps)
    alpha = int(72 * (1 - i / steps))
    vd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(0, 0, 0, alpha))
img = Image.alpha_composite(img.convert("RGBA"), vig).convert("RGB")

draw = ImageDraw.Draw(img)

# ── Thin border frame ─────────────────────────────────────────────────────────
MARGIN = 20
draw.rectangle([MARGIN, MARGIN, W - MARGIN, H - MARGIN], outline=BORDER, width=1)

# ── Gold accent dot (top-left corner) ────────────────────────────────────────
draw.ellipse([62, 56, 78, 72], fill=ACCENT)

# ── Load fonts ────────────────────────────────────────────────────────────────
BRAND_SIZE   = 74
TAGLINE_SIZE = 26
DOMAIN_SIZE  = 19

font_brand_b  = ImageFont.truetype(str(bold_ttf),    BRAND_SIZE)
font_dot_b    = ImageFont.truetype(str(bold_ttf),    BRAND_SIZE)
font_tagline  = ImageFont.truetype(str(regular_ttf), TAGLINE_SIZE)
font_domain   = ImageFont.truetype(str(regular_ttf), DOMAIN_SIZE)

# ── "Naturalist." (word in ivory, period in gold) ────────────────────────────
word      = "Naturalist"
period    = "."
b_word    = draw.textbbox((0, 0), word,   font=font_brand_b)
b_period  = draw.textbbox((0, 0), period, font=font_dot_b)
w_word    = b_word[2]   - b_word[0]
w_period  = b_period[2] - b_period[0]
h_word    = b_word[3]   - b_word[1]
total_w   = w_word + w_period

brand_x = (W - total_w) // 2
brand_y = H // 2 - h_word // 2 - 55     # sit just above centre

draw.text((brand_x,           brand_y), word,   fill=IVORY,  font=font_brand_b)
draw.text((brand_x + w_word,  brand_y), period, fill=ACCENT, font=font_dot_b)

# ── Thin gold rule under the wordmark ────────────────────────────────────────
rule_y = brand_y + h_word + 28
draw.rectangle([80, rule_y, W - 80, rule_y + 1], fill=ACCENT)

# ── Tagline ───────────────────────────────────────────────────────────────────
tagline  = "Premium Organic Skincare & Wellness"
b_tag    = draw.textbbox((0, 0), tagline, font=font_tagline)
tag_y    = rule_y + 20
draw.text(((W - (b_tag[2] - b_tag[0])) // 2, tag_y), tagline, fill=MUTED, font=font_tagline)

# ── Domain badge at bottom ───────────────────────────────────────────────────
domain   = "naturalist-project.onrender.com"
b_dom    = draw.textbbox((0, 0), domain, font=font_domain)
dom_y    = H - 50
draw.text(((W - (b_dom[2] - b_dom[0])) // 2, dom_y), domain, fill=ACCENT, font=font_domain)

# ── 3. Save ───────────────────────────────────────────────────────────────────
out_path = Path("public/og-default.jpg")
out_path.parent.mkdir(parents=True, exist_ok=True)
img.save(str(out_path), "JPEG", quality=92, optimize=True)

size_kb = out_path.stat().st_size // 1024
print(f"\n✓ Saved: {out_path}  ({W}×{H}px, {size_kb} KB)")
print("  → Commit this file and deploy. Telegram will show it as the OG image.")

# ── Cleanup temp font files ───────────────────────────────────────────────────
regular_ttf.unlink(missing_ok=True)
bold_ttf.unlink(missing_ok=True)
try:
    tmp.rmdir()
except OSError:
    pass
