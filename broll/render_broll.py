#!/usr/bin/env python3
"""Montage B-roll « images seules » : photos plein cadre, zoom lent (Ken Burns),
coupes franches, calées sur la voix off. Aucun texte, aucun effet sonore.

Usage : python3 render_broll.py timeline.json voix.mp3 sortie.mp4 [--size 1080x960] [--fps 30]
timeline.json : {"end": 87.1, "shots": [[debut_s, "chemin/image"], ...]}
"""
import json, subprocess, sys, os
from PIL import Image

args = sys.argv[1:]
tl_path, voice, out = args[:3]
W, H = 1080, 960
FPS = 30
if '--size' in args: W, H = map(int, args[args.index('--size') + 1].split('x'))
if '--fps' in args: FPS = int(args[args.index('--fps') + 1])

tl = json.load(open(tl_path))
base = os.path.dirname(os.path.abspath(tl_path))
shots = tl['shots']; end = tl['end']
total = int(round(end * FPS))

# Mouvements alternés : zoom avant, zoom arrière, glissements latéraux
MOVES = [
    dict(z0=1.00, z1=1.12, x0=0.5, x1=0.5, y0=0.5, y1=0.45),
    dict(z0=1.12, z1=1.00, x0=0.5, x1=0.5, y0=0.5, y1=0.5),
    dict(z0=1.08, z1=1.14, x0=0.35, x1=0.65, y0=0.5, y1=0.5),
    dict(z0=1.00, z1=1.10, x0=0.55, x1=0.45, y0=0.55, y1=0.45),
    dict(z0=1.08, z1=1.14, x0=0.65, x1=0.35, y0=0.5, y1=0.5),
]

def load(p):
    im = Image.open(os.path.join(base, p)).convert('RGB')
    # pré-échelle « cover » x1.2 pour garder du détail pendant le zoom
    s = max(W / im.width, H / im.height) * 1.2
    if s < 1:
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
    return im

ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
    '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', voice,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out],
    stdin=subprocess.PIPE)

for i, (t0, path) in enumerate(shots):
    t1 = shots[i + 1][0] if i + 1 < len(shots) else end
    f0, f1 = int(round(t0 * FPS)), min(int(round(t1 * FPS)), total)
    im = load(path); m = MOVES[i % len(MOVES)]
    cover = max(W / im.width, H / im.height)
    n = max(f1 - f0, 1)
    for f in range(f1 - f0):
        u = f / n
        z = m['z0'] + (m['z1'] - m['z0']) * u
        cx = m['x0'] + (m['x1'] - m['x0']) * u
        cy = m['y0'] + (m['y1'] - m['y0']) * u
        sw, sh = W / (cover * z), H / (cover * z)          # taille de la fenêtre source
        x = (im.width - sw) * cx; y = (im.height - sh) * cy
        fr = im.transform((W, H), Image.EXTENT, (x, y, x + sw, y + sh), Image.BICUBIC)
        ff.stdin.write(fr.tobytes())
    print(f'plan {i+1:02d}/{len(shots)} {t0:5.1f}s {path}', flush=True)

ff.stdin.close(); ff.wait()
print('OK', out)
