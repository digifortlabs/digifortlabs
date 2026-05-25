import json
import os

transcript_path = r"C:\Users\Codexshop\.gemini\antigravity-ide\brain\9d72835d-9cd0-46b5-bb4c-87225b78f331\.system_generated\logs\transcript.jsonl"
output_path = r"d:\Website\DIGIFORTLABS\server_manager\extracted_code.py"

print("Checking if transcript exists:", os.path.exists(transcript_path))

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        if '"step_index":590' in line:
            print("Found line matching step 590!")
            obj = json.loads(line)
            for tc in obj.get("tool_calls", []):
                if tc["name"] == "replace_file_content":
                    code = tc["args"]["ReplacementContent"]
                    # If it has leading/trailing quotes from json encoding, they will be handled by json.loads
                    with open(output_path, "w", encoding="utf-8") as out:
                        out.write(code)
                    print("SUCCESSFULLY WRITTEN TO:", output_path)
                    break
