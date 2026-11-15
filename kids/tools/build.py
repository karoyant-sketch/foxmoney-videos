"""Build a "Schlaue Kinder" video from kids/work/video.json.

  python3 tools/build.py prepare   # audio mix + timeline -> app/src/data.json, app/public/mix.wav
  python3 tools/build.py stills    # contact sheet work/sheet.jpg (one still per scene)
  python3 tools/build.py thumb     # work/thumbnail.jpg (1280x720)
  python3 tools/build.py render    # work/final.mp4 (H.264 1080p30, AAC)

Paths in video.json are relative to kids/work/. Voice files: work/voice/SS_LL.mp3
(SS = scene number from 01, LL = line number from 01). Song scenes use their "song" file.
Characters (names, colours, voices, portrait crops) come from characters/characters.json.
"""
import glob
import json
import os
import shutil
import subprocess
import sys
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
WORK = os.path.join(ROOT, "work")
PUB = os.path.join(APP, "public")
CHROME = next((p for p in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(p)), None)
SR = 44100
FPS = 30
LEAD, GAP, TAIL, END_TAIL = 0.45, 0.4, 0.8, 2.2


def sh(*a):
    subprocess.run(a, check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


def load(p):
    """Decode any audio file to float32 stereo array at SR."""
    raw = subprocess.check_output(["ffmpeg", "-v", "error", "-i", p, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"])
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def trim_silence(x, thr=0.006):
    mono = np.abs(x).max(axis=1)
    idx = np.where(mono > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(0.03 * SR))
    b = min(len(x), idx[-1] + int(0.08 * SR))
    return x[a:b]


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def pub(rel):
    """Copy a work/ asset into app/public/w/ and return its public path."""
    src = os.path.join(WORK, rel)
    if not os.path.exists(src):
        sys.exit(f"missing file work/{rel}")
    dst = os.path.join(PUB, "w", rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    shutil.copy2(src, dst)
    return "w/" + rel


def prepare():
    spec = json.load(open(os.path.join(WORK, "video.json")))
    cj = json.load(open(os.path.join(ROOT, "characters", "characters.json")))
    if os.path.isdir(os.path.join(PUB, "w")):
        shutil.rmtree(os.path.join(PUB, "w"))
    sheet = None
    if cj.get("sheet") and os.path.exists(os.path.join(ROOT, cj["sheet"])):
        os.makedirs(os.path.join(PUB, "w"), exist_ok=True)
        shutil.copy2(os.path.join(ROOT, cj["sheet"]), os.path.join(PUB, "w", "sheet.png"))
        sheet = "w/sheet.png"
    scenes = spec["scenes"]
    voice_parts, song_parts, out = [], [], []
    start = 0  # frames
    for i, s in enumerate(scenes, 1):
        last = i == len(scenes)
        kind = s.get("kind", "story")
        rec = {"kind": kind, "camera": s.get("camera", "zoom_in"), "title": s.get("title"), "outro": bool(s.get("outro")), "lines": []}
        if kind == "song":
            song = load(os.path.join(WORK, s["song"]))
            sdur = len(song) / SR
            frames = int(round((sdur + (END_TAIL if last else 0.5)) * FPS))
            song_parts.append((start, song))
            imgs = [pub(p) for p in s["images"]]
            rec.update({"image": imgs[0], "images": imgs, "bpm": s.get("bpm", 110)})
            lyr = [l for l in s.get("lyrics", []) if l.strip()]
            a, b = sdur * float(s.get("lyrics_start", 0.08)), sdur * float(s.get("lyrics_end", 0.96))
            step = (b - a) / max(1, len(lyr))
            rec["lyrics"] = [{"who": "song", "text": t, "s": int((a + k * step) * FPS), "e": int((a + (k + 1) * step) * FPS) - 4} for k, t in enumerate(lyr)]
            # spoken lines on a song scene are ignored (the song carries it)
        else:
            t = LEAD
            for k, ln in enumerate(s.get("lines", []), 1):
                src = next(iter(glob.glob(os.path.join(WORK, "voice", f"{i:02d}_{k:02d}.*"))), None)
                if not src:
                    sys.exit(f"missing voice file work/voice/{i:02d}_{k:02d}.mp3 (scene {i}, line {k})")
                x = trim_silence(load(src))
                voice_parts.append((start + int(t * FPS), x))
                d = len(x) / SR
                rec["lines"].append({"who": ln["who"], "text": ln["text"], "s": int(t * FPS), "e": int((t + d) * FPS)})
                t += d + GAP
            t += (END_TAIL if last else TAIL) - GAP
            t = max(t, float(s.get("min_sec", 4.5 if s.get("title") else 3.0)))
            frames = int(round(t * FPS))
            rec["image"] = pub(s["image"])
            if s.get("clip"):
                rec["clip"] = pub(s["clip"])
                rec["clipFrames"] = int(dur(os.path.join(WORK, s["clip"])) * FPS) - 2
        rec["start"], rec["dur"] = start, frames
        out.append(rec)
        start += frames

    n = int(start / FPS * SR) + SR
    voice = np.zeros((n, 2), np.float32)
    songs = np.zeros((n, 2), np.float32)
    for f0, x in voice_parts:
        a = int(f0 / FPS * SR)
        voice[a:a + len(x)] += x[: n - a]
    for f0, x in song_parts:
        a = int(f0 / FPS * SR)
        songs[a:a + len(x)] += x[: n - a]
    # level voice to ~-16 LUFS-ish by peak/RMS, songs a bit lower
    def norm(x, target_rms):
        r = np.sqrt(np.mean(x[np.abs(x).max(axis=1) > 0.01] ** 2)) if np.any(np.abs(x) > 0.01) else 0
        return x * (target_rms / r) if r > 0 else x
    voice = norm(voice, 0.12)
    songs = norm(songs, 0.11)

    # background bed (original, generated in code) – muted during songs, ducked under speech
    bed = np.zeros_like(voice)
    if spec.get("bed", True):
        tmp = os.path.join(WORK, "bed.wav")
        sh(sys.executable, os.path.join(ROOT, "tools", "music_kids.py"), f"{start / FPS:.2f}", tmp, str(spec.get("slug", "kids")))
        b = load(tmp)[:n]
        bed[: len(b)] = b
        hop = SR // 100
        vl = np.abs(voice).max(axis=1)
        env_v = np.array([vl[k:k + hop].max() for k in range(0, n, hop)])
        speak = np.convolve((env_v > 0.02).astype(float), np.ones(40) / 40, mode="same")  # 0.4 s smoothing
        sl = np.abs(songs).max(axis=1)
        env_s = np.array([sl[k:k + hop].max() for k in range(0, n, hop)])
        sing = np.convolve((env_s > 0.01).astype(float), np.ones(150) / 150, mode="same")
        g = (1 - 0.55 * np.clip(speak, 0, 1)) * (1 - np.clip(sing * 1.5, 0, 1))
        g = np.repeat(g, hop)[:n]
        bed = norm(bed, 0.1) * float(spec.get("bed_volume", 0.35)) * g[:, None]
    mix = voice + songs + bed
    # fade out end
    fo = int(1.5 * SR)
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None]
    tmp_mix = os.path.join(WORK, "mix_raw.wav")
    write_wav(tmp_mix, mix / max(1.0, np.abs(mix).max()))
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", tmp_mix, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), os.path.join(PUB, "mix.wav"))

    # per-frame speech level (0-9) for the speaking badge
    spf = SR // FPS
    vm = np.abs(voice).max(axis=1)
    lv = np.array([vm[k:k + spf].mean() if k < n else 0 for k in range(0, start * spf, spf)])
    lv = np.clip(lv / (np.percentile(lv[lv > 0.005], 90) if np.any(lv > 0.005) else 1), 0, 1)
    amp = "".join(chr(48 + int(round(v * 9))) for v in lv)

    chars = {k: {"name": v["name"], "color": v["color"], "crop": v.get("crop")} for k, v in cj["characters"].items()}
    sheet_aspect = 16 / 9
    if sheet:
        from PIL import Image
        w, h = Image.open(os.path.join(PUB, sheet)).size
        sheet_aspect = w / h
    th = dict(spec.get("thumbnail", {}))
    if th.get("image"):
        th["image"] = pub(th["image"])
    data = {"title": spec.get("title", ""), "total": start, "scenes": out, "chars": chars, "sheet": sheet, "sheetAspect": sheet_aspect, "amp": amp, "thumbnail": th}
    json.dump(data, open(os.path.join(APP, "src", "data.json"), "w"), ensure_ascii=False)
    # chapters for the description
    ch = [f"{(s['start'] // FPS) // 60}:{(s['start'] // FPS) % 60:02d} {sc['chapter']}" for s, sc in zip(out, scenes) if sc.get("chapter")]
    if ch and not ch[0].startswith("0:00"):
        ch.insert(0, "0:00 Start")
    open(os.path.join(WORK, "chapters.txt"), "w").write("\n".join(ch) + "\n")
    print(f"total {start / FPS:.1f}s ({start / FPS / 60:.2f} min), {len(out)} scenes")
    print("\n".join(ch))


def remotion(*args):
    cmd = ["npx", "remotion", *args, "--log=error"]
    if CHROME:
        cmd.append(f"--browser-executable={CHROME}")
    subprocess.run(cmd, cwd=APP, check=True)


def stills():
    data = json.load(open(os.path.join(APP, "src", "data.json")))
    d = os.path.join(WORK, "stills")
    os.makedirs(d, exist_ok=True)
    files = []
    for k, s in enumerate(data["scenes"]):
        fr = s["start"] + min(s["dur"] - 5, max(20, s["dur"] // 2))
        p = os.path.join(d, f"s{k + 1:02d}.jpg")
        remotion("still", "src/index.ts", "Story", p, f"--frame={fr}", "--jpeg-quality=80")
        files.append(p)
    from PIL import Image

    W, H = 640, 360
    rows = (len(files) + 2) // 3
    sheet = Image.new("RGB", (W * 3, H * rows), "white")
    for k, f in enumerate(files):
        sheet.paste(Image.open(f).resize((W, H)), ((k % 3) * W, (k // 3) * H))
    sheet.save(os.path.join(WORK, "sheet.jpg"), quality=85)
    print(os.path.join(WORK, "sheet.jpg"))


def thumb():
    out = os.path.join(WORK, "thumbnail.jpg")
    remotion("still", "src/index.ts", "Thumbnail", out, "--frame=0", "--jpeg-quality=90")
    print(out, f"{os.path.getsize(out) / 1e6:.2f} MB")


def render():
    raw = os.path.join(WORK, "raw_tmp.mp4")
    conc = os.environ.get("CONCURRENCY", str(max(1, min(4, (os.cpu_count() or 2) - 1))))
    remotion("render", "src/index.ts", "Story", raw, "--codec=h264", "--crf=20", f"--concurrency={conc}", "--jpeg-quality=90", "--audio-bitrate=192k")
    final_tmp = os.path.join(WORK, "final_tmp.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-c:v", "libx264", "-crf", "23", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final_tmp)
    os.replace(final_tmp, os.path.join(WORK, "final.mp4"))
    os.remove(raw)
    print(os.path.join(WORK, "final.mp4"), f"{os.path.getsize(os.path.join(WORK, 'final.mp4')) / 1e6:.1f} MB")


if __name__ == "__main__":
    {"prepare": prepare, "stills": stills, "thumb": thumb, "render": render}[sys.argv[1]]()
