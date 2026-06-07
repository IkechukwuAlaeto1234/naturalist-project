import os
import json

def main():
    conversation_id = '15898c9b-b61e-47f8-987d-02469f4fb19a'
    log_path = f'C:\\Users\\user\\.gemini\\antigravity\\brain\\{conversation_id}\\.system_generated\\logs\\transcript.jsonl'
    
    if not os.path.exists(log_path):
        print(f"Error: Transcript log not found at {log_path}")
        return

    with open(log_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    print(f"Total lines in transcript: {len(lines)}")
    # Inspect from the end
    for idx in range(len(lines) - 1, -1, -1):
        line = lines[idx]
        try:
            step = json.loads(line)
            content = step.get('content', '')
            source = step.get('source', '')
            step_type = step.get('type', '')
            print(f"Index {idx}: Type={step_type}, Source={source}, Length={len(content)}")
            if 'data:image' in content:
                print(f"  Found data:image on line {idx}!")
                # Let's save a snippet of the data:image matches
                # Count how many data:image matches are there
                matches = content.count('data:image/png;base64')
                print(f"  Number of data:image occurrences: {matches}")
        except Exception as e:
            print(f"Error reading line {idx}: {e}")

if __name__ == '__main__':
    main()
