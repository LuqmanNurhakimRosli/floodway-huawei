import os
import json
from huggingface_hub import HfApi, hf_hub_download

MODEL_ID = "ibm-nasa-geospatial/Prithvi-100M-sen1floods11"

def inspect_model_repo():
    print(f"Connecting to Hugging Face repo: {MODEL_ID}...")
    api = HfApi()
    try:
        files = api.list_repo_files(repo_id=MODEL_ID)
        print(f"Found {len(files)} files in repository:")
        for f in files:
            print(f"  - {f}")
        return files
    except Exception as e:
        print(f"Error inspecting repository: {e}")
        return []

if __name__ == "__main__":
    inspect_model_repo()
