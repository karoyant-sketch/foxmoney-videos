"""Download all assets of a job into kids/work/.

  python3 tools/fetch.py jobs/<slug>/assets.json [resolved_urls.json]

assets.json maps a work/ path to a source:
  {"img/s01.png": {"url": "https://cdn.openart.ai/..."},
   "voice/01_01.mp3": {"el_gen": "<ElevenLabs generation_id>"}, ...}
ElevenLabs links are signed and expire after ~2 h, so the agent first resolves every el_gen to a fresh
full_res_url with creative_get_generations (flow_id from assets.json "_el_flow") and writes them to
resolved_urls.json as {"<generation_id>": "<url>"}.
Images are scaled to 1920x1080 (cover) JPEG to keep the render fast; clips are re-encoded to 1080p30 H.264.
Exit 1 if anything is missing.
"""
import json
import os
import subprocess
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORK = os.path.join(ROOT, "work")


def get(url, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    r = subprocess.run(["curl", "-sSL", "--fail", "--retry", "3", "--max-time", "300", "-o", out, url], capture_output=True, text=True)
    return r.returncode == 0 and os.path.exists(out) and os.path.getsize(out) > 1000, r.stderr.strip()[:200]


def main():
    assets = json.load(open(sys.argv[1]))
    resolved = json.load(open(sys.argv[2])) if len(sys.argv) > 2 else {}
    bad = []
    for rel, src in assets.items():
        if rel.startswith("_"):
            continue
        out = os.path.join(WORK, rel)
        url = src.get("url") or resolved.get(src.get("el_gen", "")) or resolved.get(src.get("openart_history", ""))
        if not url:
            bad.append(f"{rel}: keine URL ({src} nicht aufgelöst)")
            continue
        tmp = out + ".dl"
        ok, err = get(url, tmp)
        if not ok:
            bad.append(f"{rel}: Download fehlgeschlagen {err}")
            continue
        if rel.endswith((".png", ".jpg")) and rel.startswith(("img/",)):
            from PIL import Image
            im = Image.open(tmp).convert("RGB")
            w, h = im.size
            s = max(1920 / w, 1080 / h)
            im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
            l, t = (im.width - 1920) // 2, (im.height - 1080) // 2
            im.crop((l, t, l + 1920, t + 1080)).save(out, quality=92)
            os.remove(tmp)
        elif rel.endswith(".mp4"):
            subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmp, "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=30", "-an", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", out], check=True)
            os.remove(tmp)
        else:
            os.replace(tmp, out)
        print("ok", rel)
    if bad:
        print("FEHLT:\n- " + "\n- ".join(bad))
        sys.exit(1)


if __name__ == "__main__":
    main()
