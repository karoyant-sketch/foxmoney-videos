"""Automatic quality check of work/final.mp4. Exit 0 = passed, 1 = failed (reasons printed).

  python3 tools/qc.py [min_seconds] [max_seconds]

Checks: 1920x1080, ~30 fps, H.264 + AAC, length window, audio not silent, no black stretch > 0.7 s,
no frozen stretch > 12 s (outside song scenes this would mean a broken clip), file < 2 GB.
Also writes work/qc_frames.jpg (12 frames across the video) – look at it before publishing.
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(ROOT, "work", "final.mp4")


def run(*a):
    return subprocess.run(a, capture_output=True, text=True)


def main():
    lo = float(sys.argv[1]) if len(sys.argv) > 1 else 60
    hi = float(sys.argv[2]) if len(sys.argv) > 2 else 480
    bad = []
    if not os.path.exists(F):
        print("FAIL: work/final.mp4 fehlt")
        sys.exit(1)
    info = json.loads(run("ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", F).stdout)
    v = next((s for s in info["streams"] if s["codec_type"] == "video"), None)
    a = next((s for s in info["streams"] if s["codec_type"] == "audio"), None)
    d = float(info["format"]["duration"])
    if not v or v.get("width") != 1920 or v.get("height") != 1080:
        bad.append(f"Auflösung {v and v.get('width')}x{v and v.get('height')} statt 1920x1080")
    if v and v.get("codec_name") != "h264":
        bad.append(f"Video-Codec {v.get('codec_name')}")
    if not a or a.get("codec_name") != "aac":
        bad.append("keine AAC-Tonspur")
    if not (lo <= d <= hi):
        bad.append(f"Länge {d:.0f}s außerhalb {lo:.0f}–{hi:.0f}s")
    vol = run("ffmpeg", "-i", F, "-af", "volumedetect", "-vn", "-f", "null", "-").stderr
    m = re.search(r"mean_volume: (-?[\d.]+) dB", vol)
    if not m or float(m.group(1)) < -35:
        bad.append(f"Ton zu leise/stumm ({m and m.group(1)} dB)")
    bl = run("ffmpeg", "-i", F, "-vf", "blackdetect=d=0.7:pix_th=0.08", "-an", "-f", "null", "-").stderr
    blacks = re.findall(r"black_start:([\d.]+) black_end:([\d.]+)", bl)
    if blacks:
        bad.append("schwarze Stellen: " + ", ".join(f"{float(s):.1f}-{float(e):.1f}s" for s, e in blacks))
    fr = run("ffmpeg", "-i", F, "-vf", "freezedetect=n=0.002:d=12", "-an", "-f", "null", "-").stderr
    frz = re.findall(r"freeze_start: ([\d.]+)", fr)
    if frz:
        bad.append("Standbild > 12 s ab " + ", ".join(f"{float(s):.1f}s" for s in frz))
    if os.path.getsize(F) > 2e9:
        bad.append("Datei > 2 GB")
    # contact sheet
    out = os.path.join(ROOT, "work", "qc_frames.jpg")
    step = max(1.0, d / 12)
    run("ffmpeg", "-y", "-v", "error", "-i", F, "-vf", f"fps=1/{step:.2f},scale=480:-1,tile=4x3", "-frames:v", "1", out)
    print(f"Länge {d:.1f}s, Ton {m and m.group(1)} dB, Größe {os.path.getsize(F) / 1e6:.1f} MB, Übersicht: {out}")
    if bad:
        print("FAIL:\n- " + "\n- ".join(bad))
        sys.exit(1)
    print("PASS")


if __name__ == "__main__":
    main()
