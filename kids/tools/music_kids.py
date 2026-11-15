"""Original cheerful background music for kids videos, generated in code (no licence issues).

Bright major key, soft ukulele-like plucks, glockenspiel sparkles, warm bass, light shaker.
Each video gets its own key / tempo / progression / melody from a seed.

  python3 tools/music_kids.py <seconds> <out.wav> [seed]
"""
import hashlib
import sys
import wave

import numpy as np

SR = 44100
PROGS = [[0, 5, 7, 0], [0, 9, 5, 7], [0, 7, 9, 5], [0, 5, 9, 7], [0, 4, 5, 7]]
MAJ = [0, 4, 7]
MIN = [0, 3, 7]
PENTA = [0, 2, 4, 7, 9, 12, 14, 16]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env(n, a=0.005, d=0.35):
    t = np.arange(n) / SR
    e = np.minimum(1, t / a) * np.exp(-t / d)
    return e


def pluck(f, n, d=0.4):
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.45 * np.sin(4 * np.pi * f * t) * np.exp(-t * 6) + 0.2 * np.sin(6 * np.pi * f * t) * np.exp(-t * 10)
    return x * env(n, 0.004, d)


def bell(f, n):
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)
    return x * env(n, 0.002, 0.6)


def main(secs, out, seed="kids"):
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    rng = np.random.default_rng(h % (2**32))
    root = 60 + [0, 2, 5, 7, -3][h % 5]  # C, D, F, G, A
    bpm = [100, 104, 108, 112, 116][(h >> 4) % 5]
    prog = PROGS[(h >> 8) % len(PROGS)]
    beat = 60 / bpm
    n = int(secs * SR) + SR
    L = np.zeros(n)
    R = np.zeros(n)
    bar = 4 * beat
    nbars = int(secs / bar) + 2
    # melody motif (2 bars, 8th notes) repeated with variation
    motif = [int(rng.integers(0, len(PENTA))) if rng.random() > 0.25 else -1 for _ in range(16)]
    for b in range(nbars):
        deg = prog[b % len(prog)]
        tri = MIN if deg in (9, 2, 4) else MAJ
        t0 = b * bar
        # bass: root on 1 and 3
        for k in (0, 2):
            s = int((t0 + k * beat) * SR)
            m = root - 24 + deg
            nn = int(beat * 1.6 * SR)
            if s + nn < n:
                x = pluck(hz(m), nn, 0.5) * 0.5
                L[s:s + nn] += x
                R[s:s + nn] += x
        # ukulele strum on every beat (off-beat lighter)
        for k in range(4):
            for j, iv in enumerate(tri + [12]):
                s = int((t0 + k * beat + j * 0.012) * SR)
                nn = int(beat * 0.9 * SR)
                if s + nn < n:
                    x = pluck(hz(root + deg + iv), nn, 0.22) * (0.11 if k % 2 == 0 else 0.07)
                    L[s:s + nn] += x * 0.8
                    R[s:s + nn] += x * 1.1
        # glockenspiel melody (every other 2-bar phrase, varied)
        if (b // 2) % 2 == 1:
            for k in range(8):
                v = motif[(b % 2) * 8 + k]
                if v < 0:
                    continue
                m = root + 12 + PENTA[(v + (b // 4)) % len(PENTA)]
                s = int((t0 + k * beat / 2) * SR)
                nn = int(0.9 * SR)
                if s + nn < n:
                    x = bell(hz(m), nn) * 0.09
                    L[s:s + nn] += x * 1.1
                    R[s:s + nn] += x * 0.8
        # shaker on 8ths
        for k in range(8):
            s = int((t0 + k * beat / 2) * SR)
            nn = int(0.06 * SR)
            if s + nn < n:
                x = rng.standard_normal(nn) * np.exp(-np.arange(nn) / SR * 60) * (0.025 if k % 2 else 0.04)
                x = np.diff(np.concatenate([[0], x]))  # crude high-pass
                L[s:s + nn] += x
                R[s:s + nn] += x
    y = np.stack([L, R], 1)[: int(secs * SR)]
    fi, fo = int(1.0 * SR), int(2.5 * SR)
    y[:fi] *= np.linspace(0, 1, fi)[:, None]
    y[-fo:] *= np.linspace(1, 0, fo)[:, None]
    y = y / (np.abs(y).max() + 1e-9) * 0.8
    pcm = (y * 32767).astype("<i2")
    with wave.open(out, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main(float(sys.argv[1]), sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else "kids")
