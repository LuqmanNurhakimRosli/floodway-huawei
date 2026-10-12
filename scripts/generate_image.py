"""Free, local text-to-image with SD-Turbo (Stability AI, open weights). No API key, no cloud, runs on CPU.

Usage:  python scripts/generate_image.py "prompt" out.png [--width 768 --height 432 --steps 4 --seed 1]

Notes
- SD-Turbo is trained at 512x512; larger sizes work but can repeat subjects. Keep the long side at 768 or less.
- Licence: the SD-Turbo weights are non-commercial (Stability AI research licence). Fine for a demo; check before selling.
- CPU speed on a 4-core laptop: roughly 10 to 40 seconds per image. Set --steps 1 for a fast draft, 4 for best quality.
"""
from __future__ import annotations

import argparse
import time
from pathlib import Path

import torch
from diffusers import AutoPipelineForText2Image

MODEL = "stabilityai/sd-turbo"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("prompt")
    ap.add_argument("output")
    ap.add_argument("--width", type=int, default=512)
    ap.add_argument("--height", type=int, default=512)
    ap.add_argument("--steps", type=int, default=4)
    ap.add_argument("--seed", type=int, default=1)
    args = ap.parse_args()

    torch.set_num_threads(max(1, torch.get_num_threads()))
    pipe = AutoPipelineForText2Image.from_pretrained(MODEL, torch_dtype=torch.float32, use_safetensors=True)
    pipe.set_progress_bar_config(disable=True)
    started = time.perf_counter()
    image = pipe(
        args.prompt,
        width=args.width - args.width % 8,
        height=args.height - args.height % 8,
        num_inference_steps=args.steps,
        guidance_scale=0.0,  # SD-Turbo is distilled to run without classifier-free guidance
        generator=torch.Generator("cpu").manual_seed(args.seed),
    ).images[0]
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out)
    print(f"saved {out} ({image.size[0]}x{image.size[1]}) in {time.perf_counter() - started:.1f}s")


if __name__ == "__main__":
    main()
