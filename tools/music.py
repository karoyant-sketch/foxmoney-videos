"""Original background music for FOXMONEY explainers – generated in code, so no licence issues.

Calm documentary / lo-fi bed: warm detuned pad, sub bass, soft plucked arpeggio, light kick + hats.
Each video gets its own key/progression/tempo from a seed.

  python3 tools/music.py <seconds> <out.wav> [seed]

If a file app/public/music/track.(mp3|wav) exists (your own licensed music), build.py uses that instead.
"""
import hashlib
import sys
import wave

import numpy as np

SR = 44100

PROGS = [  # scale degrees (semitones from root) for minor-key progressions
    [0, 8, 3, 10],   # i - VI - III - VII
    [0, 5, 8, 7],    # i - iv - VI - V
    [0, 10, 8, 7],   # i - VII - VI - V
    [0, 8, 5, 7],    # i - VI - iv - V
]
MINOR_TRIAD = [0, 3, 7]
MAJOR_TRIAD = [0, 4, 7]


def midi_hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    # vectorised one-pole via lfilter-like loop in chunks (fast enough for a few minutes)
    try:
        from scipy.signal import lfilter

        return lfilter([1 - a], [1, -a], x)
    except Exception:
        for i in range(len(x)):
            acc = (1 - a) * x[i] + a * acc
            y[i] = acc
        return y


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def saw(freq, t):
    return 2 * ((t * freq) % 1.0) - 1


def generate(seconds, seed="fox"):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % (2**32))
    root = 45 + (h % 7)  # A2..D#3
    prog = PROGS[(h >> 4) % len(PROGS)]
    bpm = 78 + (h >> 8) % 12
    beat = 60 / bpm
    bar = 4 * beat
    chord_len = 2 * bar
    n = int(seconds * SR)
    out = np.zeros(n)

    t_chord = np.arange(int((chord_len + 1.6) * SR)) / SR  # overlap next chord
    n_chords = int(np.ceil(seconds / chord_len)) + 1
    for c in range(n_chords):
        start = int(c * chord_len * SR)
        if start >= n:
            break
        deg = prog[c % len(prog)]
        triad = MAJOR_TRIAD if deg in (8, 3, 10, 7) and deg != 0 else MINOR_TRIAD
        notes = [root + 12 + deg + i for i in triad] + [root + 24 + deg + triad[1]]
        seg = np.zeros(len(t_chord))
        for m in notes:  # pad: 3 detuned saws per note
            for det in (-0.12, 0.0, 0.11):
                seg += saw(midi_hz(m + det), t_chord + rng.random()) * 0.05
        seg = lowpass(lowpass(seg, 1100), 1100) * env_adsr(len(seg), 1.0, 1.8)
        sub = np.sin(2 * np.pi * midi_hz(root + deg) * t_chord) * 0.22 * env_adsr(len(t_chord), 0.08, 1.7)
        seg += sub
        # plucked arpeggio, 8th notes
        step = beat / 2
        arp = notes + [notes[1] + 12]
        for k in range(int(chord_len / step)):
            s0 = int(k * step * SR)
            ln = int(0.6 * SR)
            tt = np.arange(ln) / SR
            m = arp[(k * 3) % len(arp)] + 12
            pl = (np.sin(2 * np.pi * midi_hz(m) * tt) + 0.3 * np.sin(4 * np.pi * midi_hz(m) * tt)) * np.exp(-tt * 7) * 0.09
            e = min(len(seg), s0 + ln)
            seg[s0:e] += pl[: e - s0]
        e = min(n, start + len(seg))
        out[start:e] += seg[: e - start]

    # drums: soft kick on 1 & 3, hats on off-beats, start after 2 bars
    kick_t = np.arange(int(0.35 * SR)) / SR
    kick = np.sin(2 * np.pi * (50 + 90 * np.exp(-kick_t * 25)) * kick_t) * np.exp(-kick_t * 9) * 0.5
    hat = rng.standard_normal(int(0.05 * SR))
    hat = (hat - lowpass(hat, 6000)) * np.exp(-np.arange(len(hat)) / SR * 80) * 0.06
    b = 2 * bar
    while b < seconds - bar:
        for k in range(4):
            p = int((b + k * beat) * SR)
            if k in (0, 2) and p + len(kick) < n:
                out[p : p + len(kick)] += kick
            ph = int((b + k * beat + beat / 2) * SR)
            if ph + len(hat) < n:
                out[ph : ph + len(hat)] += hat
        b += bar

    # simple room reverb: a few feedback delays
    rev = np.zeros(n)
    for d, g in ((0.031, 0.35), (0.047, 0.3), (0.071, 0.25), (0.113, 0.2)):
        k = int(d * SR)
        rev[k:] += out[:-k] * g
    out = out + lowpass(rev, 3000) * 0.6
    fade = int(3 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    out /= max(1e-9, np.max(np.abs(out))) / 0.8
    return out


def write(path, x):
    st = np.stack([x, np.roll(x, 300)], axis=1)  # tiny stereo width
    pcm = (np.clip(st, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    secs = float(sys.argv[1])
    write(sys.argv[2], generate(secs, sys.argv[3] if len(sys.argv) > 3 else "fox"))
