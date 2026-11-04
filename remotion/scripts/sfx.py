"""Génère public/sfx.wav : sound design synthétisé calé sur src/timeline.json."""
import json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TL = json.load(open(os.path.join(ROOT, 'src/timeline.json')))
SR = 48000
N = int(TL['duration'] * SR)
out = np.zeros((N, 2), np.float32)
rng = np.random.default_rng(3)
starts = {s[0]: s[1] for s in TL['scenes']}


def add(sig, t, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    if sig.ndim == 1:
        sig = np.stack([sig * (1 - max(0, pan)), sig * (1 + min(0, pan))], 1)
    j = min(N, i + len(sig))
    out[max(0, i):j] += gain * sig[max(0, -i):j - i]


def lp(x, a):  # filtre passe-bas 1 pôle à coefficient variable
    y = np.empty_like(x); acc = 0.0
    a = np.broadcast_to(a, x.shape)
    for k in range(len(x)):
        acc += a[k] * (x[k] - acc); y[k] = acc
    return y


def whoosh(d=0.55):
    n = int(d * SR); t = np.linspace(0, 1, n)
    env = np.sin(np.pi * t) ** 2
    noise = rng.standard_normal(n)
    cut = 0.02 + 0.25 * np.sin(np.pi * t) ** 3
    s = lp(noise, cut) - lp(lp(noise, cut), 0.01)
    s = s / (np.abs(s).max() + 1e-9) * env
    l = s * (1 - t) + 0.3 * s; r = s * t + 0.3 * s
    return np.stack([l, r], 1) * 0.8


def impact(d=1.4):
    n = int(d * SR); t = np.arange(n) / SR
    f = 38 + 90 * np.exp(-t * 18)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    click = rng.standard_normal(n) * np.exp(-t * 60) * 0.5
    crack = lp(rng.standard_normal(n), 0.3) * np.exp(-t * 9) * 0.6
    return np.tanh(1.6 * (boom + click + crack)) * 0.9


def pop():
    n = int(0.12 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (900 - 3000 * t) * t) * np.exp(-t * 40) * 0.35


def tick():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 250)) * 0.18


def key():
    n = int(0.04 * SR); t = np.arange(n) / SR
    return lp(rng.standard_normal(n), 0.5) * np.exp(-t * 160) * 0.22


def down_sweep(d=2.4):
    n = int(d * SR); t = np.arange(n) / SR
    f = 600 * np.exp(-t * 0.9)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t * 8) * np.exp(-t * 0.8) * 0.18


def ding():
    n = int(1.6 * SR); t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1318, .5), (1976, .3), (2637, .15)]) * np.exp(-t * 3) * 0.35


def riser(d=1.2):
    n = int(d * SR); t = np.linspace(0, 1, n)
    s = lp(rng.standard_normal(n), 0.02 + 0.3 * t ** 2) * t ** 2
    return s / (np.abs(s).max() + 1e-9) * 0.5


# --- coupes : whoosh centré sur chaque coupe
for name, a, b in TL['scenes'][1:]:
    add(whoosh(), a - 0.3, 0.55)

# --- accroche
add(impact(), 0.0, 0.8)
add(whoosh(0.45), 0.25, 0.35)
# --- impacts (tampons, PERDUE, etc.)
for t in [starts['Verdict'] + 1.15, starts['Verdict'] + 2.15, starts['Senat'] + 1.3, starts['Majorite'] + 1.3,
          starts['Enquetes'] + 3.3, starts['Bloque'] + 0.95, starts['Bloque'] + 4.1, starts['Bloque'] + 5.15]:
    add(impact(), t, 0.6)
# --- pops (cartes, puces)
for sc, offs in {'Hook': [1.5], 'Depouillement': [0.05], 'Verdict': [0.1, 2.7], 'Mobilisation': [0.15, 1.0, 1.5],
                 'Approbation': [1.0, 1.9], 'Chambre': [1.0, 2.0], 'Senat': [0.7, 1.7], 'Texas': [1.0, 1.25, 2.2],
                 'MaisonBlanche': [0.5], 'Jeffries': [0.1, 0.9, 1.5], 'Truth': [0.1, 1.9], 'WallStreet': [2.8],
                 'Monde': [2.9, 3.7], 'Question': [1.6], 'CTA': [0.05, 0.5, 0.9]}.items():
    for o in offs:
        add(pop(), starts[sc] + o, 0.9)
# --- compteurs : tics
for sc, a, d in [('Depouillement', 0.3, 3.4), ('Approbation', 0.3, 1.8), ('Chambre', 0.2, 1.9), ('Senat', 0.1, 1.4)]:
    for k in np.arange(0, d, 0.07 if d > 2 else 0.05):
        add(tick(), starts[sc] + a + k * (k / d) ** 0.3, 0.8)
# --- frappe clavier (Truth Social)
for st in [starts['Truth'] + 0.3, starts['Truth'] + 2.1]:
    for k in np.arange(0, 1.05, 0.055):
        add(key(), st + k + rng.uniform(-0.01, 0.01), 0.9, pan=rng.uniform(-.3, .3))
# --- Wall Street : chute
add(down_sweep(), starts['WallStreet'] + 0.9, 1.0)
# --- globe : riser + impact à l'arrivée de l'arc
add(riser(1.4), starts['Monde'] + 2.4, 0.6)
add(impact(), starts['Monde'] + 3.8, 0.4)
# --- CTA : clic + ding
add(key() * 2, starts['CTA'] + 2.05, 1.0)
add(ding(), starts['CTA'] + 2.1, 0.8)

# --- nappe : pulsation grave (battement 'news') + pad sombre
t = np.arange(N) / SR
bpm = 96; beat = 60 / bpm
ph = (t % beat) / beat
kick = np.sin(2 * np.pi * (45 + 60 * np.exp(-ph * beat * 30)) * ph * beat) * np.exp(-ph * beat * 9)
pad = sum(np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.1 * t)) for f in [55, 65.4, 82.4, 110]) / 4
bed = 0.22 * kick + 0.10 * pad
fade = np.minimum(1, t / 0.5) * np.minimum(1, (TL['duration'] - t) / 1.5)
out += np.stack([bed * fade] * 2, 1)

out /= max(1.0, np.abs(out).max() / 0.95)
pcm = (out * 32767).astype('<i2')
with wave.open(os.path.join(ROOT, 'public/sfx.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('ok', N / SR)
