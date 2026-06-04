#!/usr/bin/env python3
"""
fix_jspdf_fonts.py
──────────────────
Fixes the jsPDF "No unicode cmap for font" error in naturalist-project.

Root cause: @fontsource ships SUBSET woff files — the converted TTF lacks the
            full cmap table jsPDF's registerTTF() requires. We must use the
            FULL TTF directly from Google Fonts.

What this script does:
  1. Installs requests + fonttools if not already installed
  2. Downloads the FULL Host Grotesk TTF from Google Fonts API
  3. Base64-encodes both weights
  4. Writes lib/hostGroteskFontData.ts
  5. Patches lib/generateLegalPDF.ts  (.woff → .ttf in registerFonts)
"""

import base64
import os
import subprocess
import sys
import tempfile
import urllib.request

PROJECT_ROOT   = os.path.dirname(os.path.abspath(__file__))
FONT_DATA_FILE = os.path.join(PROJECT_ROOT, "lib", "hostGroteskFontData.ts")
PDF_GEN_FILE   = os.path.join(PROJECT_ROOT, "lib", "generateLegalPDF.ts")

# Google Fonts CSS API — requests the full TTF (not subset)
# We parse the CSS to extract the actual .ttf download URL
GFONTS_CSS = {
    "regular": "https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@400",
    "bold":    "https://fonts.googleapis.com/css2?family=Host+Grotesk:wght@700",
}

# Fallback: direct bunny.net / fontsource TTF (full, not subset)
DIRECT_TTF_URLS = {
    "regular": "https://fonts.bunny.net/host-grotesk/files/host-grotesk-latin-400-normal.ttf",
    "bold":    "https://fonts.bunny.net/host-grotesk/files/host-grotesk-latin-700-normal.ttf",
}


def run(cmd):
    print(f"  $ {cmd}")
    subprocess.run(cmd, shell=True, check=True)


def ensure_deps():
    print("\n[1/4] Checking dependencies...")
    for pkg in ("fontTools", "requests"):
        try:
            __import__(pkg if pkg != "fontTools" else "fontTools.ttLib")
            print(f"  {pkg} already installed.")
        except ImportError:
            print(f"  Installing {pkg}...")
            run(f"{sys.executable} -m pip install {pkg.lower()} brotli --quiet")
    print("  OK")


def try_download_ttf_direct(tmpdir):
    """Download full TTF directly from bunny.net (fontsource mirror)."""
    import urllib.request
    paths = {}
    for name, url in DIRECT_TTF_URLS.items():
        dest = os.path.join(tmpdir, f"host-grotesk-{name}.ttf")
        print(f"  Downloading {name} TTF: {url}")
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = resp.read()
            with open(dest, "wb") as f:
                f.write(data)
            size = os.path.getsize(dest)
            print(f"  Saved → {dest}  ({size:,} bytes)")
            paths[name] = dest
        except Exception as e:
            print(f"  FAILED: {e}")
            return None
    return paths


def try_download_via_gfonts(tmpdir):
    """Download TTF via Google Fonts CSS API (parses the CSS for the ttf URL)."""
    import re
    import urllib.request
    paths = {}
    for name, css_url in GFONTS_CSS.items():
        try:
            req = urllib.request.Request(
                css_url,
                headers={"User-Agent": "Mozilla/5.0 (compatible; TTF-fetcher)"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                css = resp.read().decode("utf-8")
            ttf_urls = re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+\.ttf)\)", css)
            if not ttf_urls:
                print(f"  No TTF URL found in Google Fonts CSS for {name}")
                return None
            ttf_url = ttf_urls[0]
            dest = os.path.join(tmpdir, f"host-grotesk-{name}.ttf")
            print(f"  Downloading {name} TTF: {ttf_url}")
            req2 = urllib.request.Request(ttf_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req2, timeout=15) as resp2:
                data = resp2.read()
            with open(dest, "wb") as f:
                f.write(data)
            size = os.path.getsize(dest)
            print(f"  Saved → {dest}  ({size:,} bytes)")
            paths[name] = dest
        except Exception as e:
            print(f"  FAILED: {e}")
            return None
    return paths


def convert_woff_if_needed(ttf_paths, tmpdir):
    """
    Verify each TTF has a cmap table. If not (i.e. it's actually woff),
    convert it with fonttools.
    """
    from fontTools.ttLib import TTFont
    verified = {}
    for name, path in ttf_paths.items():
        try:
            font = TTFont(path)
            if "cmap" not in font:
                raise ValueError("No cmap table")
            # Re-save to ensure clean TTF
            out = os.path.join(tmpdir, f"clean-{name}.ttf")
            font.save(out)
            verified[name] = out
            print(f"  {name}: cmap OK → {out}")
        except Exception as e:
            print(f"  {name}: {e} — attempting woff→ttf conversion")
            font = TTFont(path)
            out = os.path.join(tmpdir, f"clean-{name}.ttf")
            font.save(out)
            verified[name] = out
            print(f"  {name}: converted → {out}")
    return verified


def encode_ttf(ttf_paths):
    print("\n[3/4] Base64-encoding TTF files...")
    encoded = {}
    for name, path in ttf_paths.items():
        with open(path, "rb") as f:
            data = base64.b64encode(f.read()).decode("ascii")
        size_kb = os.path.getsize(path) / 1024
        print(f"  {name}: {size_kb:.1f} KB → {len(data):,} chars base64")
        encoded[name] = data
    return encoded


def write_font_data(encoded):
    print("\n[4/4] Writing hostGroteskFontData.ts...")
    ts = (
        "// Auto-generated by fix_jspdf_fonts.py — do not edit manually.\n"
        "// Host Grotesk FULL TTF, base64-encoded, for jsPDF.\n"
        "// jsPDF requires a full TTF with unicode cmap — NOT a subset woff.\n"
        "\n"
        f'export const FONT_REGULAR = "{encoded["regular"]}";\n'
        "\n"
        f'export const FONT_BOLD = "{encoded["bold"]}";\n'
    )
    with open(FONT_DATA_FILE, "w", encoding="utf-8") as f:
        f.write(ts)
    size_kb = os.path.getsize(FONT_DATA_FILE) / 1024
    print(f"  Written: {FONT_DATA_FILE}  ({size_kb:.1f} KB)")


def patch_pdf_generator():
    with open(PDF_GEN_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    original = content

    replacements = [
        ('doc.addFileToVFS(`${FONT_NAME}-Regular.woff`, FONT_REGULAR);',
         'doc.addFileToVFS(`${FONT_NAME}-Regular.ttf`, FONT_REGULAR);'),
        ('doc.addFont(`${FONT_NAME}-Regular.woff`, FONT_NAME, "normal");',
         'doc.addFont(`${FONT_NAME}-Regular.ttf`, FONT_NAME, "normal");'),
        ('doc.addFileToVFS(`${FONT_NAME}-Bold.woff`, FONT_BOLD);',
         'doc.addFileToVFS(`${FONT_NAME}-Bold.ttf`, FONT_BOLD);'),
        ('doc.addFont(`${FONT_NAME}-Bold.woff`, FONT_NAME, "bold");',
         'doc.addFont(`${FONT_NAME}-Bold.ttf`, FONT_NAME, "bold");'),
    ]
    for old, new in replacements:
        content = content.replace(old, new)

    if content == original:
        print(f"  generateLegalPDF.ts: already patched — skipping.")
    else:
        with open(PDF_GEN_FILE, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Patched: {PDF_GEN_FILE}")


def main():
    print("=" * 60)
    print(" fix_jspdf_fonts.py — Host Grotesk Full TTF for jsPDF")
    print("=" * 60)

    if not os.path.isfile(FONT_DATA_FILE):
        print(f"\nERROR: Could not find {FONT_DATA_FILE}")
        print("Run this script from the naturalist-project root.")
        sys.exit(1)

    ensure_deps()

    with tempfile.TemporaryDirectory() as tmpdir:
        print("\n[2/4] Downloading full Host Grotesk TTF files...")

        # Try bunny.net first (reliable fontsource mirror with full TTFs)
        ttf_paths = try_download_ttf_direct(tmpdir)

        # Fallback: Google Fonts
        if not ttf_paths:
            print("  Trying Google Fonts fallback...")
            ttf_paths = try_download_via_gfonts(tmpdir)

        if not ttf_paths:
            print("\nERROR: All download attempts failed.")
            print("Check your internet connection and try again.")
            sys.exit(1)

        # Verify cmap and re-save clean TTF
        print("\n  Verifying cmap tables...")
        ttf_paths = convert_woff_if_needed(ttf_paths, tmpdir)

        encoded = encode_ttf(ttf_paths)
        write_font_data(encoded)

    patch_pdf_generator()

    print("\n" + "=" * 60)
    print(" Done!")
    print("   lib/hostGroteskFontData.ts  (full TTF base64)")
    print("   lib/generateLegalPDF.ts     (registerFonts patched)")
    print()
    print(" Restart your dev server and test the PDF download.")
    print("=" * 60)


if __name__ == "__main__":
    main()
