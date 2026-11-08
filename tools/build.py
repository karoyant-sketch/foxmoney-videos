"""Build a FOXMONEY video from work/video.json + work/voice/NN.(mp3|wav).

  python3 tools/build.py prepare   # audio + timeline -> app/src/data.json, app/public/voice.wav
  python3 tools/build.py stills    # contact sheet work/sheet.jpg (one still per scene) to check layout
  python3 tools/build.py render    # full render -> work/final.mp4 (H.264, upload-sized)

Voice files: one per scene, named 01.mp3, 02.mp3 ... in scene order.
"""
import glob
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
WORK = os.path.join(ROOT, "work")
CHROME = next((p for p in ["/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"] if os.path.exists(p)), None)
LEAD, TAIL, END_TAIL = 0.5, 0.35, 1.5
TEMPO = float(os.environ.get("VOICE_TEMPO", "1.0"))


def sh(*a):
    subprocess.run(a, check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


def prepare():
    spec = json.load(open(os.path.join(WORK, "video.json")))
    scenes = spec["scenes"]
    tmp = os.path.join(WORK, "proc")
    os.makedirs(tmp, exist_ok=True)
    parts, start, out = [], 0, []
    for i, s in enumerate(scenes, 1):
        src = next(iter(glob.glob(os.path.join(WORK, "voice", f"{i:02d}.*"))), None)
        if not src:
            sys.exit(f"missing voice file work/voice/{i:02d}.mp3 for scene {i}")
        clean = os.path.join(tmp, f"c{i:02d}.wav")
        af = "silenceremove=start_periods=1:start_threshold=-45dB:stop_periods=-1:stop_duration=0.6:stop_threshold=-45dB"
        if TEMPO != 1.0:
            af += f",atempo={TEMPO}"
        sh("ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", af + ",aresample=44100", "-ac", "1", clean)
        d = dur(clean)
        frames = round((LEAD + d + (END_TAIL if i == len(scenes) else TAIL)) * 30)
        padded = os.path.join(tmp, f"p{i:02d}.wav")
        sh("ffmpeg", "-y", "-loglevel", "error", "-i", clean, "-af", f"adelay={int(LEAD*1000)},apad,atrim=0:{frames/30}", "-ar", "44100", "-ac", "1", padded)
        parts.append(padded)
        out.append({**s, "start": start, "dur": frames, "speech": round(d, 2)})
        start += frames
    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    voice_only = os.path.join(tmp, "voice_only.wav")
    sh("ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-af", "loudnorm=I=-16:TP=-1.5:LRA=9", "-ar", "44100", "-ac", "2", voice_only)
    # background music: own licensed track if present, else generated original music
    own = sorted(glob.glob(os.path.join(APP, "public", "music", "*.mp3")) + glob.glob(os.path.join(APP, "public", "music", "*.wav")))
    music = os.path.join(tmp, "music.wav")
    if own:
        sh("ffmpeg", "-y", "-loglevel", "error", "-stream_loop", "-1", "-i", own[0], "-t", f"{start/30:.3f}", "-af", f"afade=t=out:st={max(0, start/30-3):.2f}:d=3", "-ar", "44100", "-ac", "2", music)
    else:
        sh(sys.executable, os.path.join(ROOT, "tools", "music.py"), f"{start/30:.3f}", music, str(spec.get("seed", "fox")))
    mvol = float(spec.get("music_volume", 0.16))
    fc = (f"[1:a]volume={mvol}[m];[m][0:a]sidechaincompress=threshold=0.025:ratio=5:attack=30:release=500[d];"
          "[0:a][d]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[out]")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", voice_only, "-i", music, "-filter_complex", fc, "-map", "[out]", "-ar", "44100", os.path.join(APP, "public", "voice.wav"))
    json.dump({"seed": spec.get("seed", spec.get("title", "fox")), "scenes": out, "total": start}, open(os.path.join(APP, "src", "data.json"), "w"), ensure_ascii=False)
    chapters = []
    for s in out:
        if s.get("chapter"):
            t = s["start"] // 30
            chapters.append(f"{t//60}:{t%60:02d} {s['chapter']}")
    open(os.path.join(WORK, "chapters.txt"), "w").write("\n".join(chapters) + "\n")
    print(f"total {start/30:.1f}s, {len(out)} scenes")
    print("\n".join(chapters))


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
        fr = s["start"] + min(s["dur"] - 10, 200)
        p = os.path.join(d, f"s{k+1:02d}.jpg")
        remotion("still", "src/index.ts", "Main", p, f"--frame={fr}", "--jpeg-quality=80")
        files.append(p)
    from PIL import Image

    W, H = 640, 360
    rows = (len(files) + 2) // 3
    sheet = Image.new("RGB", (W * 3, H * rows))
    for k, f in enumerate(files):
        sheet.paste(Image.open(f).resize((W, H)), ((k % 3) * W, (k // 3) * H))
    sheet.save(os.path.join(WORK, "sheet.jpg"), quality=85)
    print(os.path.join(WORK, "sheet.jpg"))


def render():
    raw = os.path.join(WORK, "raw_tmp.mp4")
    remotion("render", "src/index.ts", "Main", raw, "--codec=h264", "--crf=20", "--concurrency=2", "--jpeg-quality=90", "--audio-bitrate=192k")
    final_tmp = os.path.join(WORK, "final_tmp.mp4")
    sh("ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-c:v", "libx264", "-crf", "24", "-preset", "veryfast", "-c:a", "copy", "-movflags", "+faststart", final_tmp)
    os.replace(final_tmp, os.path.join(WORK, "final.mp4"))
    os.remove(raw)
    print(os.path.join(WORK, "final.mp4"), f"{os.path.getsize(os.path.join(WORK, 'final.mp4'))/1e6:.1f} MB")


if __name__ == "__main__":
    {"prepare": prepare, "stills": stills, "render": render}[sys.argv[1]]()
