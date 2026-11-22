"""Construit timeline.json + bande son complète (voix + musique synthétisée + bruitages) d'un épisode.

Usage : python3 scripts/build_ep.py episodes/ep01_test anim/public/ep01 anim/src/ep01.json
"""
import json, sys, subprocess, numpy as np

EP, PUB, TL = sys.argv[1:4]
SR, FPS = 44100, 30
d = json.load(open(f"{EP}/dialogues.json"))

def load(path):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, np.int16).astype(np.float32) / 32768

# ---------- minutage ----------
TITLE = 3.6          # carton titre
GAP = 0.28           # silence entre deux répliques
SCENE_OUT, SCENE_IN = 0.7, 0.8
EXTRA_BEFORE = {"entree_piment": 0.9}
EXTRA_AFTER = {4: 0.5, 7: 0.35, 13: 0.6, 16: 0.15}
END = 7.0

t = TITLE
lines, scenes = [], []
prev_scene = None
for i, l in enumerate(d["lines"]):
    if l["scene"] != prev_scene:
        if prev_scene is not None:
            t += SCENE_OUT
            scenes[-1]["end"] = t
        scenes.append({"name": l["scene"], "start": t})
        t += SCENE_IN
        prev_scene = l["scene"]
    t += EXTRA_BEFORE.get(l.get("event"), 0)
    a = load(f"{EP}/voix/{i:02d}.wav")
    dur = len(a) / SR
    # enveloppe de parole par image (0..1) pour animer le personnage qui parle
    hop = SR // FPS
    env = [float(np.sqrt(np.mean(a[k:k + hop] ** 2))) for k in range(0, len(a), hop)]
    peak = max(env) or 1
    env = [round(min(1, (e / peak) ** 0.7), 3) for e in env]
    lines.append({**l, "i": i, "start": round(t, 3), "dur": round(dur, 3), "env": env, "audio": a})
    t += dur + GAP + EXTRA_AFTER.get(i, 0)
scenes[-1]["end"] = t + 0.6
end_start = scenes[-1]["end"]
total = end_start + END
scenes.append({"name": "fin", "start": end_start, "end": total})
scenes.insert(0, {"name": "titre", "start": 0, "end": TITLE})

# ---------- synthèse ----------
N = int(total * SR) + SR
voice = np.zeros(N, np.float32)
for l in lines:
    s = int(l["start"] * SR); voice[s:s + len(l["audio"])] += l["audio"]

rng = np.random.default_rng(7)
def env_ad(n, a=0.002, dcy=0.2):
    tt = np.arange(n) / SR
    return np.minimum(1, tt / a) * np.exp(-tt / dcy)
def kick():
    n = int(0.45 * SR); tt = np.arange(n) / SR
    f = 50 + 90 * np.exp(-tt * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.001, 0.16)
def snare():
    n = int(0.3 * SR); tt = np.arange(n) / SR
    return (rng.standard_normal(n) * 0.6 * env_ad(n, 0.001, 0.07) + np.sin(2 * np.pi * 190 * tt) * env_ad(n, 0.001, 0.05)) * 0.8
def hat():
    n = int(0.06 * SR); x = rng.standard_normal(n); x = np.diff(np.concatenate([[0], x]))
    return x * env_ad(n, 0.0005, 0.015) * 0.25
def tone(freq, dur, kind="saw", dcy=0.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    if kind == "sine": w = np.sin(2 * np.pi * freq * tt)
    else: w = 2 * ((freq * tt) % 1) - 1
    return w * env_ad(n, 0.01, dcy)
def lowpass(x, k=8):
    return np.convolve(x, np.ones(k) / k, mode="same")
def add(buf, x, t0, g=1.0):
    s = int(t0 * SR); e = min(len(buf), s + len(x))
    if s < len(buf): buf[s:e] += x[:e - s] * g

# musique : beat hip-hop 92 BPM, accords mineurs (quartier), drone sombre (Prune)
music = np.zeros(N, np.float32)
BPM = 92; beat = 60 / BPM
prog = [(57, 60, 64), (53, 57, 60), (55, 59, 62), (52, 55, 59)]  # Am F G Em
m2f = lambda m: 440 * 2 ** ((m - 69) / 12)
def beat_section(t0, t1, gain=1.0):
    b = 0; tt = t0
    while tt < t1:
        bar = int(b // 4) % 4; pos = b % 4
        if pos in (0, 2.5) or (pos == 2 and bar % 2): add(music, kick(), tt, 0.55 * gain)
        if pos in (1, 3): add(music, snare(), tt, 0.35 * gain)
        add(music, hat(), tt, gain); add(music, hat(), tt + beat / 2, 0.6 * gain)
        if pos == 0:
            for m in prog[bar]: add(music, lowpass(tone(m2f(m), beat * 4, "saw", 1.2), 24), tt, 0.05 * gain)
            add(music, tone(m2f(prog[bar][0] - 24), beat * 2, "sine", 0.5), tt, 0.32 * gain)
        if pos == 2: add(music, tone(m2f(prog[bar][0] - 24), beat * 2, "sine", 0.4), tt, 0.25 * gain)
        b += 0.5 if False else 1; tt += beat
def drone(t0, t1):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 55 * tt) + 0.5 * np.sin(2 * np.pi * 58.3 * tt) + 0.3 * lowpass(2 * ((110 * tt) % 1) - 1, 40))
    fade = np.minimum(1, np.minimum(tt / 0.8, (t1 - t0 - tt) / 0.8))
    add(music, x * fade * 0.22, t0)
    k = t0
    while k < t1 - 0.5:
        add(music, kick(), k, 0.45); k += beat * 2

for sc in scenes:
    if sc["name"] == "prune": drone(sc["start"], sc["end"])
    elif sc["name"] in ("titre",): beat_section(sc["start"] + 0.4, sc["end"], 1.0)
    else: beat_section(sc["start"], sc["end"], 0.9 if sc["name"] != "fin" else 1.1)

# bruitages
sfx = np.zeros(N, np.float32)
def whoosh(dur=0.5):
    n = int(dur * SR); x = rng.standard_normal(n)
    out = np.zeros(n); k = 1
    for j in range(0, n, 512):
        k = max(1, int(40 - 38 * np.sin(np.pi * j / n)))
        out[j:j + 512] = lowpass(x[j:j + 512 + k], k)[:len(out[j:j + 512])]
    return out * np.sin(np.pi * np.arange(n) / n) * 0.9
def slam():
    return kick() * 1.2 + np.concatenate([rng.standard_normal(int(0.25 * SR)) * env_ad(int(0.25 * SR), 0.001, 0.05), np.zeros(int(0.2 * SR))]) * 0.5
def ding():
    return (tone(1568, 1.2, "sine", 0.35) + 0.4 * tone(3136, 1.2, "sine", 0.2)) * 0.5
def pop():
    n = int(0.12 * SR); tt = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(300 + 1200 * tt / 0.12) / SR) * env_ad(n, 0.001, 0.04)
def thunder():
    n = int(2.2 * SR); x = lowpass(rng.standard_normal(n), 60) * 6
    return x * env_ad(n, 0.02, 0.7)
def boing():
    n = int(0.5 * SR); tt = np.arange(n) / SR
    f = 180 + 120 * np.sin(2 * np.pi * 9 * tt) * np.exp(-tt * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(n, 0.005, 0.25) * 0.7

L = {l["i"]: l for l in lines}
S = {s["name"]: s for s in scenes}
add(sfx, whoosh(0.7), 0.2, 0.5); add(sfx, slam(), 0.9, 0.6)                       # titre
for sc in scenes[2:]: add(sfx, whoosh(0.6), sc["start"] - 0.3, 0.45)              # transitions
add(sfx, whoosh(0.4), L[1]["start"] - 0.75, 0.5); add(sfx, pop(), L[1]["start"] - 0.35, 0.5)  # Zigo arrive
add(sfx, slam(), L[5]["start"] - 0.9, 0.9); add(sfx, whoosh(0.5), L[5]["start"] - 0.8, 0.7)  # Piment déboule
add(sfx, ding(), L[8]["start"] - 0.05, 0.35)                                      # "techniquement"
add(sfx, thunder(), L[11]["start"] + L[11]["dur"] - 0.6, 0.7)                     # rire de Prune
add(sfx, boing(), L[14]["start"] + 0.1, 0.5)                                      # "c'est fini"
add(sfx, slam(), L[17]["start"], 0.8)                                             # NON !
for k in range(10): add(sfx, pop(), S["fin"]["start"] + 1.2 + k * 0.22, 0.35)     # défilé des personnages

# ducking : la musique baisse quand quelqu'un parle
venv = np.abs(voice); win = int(0.25 * SR)
venv = np.convolve(venv, np.ones(win) / win, mode="same")
duck = 1 - 0.6 * np.clip(venv / 0.03, 0, 1)
mix = voice * 1.0 + music * duck * 0.55 + sfx * 0.6
mix = mix[:int(total * SR)]
fade = int(1.5 * SR); mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.1) * 0.9
open(f"{PUB}/mix.raw", "wb").write((mix * 32767).astype(np.int16).tobytes())
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", f"{PUB}/mix.raw",
                "-af", "loudnorm=I=-14:TP=-1", "-ar", "48000", "-b:a", "192k", f"{PUB}/audio.mp3"], check=True)
subprocess.run(["rm", f"{PUB}/mix.raw"])

for l in lines: del l["audio"]
json.dump({"fps": FPS, "duration": round(total, 3), "scenes": scenes, "lines": lines}, open(TL, "w"), ensure_ascii=False)

# sous-titres SRT pour YouTube
def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int((s % 1) * 1000):03d}"
with open(f"{EP}/sous-titres.srt", "w") as f:
    for k, l in enumerate(lines, 1):
        f.write(f"{k}\n{ts(l['start'])} --> {ts(l['start'] + l['dur'])}\n{l['text']}\n\n")
print("durée", round(total, 2), "s ;", [(s["name"], round(s["start"], 1)) for s in scenes])
