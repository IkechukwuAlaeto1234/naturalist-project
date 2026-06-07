import os
import urllib.request

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.abspath(os.path.join(script_dir, '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)

    # Glassmorphism icons list
    # Format: (output_filename, primary_url, fallback_url)
    icons = [
        ('social_instagram.png', 'https://img.icons8.com/glassmorphism/128/instagram-new.png', 'https://img.icons8.com/glassmorphism/128/instagram.png'),
        ('social_x.png', 'https://img.icons8.com/glassmorphism/128/twitterx.png', 'https://img.icons8.com/glassmorphism/128/twitter.png'),
        ('social_linkedin.png', 'https://img.icons8.com/glassmorphism/128/linkedin.png', None),
        ('social_youtube.png', 'https://img.icons8.com/glassmorphism/128/youtube-play.png', 'https://img.icons8.com/glassmorphism/128/youtube.png'),
        ('social_facebook.png', 'https://img.icons8.com/glassmorphism/128/facebook.png', 'https://img.icons8.com/glassmorphism/128/facebook-new.png'),
        ('social_whatsapp.png', 'https://img.icons8.com/glassmorphism/128/whatsapp.png', None),
        ('social_tiktok.png', 'https://img.icons8.com/glassmorphism/128/tiktok.png', None)
    ]

    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
    }

    print("Downloading 3D Glassmorphism social icons from Icons8...")

    for filename, url, fallback_url in icons:
        print(f"Downloading {filename}...")
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
        
        if img_data:
            try:
                save_path = os.path.join(output_dir, filename)
                with open(save_path, 'wb') as f:
                    f.write(img_data)
                print(f"  Successfully saved glassmorphic icon: {filename} ({len(img_data)} bytes)")
            except Exception as err:
                print(f"  Failed to save {filename}: {err}")
        else:
            print(f"  Error: Could not retrieve icon for {filename}. Skipping.")

    print("\nSocial icons download complete!")

if __name__ == '__main__':
    main()
