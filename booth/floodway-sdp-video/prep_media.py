"""Cut the team's source media into what the film and assemble.py read. Output goes to out/ (git-ignored: third-party footage).

Run:  python prep_media.py <materials-demo folder>
Writes:
  out/montage/<shot>/%03d.jpg   30 fps frames of The Star clip for scene s00 (watermarks cropped out)
  out/news/star.jpg, awani.jpg  headline crops of the two news screenshots (no photos of people)
  out/narration/<stem>_48k.wav  each narrator's audio, loudness-normalised to -16 LUFS
"""
import subprocess
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
OUT = Path(__file__).parent / "out"
STAR = SRC / "Kuala Lumpur hit by flash floods on Sept 20 - The Star (720p).mp4"
# shot: (source start s, length s, crop w:h:x:y, output size). Full-width shots drop the top band with the logo and handle.
SHOTS = {
    "A": (11.0, 1.45, "1084:610:98:110", "1920:1080"),
    "B": (12.9, 1.10, "1084:610:98:110", "1920:1080"),
    "S1": (16.0, 2.15, "427:720:426:0", "640:1080"),
    "S2": (28.4, 2.15, "427:720:426:0", "640:1080"),
    "S3": (43.3, 2.15, "427:720:427:0", "640:1080"),
}
NARRATORS = ["1.Nadi.MOV", "2-Luqman.mp4", "3.aniq.mp4"]


def ff(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


for name, (ss, d, crop, size) in SHOTS.items():
    d_out = OUT / "montage" / name
    d_out.mkdir(parents=True, exist_ok=True)
    for f in d_out.glob("*.jpg"):
        f.unlink()
    ff("-ss", ss, "-t", d, "-i", STAR, "-vf", f"fps=30,crop={crop},scale={size}:flags=lanczos", "-q:v", 3, d_out / "%03d.jpg")
    print(f"montage {name}: {len(list(d_out.glob('*.jpg')))} frames")

(OUT / "news").mkdir(parents=True, exist_ok=True)
Image.open(SRC / "News Coverage (The Star).png").convert("RGB").crop((28, 88, 872, 404)).save(OUT / "news" / "star.jpg", quality=92)
Image.open(SRC / "News Coverage (Awani).png").convert("RGB").crop((10, 0, 426, 72)).save(OUT / "news" / "awani.jpg", quality=92)

(OUT / "narration").mkdir(parents=True, exist_ok=True)
for name in NARRATORS:
    ff("-i", SRC / name, "-map", "0:a:0", "-af", "highpass=f=80,loudnorm=I=-16:TP=-2:LRA=9", "-ac", 1, "-ar", 48000,
       OUT / "narration" / (Path(name).stem + "_48k.wav"))
    print("narration", name)
