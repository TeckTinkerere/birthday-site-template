"""Re-encode public/videos/*.mp4 to browser-safe H.264 into video-work/out.

Originals are never modified. Portrait clips cap at 720 wide, landscape at
1280 wide; audio is AAC; moov atom moved up front so playback starts fast.
"""
import subprocess, sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "public" / "videos", ROOT / "video-work" / "out"
OUT.mkdir(parents=True, exist_ok=True)

SCALE = "scale=w='trunc(if(gt(a,1),min(iw,1280),min(iw,720))/2)*2':h=-2"

def encode(src: Path):
    dst = OUT / src.name
    cmd = ["ffmpeg", "-y", "-v", "error", "-i", str(src), "-vf", SCALE,
           "-c:v", "libx264", "-preset", "medium", "-crf", "26", "-pix_fmt", "yuv420p",
           "-profile:v", "high", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", str(dst)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    ok = r.returncode == 0
    print(f"{'ok ' if ok else 'ERR'} {src.name}: {src.stat().st_size/1e6:.1f}MB -> "
          f"{dst.stat().st_size/1e6:.1f}MB" if ok else f"ERR {src.name}: {r.stderr[:300]}", flush=True)
    return ok

files = sorted(SRC.glob("*.mp4"), key=lambda p: int(p.stem) if p.stem.isdigit() else p.stem)
with ThreadPoolExecutor(max_workers=3) as ex:
    results = list(ex.map(encode, files))
print("done", sum(results), "/", len(files))
sys.exit(0 if all(results) else 1)
