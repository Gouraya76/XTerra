"""Timeline + bande son d'un épisode « 100 jours » (format script.json à beats).

Usage : python3 scripts/build_ep2.py episodes/ep02_100jours anim/public/ep02 anim/src/ep02.json
"""
import json, sys, subprocess, numpy as np
from faster_whisper import WhisperModel

EP, PUB, TL = sys.argv[1:4]
SR, FPS = 44100, 30
S = json.load(open(f"{EP}/script.json"))
beats = S["beats"]
subprocess.run(["mkdir", "-p", PUB])

def load(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768

wm = WhisperModel("small", compute_type="int8")
GAP, LEAD, DAYCARD, END = 0.32, 0.25, 1.4, 5.0
t = 0.6
out, prev_day, day, errors = [], None, 0, {}
for i, b in enumerate(beats):
    a = load(f"{EP}/voix/{i:02d}.wav")
    dur = len(a) / SR
    if "day" in b and b["day"] != prev_day:
        if prev_day is not None:
            out.append({"kind": "daycard", "day": b["day"], "start": round(t, 3), "end": round(t + DAYCARD, 3)})
            t += DAYCARD
        prev_day = day = b["day"]
    for k, v in b.get("errors", {}).items():
        errors[k] = v
    start = t
    vstart = t + LEAD + (0.5 if b.get("rule") else 0) + (0.35 if b.get("sfx") else 0)
    # mots horodatés (sous-titres mot par mot)
    a16 = a[::1] if SR == 16000 else np.interp(np.arange(0, len(a), SR / 16000), np.arange(len(a)), a).astype(np.float32)
    segs, _ = wm.transcribe(a16, language="fr", word_timestamps=True, initial_prompt=b["text"])
    words = [{"w": w.word.strip(), "s": round(vstart + w.start, 3), "e": round(vstart + w.end, 3)} for s in segs for w in (s.words or []) if w.word.strip()]
    hop = SR // FPS
    env = [float(np.sqrt(np.mean(a[k:k + hop] ** 2))) for k in range(0, len(a), hop)]
    pk = max(env) or 1
    env = [round(min(1, (e / pk) ** 0.7), 2) for e in env]
    end = vstart + dur + GAP + (0.4 if b.get("sfx") else 0)
    out.append({"kind": "beat", "i": i, **{k: v for k, v in b.items() if k != "errors"}, "dayNow": day, "errors": dict(errors), "newErrors": b.get("errors", {}),
                "start": round(start, 3), "vstart": round(vstart, 3), "dur": round(dur, 3), "end": round(end, 3), "env": env, "words": words, "_a": a})
    t = end
    print(i, b["who"], round(dur, 2), len(words), "mots", flush=True)
total = t + END
out.append({"kind": "outro", "start": round(t, 3), "end": round(total, 3)})

# ---------- audio ----------
N = int(total * SR) + SR
voice = np.zeros(N, np.float32); music = np.zeros(N, np.float32); sfx = np.zeros(N, np.float32)
rng = np.random.default_rng(3)
def add(buf, x, t0, g=1.0):
    s = int(t0 * SR); e = min(len(buf), s + len(x))
    if 0 <= s < len(buf): buf[s:e] += x[:e - s] * g
def envd(n, a=0.002, d=0.2):
    tt = np.arange(n) / SR; return np.minimum(1, tt / a) * np.exp(-tt / d)
def lp(x, k): return np.convolve(x, np.ones(k) / k, mode="same")
def tone(f, dur, kind="sine", d=0.5):
    n = int(dur * SR); tt = np.arange(n) / SR
    w = np.sin(2 * np.pi * f * tt) if kind == "sine" else (np.abs(((f * tt) % 1) * 4 - 2) - 1) if kind == "tri" else 2 * ((f * tt) % 1) - 1
    return w * envd(n, 0.005, d)
def kick():
    n = int(0.4 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(50 + 80 * np.exp(-tt * 35)) / SR) * envd(n, 0.001, 0.14)
def snare():
    n = int(0.25 * SR); return rng.standard_normal(n) * envd(n, 0.001, 0.06) * 0.5
def hat():
    n = int(0.05 * SR); x = np.diff(np.concatenate([[0], rng.standard_normal(n)])); return x * envd(n, 0.0005, 0.012) * 0.2
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)

# musique « jeu vidéo cosy » 100 BPM : marimba (tri) + basse + beat léger ; version tendue pour Prune / La Boîte
BPM = 100; bt = 60 / BPM
prog = [(60, 64, 67, 72), (57, 60, 64, 69), (53, 57, 60, 65), (55, 59, 62, 67)]
tense = [(57, 60, 63), (56, 59, 63), (55, 58, 62), (56, 59, 63)]
mel = [0, 2, 1, 3, 2, 1, 0, 3]
def section(t0, t1, mood):
    b = 0; tt = t0
    while tt < t1:
        bar = (b // 4) % 4; pos = b % 4
        ch = (tense if mood == "tendu" else prog)[bar]
        g = 0.6 if mood == "nuit" else 1.0
        if mood != "nuit":
            if pos in (0, 2): add(music, kick(), tt, 0.45 * g)
            if pos in (1, 3): add(music, snare(), tt, 0.22 * g)
            add(music, hat(), tt + bt / 2, 0.8 * g)
        add(music, tone(m2f(ch[0] - 24), bt, "sine", 0.35), tt, 0.28 * g)
        if mood != "tendu":
            for k in range(2):
                note = ch[mel[(b * 2 + k) % 8] % len(ch)] + 12
                add(music, tone(m2f(note), bt / 2, "tri", 0.12), tt + k * bt / 2, 0.07 * g)
        else:
            if pos == 0:
                for n_ in ch: add(music, lp(tone(m2f(n_), bt * 4, "saw", 1.5), 30), tt, 0.035)
        b += 1; tt += bt
seg = []
for o in out:
    if o["kind"] != "beat": continue
    mood = "tendu" if o["scene"] == "boite" or o["who"] == "PRUNE" or o.get("shot") == "boite" else "nuit" if o["scene"] == "rueNuit" else "cosy"
    if seg and seg[-1][2] == mood: seg[-1][1] = o["end"]
    else: seg.append([o["start"], o["end"], mood])
seg[0][0] = 0; seg[-1][1] = total
for s0, s1, mood in seg: section(s0, s1, mood)

def whoosh(d=0.5):
    n = int(d * SR); x = rng.standard_normal(n); y = np.zeros(n)
    for j in range(0, n, 256):
        k = max(1, int(30 - 28 * np.sin(np.pi * j / n))); y[j:j + 256] = lp(x[j:j + 256 + k], k)[:len(y[j:j + 256])]
    return y * np.sin(np.pi * np.arange(n) / n)
def ding(): return (tone(1318, 1.0, "sine", 0.4) + 0.5 * tone(1975, 1.0, "sine", 0.3)) * 0.6
def sifflet():
    n = int(0.7 * SR); tt = np.arange(n) / SR
    f = 2800 + 120 * np.sin(2 * np.pi * 35 * tt)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, tt / 0.02) * np.minimum(1, (0.7 - tt) / 0.05) * 0.5
def porte(): return kick() * 1.2 + np.concatenate([rng.standard_normal(int(0.15 * SR)) * envd(int(0.15 * SR), 0.001, 0.04), np.zeros(int(0.25 * SR))]) * 0.4
def explosion():
    n = int(2.5 * SR); return lp(rng.standard_normal(n), 40) * 5 * envd(n, 0.005, 0.6) + kick()[:n].sum() * 0
def stamp(): return kick() * 1.1 + np.concatenate([rng.standard_normal(int(0.08 * SR)) * 0.6, np.zeros(int(0.32 * SR))]) * envd(int(0.4 * SR), 0.001, 0.05)
for o in out:
    if o["kind"] == "daycard": add(sfx, whoosh(0.5), o["start"] - 0.1, 0.5); add(sfx, stamp(), o["start"] + 0.35, 0.8)
    if o["kind"] != "beat": continue
    add(voice, o.pop("_a"), o["vstart"])
    if o.get("rule"): add(sfx, ding(), o["start"] + 0.15, 0.6)
    if o.get("sfx") in ("sifflet", "porte", "explosion"): add(sfx, {"sifflet": sifflet, "porte": porte, "explosion": explosion}[o["sfx"]](), o["start"] + 0.1, 0.7)
    if o["newErrors"]: add(sfx, stamp(), o["vstart"] + 0.2, 0.6)
add(sfx, whoosh(0.7), 0.0, 0.5)

venv = np.convolve(np.abs(voice), np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
duck = 1 - 0.55 * np.clip(venv / 0.03, 0, 1)
mix = (voice + music * duck * 0.5 + sfx * 0.55)[:int(total * SR)]
mix[-int(2 * SR):] *= np.linspace(1, 0.2, int(2 * SR))
mix = np.tanh(mix * 1.05) * 0.92
open(f"{PUB}/mix.raw", "wb").write((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", f"{PUB}/mix.raw", "-af", "loudnorm=I=-14:TP=-1", "-ar", "48000", "-b:a", "192k", f"{PUB}/audio.mp3"], check=True)
subprocess.run(["rm", "-f", f"{PUB}/mix.raw"])
json.dump({"fps": FPS, "duration": round(total, 3), "titre": S["titre"], "items": out}, open(TL, "w"), ensure_ascii=False)

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60); return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
with open(f"{EP}/sous-titres.srt", "w") as f:
    k = 1
    for o in out:
        if o["kind"] == "beat":
            f.write(f"{k}\n{ts(o['vstart'])} --> {ts(o['vstart'] + o['dur'])}\n{o['text']}\n\n"); k += 1
print("DURÉE", round(total, 1), "s =", round(total / 60, 2), "min")
