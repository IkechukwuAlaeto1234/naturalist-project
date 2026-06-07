import urllib.request
import os

def check_url(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return response.read()
    except Exception:
        pass
    return None

def main():
    platforms = {
        'facebook': ['facebook-f', 'facebook', 'facebook-new', 'facebook-logo'],
        'instagram': ['instagram', 'instagram-new', 'instagram-logo'],
        'linkedin': ['linkedin', 'linkedin-2', 'linkedin-logo'],
        'youtube': ['youtube', 'youtube-play', 'youtube-logo'],
        'tiktok': ['tiktok', 'tiktok-logo'],
        'whatsapp': ['whatsapp', 'whatsapp-logo']
    }
    
    style = 'glassmorphism'
    size = '128'
    
    print("Scanning Icons8 for correct glassmorphic slugs...")
    for platform, options in platforms.items():
        found = False
        for option in options:
            url = f"https://img.icons8.com/{style}/{size}/{option}.png"
            data = check_url(url)
            if data:
                print(f"  [FOUND] {platform} matches slug: '{option}' ({len(data)} bytes)")
                found = True
                break
        if not found:
            print(f"  [NOT FOUND] {platform}")

if __name__ == '__main__':
    main()
