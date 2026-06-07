import os
import json
import base64
import re

def main():
    conversation_id = '15898c9b-b61e-47f8-987d-02469f4fb19a'
    log_path = os.path.expanduser(f'~/.gemini/antigravity/brain/{conversation_id}/.system_generated/logs/transcript.jsonl')
    
    if not os.path.exists(log_path):
        # Check standard absolute path fallback
        log_path = f'C:\\Users\\user\\.gemini\\antigravity\\brain\\{conversation_id}\\.system_generated\\logs\\transcript.jsonl'
        if not os.path.exists(log_path):
            print(f"Error: Transcript log not found at {log_path}")
            return

    print(f"Reading logs from {log_path}...")
    
    # Read the transcript lines
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Search backwards for the last user message containing images
    user_content = ""
    for line in reversed(lines):
        try:
            step = json.loads(line)
            if step.get('type') == 'USER_INPUT':
                content = step.get('content', '')
                if 'data:image/png;base64' in content:
                    user_content = content
                    break
        except Exception:
            continue

    if not user_content:
        print("Error: Could not find the user input containing base64 images in the logs.")
        return

    # Extract all img tags with their base64 source and alt tags using string splitting
    parts = user_content.split('<img src="data:image/png;base64,')
    matches = []
    
    for part in parts[1:]:
        try:
            b64_str = part.split('"')[0].strip()
            if 'alt="' in part:
                alt = part.split('alt="')[1].split('"')[0].strip()
                matches.append((b64_str, alt))
        except Exception as e:
            print(f"Error parsing segment: {e}")
    
    if not matches:
        print("Error: String splitting failed to find any base64 images in the user content.")
        return

    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'brand'))
    os.makedirs(output_dir, exist_ok=True)
    
    alt_map = {
        'twitterx': 'social_x.png',
        'instagram-new': 'social_instagram.png',
        'tiktok': 'social_tiktok.png',
        'youtube-play': 'social_youtube.png',
        'facebook': 'social_facebook.png'
    }

    print(f"Found {len(matches)} images to decode. Saving to {output_dir}...")
    
    for b64_str, alt in matches:
        filename = alt_map.get(alt)
        if not filename:
            print(f"  Warning: Unknown alt tag '{alt}', skipping.")
            continue
            
        try:
            img_data = base64.b64decode(b64_str)
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'wb') as f_out:
                f_out.write(img_data)
            print(f"  Saved: {filename} ({len(img_data)} bytes)")
        except Exception as e:
            print(f"  Failed to save {filename}: {e}")

    print("\nLog image decoding complete!")

if __name__ == '__main__':
    main()
