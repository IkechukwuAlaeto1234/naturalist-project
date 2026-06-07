import os
import json

def main():
    conversation_id = '15898c9b-b61e-47f8-987d-02469f4fb19a'
    log_path = f'C:\\Users\\user\\.gemini\\antigravity\\brain\\{conversation_id}\\.system_generated\\logs\\transcript.jsonl'
    
    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    for line in reversed(lines):
        try:
            step = json.loads(line)
            if step.get('type') == 'USER_INPUT':
                content = step.get('content', '')
                if 'data:image/png;base64' in content:
                    print(f"Found input message. Length: {len(content)}")
                    # Save a sample of the first 1000 chars and last 1000 chars of the content
                    with open('scratch/user_content_dump.txt', 'w', encoding='utf-8') as f_out:
                        f_out.write(content)
                    print("Dumped full content to scratch/user_content_dump.txt")
                    return
        except Exception as e:
            print(f"Error parsing line: {e}")

if __name__ == '__main__':
    main()
