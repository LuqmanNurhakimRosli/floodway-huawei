import os
from huggingface_hub import hf_hub_download

MODEL_ID = "ibm-nasa-geospatial/Prithvi-100M-sen1floods11"
SAVE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "checkpoints")

def download_prithvi_files():
    os.makedirs(SAVE_DIR, exist_ok=True)
    files_to_download = ["config.yaml", "README.md", "sen1floods11_Prithvi_100M.py"]
    print(f"Downloading configuration and architecture files to {SAVE_DIR}...")
    for filename in files_to_download:
        path = hf_hub_download(repo_id=MODEL_ID, filename=filename, local_dir=SAVE_DIR)
        print(f"Downloaded: {filename} -> {path}")

if __name__ == "__main__":
    download_prithvi_files()
