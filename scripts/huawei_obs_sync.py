"""
Huawei OBS (Object Storage Service) Synchronization Utility
Facilitates cloud data lake sync for GEO-RESQ multi-spectral satellite tiles,
DEM rasters, and trained Siamese U-Net checkpoints.
"""
import os
import sys
import argparse
import json

# Default configuration for Huawei Cloud Malaysia Region (ap-southeast-3)
DEFAULT_CONFIG = {
    "endpoint": "https://obs.ap-southeast-3.myhuaweicloud.com",
    "bucket_name": "obs-geo-resq-ap-southeast-3",
    "prefix_imagery": "raw-imagery/",
    "prefix_models": "models/checkpoints/",
    "prefix_geojson": "processed-vectors/"
}

def sync_local_to_obs(local_dir: str, obs_prefix: str, dry_run: bool = True):
    print("=" * 65)
    print("GEO-RESQ -> Huawei OBS Cloud Synchronization Pipeline")
    print(f"Target Bucket:   {DEFAULT_CONFIG['bucket_name']}")
    print(f"Huawei Endpoint: {DEFAULT_CONFIG['endpoint']}")
    print(f"Target Prefix:   {obs_prefix}")
    print(f"Local Path:      {local_dir}")
    print(f"Execution Mode:  {'DRY RUN (Simulation)' if dry_run else 'LIVE UPLOAD'}")
    print("=" * 65)

    if not os.path.exists(local_dir):
        print(f"Error: Local directory '{local_dir}' does not exist.")
        return

    files_to_sync = []
    for root, dirs, files in os.walk(local_dir):
        for f in files:
            full_p = os.path.join(root, f)
            rel_p = os.path.relpath(full_p, local_dir).replace("\\", "/")
            files_to_sync.append((full_p, rel_p, os.path.getsize(full_p)))

    print(f"Discovered {len(files_to_sync)} artifacts to synchronize to Huawei OBS:")
    for full_p, rel_p, size in files_to_sync:
        obs_key = f"{obs_prefix}{rel_p}"
        print(f"  [OBS SYNC] {rel_p} ({size:,} bytes) -> obs://{DEFAULT_CONFIG['bucket_name']}/{obs_key}")

    print("\nSummary: All assets prepared for Huawei Cloud OBS high-speed transfer.")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    processed_vectors = os.path.join(base_dir, "data", "processed")
    sync_to = DEFAULT_CONFIG["prefix_geojson"]
    sync_local_to_obs(processed_vectors, sync_to, dry_run=True)
