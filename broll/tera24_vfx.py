#!/usr/bin/env python3
"""Habillage TERA24 + VFX sur une vidéo 1080x1920.
- Overlay : tag haut gauche (lieu « Ville, Pays » + date), logo TERA24 haut droite (fixe),
  titre en bas (titre + sous-titre) affiché au plus 5 s, avec glissement d'entrée/sortie.
- VFX : cercles rouges (tracé animé, suivi par images clés) et flèches rouges (pointe suivie, rebond).
Pas d'effets sonores : l'audio de l'entrée est recopié tel quel.

Usage : python3 tera24_vfx.py vfx.json entree.mp4 sortie.mp4
vfx.json : {"lieu": "...", "date": "...", "titre": "...", "sous_titre": "...", "titre_debut": 0, "titre_fin": 5,
            "cercles": [{"keys": [[t, x, y, r], ...]}], "fleches": [{"keys": [[t, x, y], ...], "angle": 135, "longueur": 230}]}
(angle = direction d'où vient la flèche, en degrés : 0 = de la droite, 90 = du haut, 180 = de la gauche)
"""
import json, math, os, subprocess, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
W, H, FPS = 1080, 1920, 30
K = W / 941                                   # échelle de la maquette d'origine (941x1672)
FONT = next((f for f in ('/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf', os.path.join(HERE, 'fonts', 'Inter-ExtraBold.ttf')) if os.path.exists(f)))
HAUT = 0.8                                    # échelle de l'étiquette lieu/date et du logo
RED, RED_D, WHITE = (200, 6, 14), (140, 0, 6), (252, 252, 252)

def font(sz): return ImageFont.truetype(FONT, sz)

def shadow(layer, off=(4, 7), blur=8, alpha=130):
    a = layer.getchannel('A').point(lambda v: v * alpha // 255)
    sh = Image.new('RGBA', layer.size, (0, 0, 0, 0)); sh.putalpha(a)
    sh = sh.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new('RGBA', layer.size, (0, 0, 0, 0)); out.alpha_composite(sh, off); out.alpha_composite(layer)
    return out

def gradient_box(w, h, top, bot, radius):
    g = Image.new('RGBA', (w, h))
    for y in range(h):
        u = y / max(h - 1, 1)
        g.paste(tuple(int(top[i] + (bot[i] - top[i]) * u) for i in range(3)) + (255,), (0, y, w, y + 1))
    m = Image.new('L', (w, h), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, w - 1, h - 1), radius, fill=255)
    g.putalpha(m); return g

def static_layer(lieu, date):
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    tag = Image.new('RGBA', (W, 420), (0, 0, 0, 0))
    f1, f2 = font(44), font(50)
    w1 = int(f1.getlength(lieu)) + 64; w2 = max(int(f2.getlength(date)) + 64, w1 + 24)
    x0, y1, h1, y2, h2 = 18, 197, 62, 256, 68
    white = Image.new('RGBA', (w2, h2), (0, 0, 0, 0))
    ImageDraw.Draw(white).rounded_rectangle((0, 0, w2 - 1, h2 - 1), 10, fill=WHITE)
    ImageDraw.Draw(white).text((w2 // 2, h2 // 2 + 1), date, font=f2, fill=RED, anchor='mm')
    red = gradient_box(w1, h1, (214, 18, 24), (160, 0, 8), 10)
    ImageDraw.Draw(red).text((w1 // 2, h1 // 2 + 1), lieu, font=f1, fill=WHITE, anchor='mm')
    tag.alpha_composite(white, (x0, y2)); tag.alpha_composite(red, (x0, y1))
    tag = shadow(tag)
    # réduit de 20 % (demande du 24/11) en gardant le coin haut gauche de l'étiquette au même endroit
    tag = tag.resize((round(tag.width * HAUT), round(tag.height * HAUT)), Image.LANCZOS)
    L.alpha_composite(tag, (round(x0 * (1 - HAUT)), round(y1 * (1 - HAUT))))
    logo = Image.open(os.path.join(HERE, 'overlay', 'tera24_logo.png')).convert('RGBA')
    droite = round(596 * K) + round(logo.width * K)          # bord droit d'origine du logo, gardé
    logo = logo.resize((round(logo.width * K * HAUT), round(logo.height * K * HAUT)), Image.LANCZOS)
    L.alpha_composite(logo, (droite - logo.width, round(118 * K)))
    return L

def wrap(text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if f.getlength(t) <= maxw or not cur: cur = t
        else: lines.append(cur); cur = w
    return lines + [cur]

def title_layer(titre, sous):
    ft, fs = font(60), font(39)
    bx0, bx1, tx = 55, 1058, 80
    tl = wrap(titre.upper(), ft, bx1 - tx - 22); sl = wrap(sous.upper(), fs, bx1 - tx - 22) if sous else []
    h = 22 + len(tl) * 66 + (26 + len(sl) * 45 if sl else 0) + 22
    by1 = 1773; by0 = by1 - h
    L = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
    # crochet rouge
    br = Image.new('RGBA', (W, H), (0, 0, 0, 0)); bd = ImageDraw.Draw(br)
    top, bot = by0 - 44, by1 + 38
    bd.rounded_rectangle((14, top, 172, top + 46), 9, fill=RED)
    bd.rounded_rectangle((14, top, 52, bot), 9, fill=RED)
    bd.rounded_rectangle((14, bot - 44, 172, bot), 9, fill=RED)
    L.alpha_composite(shadow(br, (3, 5), 6, 110))
    box = Image.new('RGBA', (W, H), (0, 0, 0, 0)); xd = ImageDraw.Draw(box)
    xd.rounded_rectangle((bx0, by0, bx1, by1), 8, fill=WHITE, outline=(205, 205, 205), width=2)
    L.alpha_composite(shadow(box, (4, 7), 8, 120)); d = ImageDraw.Draw(L)
    y = by0 + 18
    for line in tl: d.text((tx, y), line, font=ft, fill=RED); y += 66
    if sl:
        y += 6; d.line((tx, y, bx1 - 22, y), fill=RED, width=3); y += 16
        for line in sl: d.text((tx, y), line, font=fs, fill=RED); y += 45
    return L

def interp(keys, t):
    if t <= keys[0][0]: return keys[0][1:]
    for a, b in zip(keys, keys[1:]):
        if t <= b[0]:
            u = (t - a[0]) / (b[0] - a[0]); u = u * u * (3 - 2 * u)
            return [a[i] + (b[i] - a[i]) * u for i in range(1, len(a))]
    return keys[-1][1:]

def draw_supersampled(L, bbox, fn):
    x0, y0, x1, y1 = [int(v) for v in bbox]; x0, y0 = max(x0, 0), max(y0, 0); x1, y1 = min(x1, W), min(y1, H)
    if x1 <= x0 or y1 <= y0: return
    S = 2; tile = Image.new('RGBA', ((x1 - x0) * S, (y1 - y0) * S), (0, 0, 0, 0))
    fn(ImageDraw.Draw(tile), lambda x, y: ((x - x0) * S, (y - y0) * S), S)
    L.alpha_composite(tile.resize((x1 - x0, y1 - y0), Image.LANCZOS), (x0, y0))

def circle(L, t, c):
    t0, t1 = c['keys'][0][0], c['keys'][-1][0]
    if not (t0 <= t <= t1): return
    x, y, r = interp(c['keys'], t)
    prog = min((t - t0) / 0.35, 1.0); fade = min((t1 - t) / 0.2, 1.0)
    a = int(255 * max(fade, 0)); ext = 360 * prog
    def fn(d, P, S):
        for col, wd in (((0, 0, 0, a // 2), 17), ((235, 20, 20, a), 11)):
            (ax, ay), (bx, by) = P(x - r, y - r * 0.9), P(x + r, y + r * 0.9)
            d.arc((ax, ay, bx, by), -90, -90 + ext, fill=col, width=wd * S)
    draw_supersampled(L, (x - r - 20, y - r - 20, x + r + 20, y + r + 20), fn)

def arrow(L, t, f):
    t0, t1 = f['keys'][0][0], f['keys'][-1][0]
    if not (t0 <= t <= t1): return
    x, y = interp(f['keys'], t)
    ang = math.radians(f.get('angle', 135)); ln = f.get('longueur', 220)
    pop = min((t - t0) / 0.2, 1.0); fade = min((t1 - t) / 0.2, 1.0); a = int(255 * max(fade, 0))
    bob = 14 * math.sin(2 * math.pi * 1.6 * (t - t0))
    dx, dy = math.cos(ang), -math.sin(ang)          # direction d'où vient la flèche
    tipx, tipy = x + dx * (18 + bob), y + dy * (18 + bob)
    L_ = ln * pop; tailx, taily = tipx + dx * L_, tipy + dy * L_
    hl, hw = 62 * pop, 46 * pop; px, py = -dy, dx
    bx, by = tipx + dx * hl, tipy + dy * hl
    def fn(d, P, S):
        for col, wd, grow in (((0, 0, 0, a // 2), 30, 6), ((235, 20, 20, a), 20, 0)):
            d.line([P(tailx, taily), P(bx, by)], fill=col, width=wd * S)
            d.polygon([P(tipx - dx * grow * .5, tipy - dy * grow * .5), P(bx + px * (hw + grow), by + py * (hw + grow)),
                       P(bx - px * (hw + grow), by - py * (hw + grow))], fill=col)
    m = ln + 80
    draw_supersampled(L, (x - m, y - m, x + m, y + m), fn)

def main():
    cfg = json.load(open(sys.argv[1], encoding='utf-8')); src, out = sys.argv[2], sys.argv[3]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src],
                               capture_output=True, text=True).stdout)
    n = int(dur * FPS)
    ST = static_layer(cfg['lieu'], cfg['date'])
    TI = title_layer(cfg['titre'], cfg.get('sous_titre', ''))
    ta, tb = cfg.get('titre_debut', 0.0), min(cfg.get('titre_fin', 5.0), cfg.get('titre_debut', 0.0) + 5.0)
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-r', str(FPS), '-'],
                           stdout=subprocess.PIPE)
    enc = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
                            '-i', '-', '-i', src, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
                            '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for i in range(n):
        raw = dec.stdout.read(W * H * 3)
        if len(raw) < W * H * 3: break
        t = i / FPS
        fr = Image.frombytes('RGB', (W, H), raw).convert('RGBA')
        L = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        for c in cfg.get('cercles', []): circle(L, t, c)
        for f in cfg.get('fleches', []): arrow(L, t, f)
        fr.alpha_composite(L); fr.alpha_composite(ST)
        if ta <= t <= tb:
            u = min((t - ta) / 0.35, (tb - t) / 0.35, 1.0); u = 1 - (1 - max(u, 0)) ** 3
            fr.alpha_composite(TI, (int(-W * (1 - u)), 0))
        enc.stdin.write(fr.convert('RGB').tobytes())
    enc.stdin.close(); enc.wait(); dec.wait()
    print('OK', out)

if __name__ == '__main__':
    main()
