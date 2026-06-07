import os
import json

def main():
    conversation_id = '15898c9b-b61e-47f8-987d-02469f4fb19a'
    log_path = f'C:\\Users\\user\\.gemini\\antigravity\\brain\\{conversation_id}\\.system_generated\\logs\\transcript.jsonl'
    
    if not os.path.exists(log_path):
        print(f"Error: Transcript log not found at {log_path}")
        return

    with open(log_path, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f):
            try:
                step = json.loads(line)
                content = step.get('content', '')
                if '<img' in content or 'data:image' in content or 'social_x' in content or 'twitterx' in content:
                    print(f"Match on Index {idx}: type={step.get('type')}, source={step.get('source')}, content length={len(content)}")
                    # Let's print occurrences
                    print(f"  img count: {content.count('<img')}")
                    print(f"  base64 count: {content.count('data:image/png;base64')}")
                    # Write to a file if it has a lot of images
                    if content.count('data:image/png;base64') > 0:
                        out_path = f'scratch/match_{idx}_content.txt'
                        with open(out_path, 'w', encoding='utf-8') as out_f:
                            out_f.write(content)
                        print(f"  Saved full content to {out_path}")
            except Exception as e:
                print(f"Error processing line {idx}: {e}")

if __name__ == '__main__':
    main()
