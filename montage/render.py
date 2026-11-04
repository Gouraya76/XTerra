#!/usr/bin/env python3
"""TERA24 — remontage "Trump perd le Congrès" (midterms 2026).

Rendu image par image (PIL) puis encodage ffmpeg avec la voix off MP3.
Usage: python3 render.py CLIPS_DIR VOICE_MP3 OUT_MP4 [--preview T1,T2,...]
Aucun sous-titre n'est incrusté (ajoutés ensuite par le monteur).
"""
import math, os, subprocess, sys
from functools import lru_cache
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageEnhance

W, H, FPS = 1080, 1920, 30
FONT_DIR = "/usr/share/fonts/opentype/inter/"

# ---------------------------------------------------------------- palette DA
RED = (214, 16, 32)
RED_D = (150, 6, 18)
RED_DD = (60, 4, 10)
WHITE = (255, 255, 255)
INK = (18, 12, 14)
BLUE = (40, 110, 230)
GREY = (90, 90, 96)


@lru_cache(None)
def F(size, w="Black", italic=False, display=True):
    name = ("InterDisplay-" if display else "Inter-") + w + ("Italic" if italic else "") + ".otf"
    return ImageFont.truetype(FONT_DIR + name, size)


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def eo(x):  # ease out cubic
    x = clamp(x)
    return 1 - (1 - x) ** 3


def eback(x):  # ease out back (léger rebond)
    x = clamp(x)
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def prog(t, start, dur):
    return clamp((t - start) / dur)


# ---------------------------------------------------------------- helpers
def text_size(txt, font):
    b = font.getbbox(txt)
    return b[2] - b[0], b[3] - b[1], b[0], b[1]


def label(txt, font, fg, bg, padx=18, pady=10, skew=0):
    """Pavé de texte façon TERA24 (fond plein, texte gras)."""
    tw, th, ox, oy = text_size(txt, font)
    im = Image.new("RGBA", (tw + 2 * padx + abs(skew), th + 2 * pady), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w_, h_ = im.size
    if skew:
        d.polygon([(skew, 0), (w_, 0), (w_ - skew, h_), (0, h_)], fill=bg)
    else:
        d.rectangle([0, 0, w_, h_], fill=bg)
    d.text((padx + abs(skew) // 2 - ox, pady - oy), txt, font=font, fill=fg)
    return im


def paste(canvas, im, x, y, alpha=1.0):
    if alpha <= 0:
        return
    if alpha < 1:
        im = im.copy()
        a = im.getchannel("A").point(lambda v: int(v * alpha))
        im.putalpha(a)
    canvas.alpha_composite(im, (int(x), int(y)))


def scaled(im, s):
    if abs(s - 1) < 1e-3:
        return im
    return im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.BICUBIC)


def pop(canvas, im, cx, cy, t, start, dur=0.35, out=None):
    """Apparition 'pop' centrée (scale + fade). out=(t_fin) pour disparition."""
    p = prog(t, start, dur)
    if p <= 0:
        return
    a = p
    if out is not None:
        a *= 1 - prog(t, out, 0.25)
    s = 0.6 + 0.4 * eback(p)
    im2 = scaled(im, s)
    paste(canvas, im2, cx - im2.width / 2, cy - im2.height / 2, a)


def slide(canvas, im, x, y, t, start, dur=0.4, dx=-500, dy=0, out=None):
    p = prog(t, start, dur)
    if p <= 0:
        return
    e = eo(p)
    a = clamp(p * 2)
    if out is not None:
        a *= 1 - prog(t, out, 0.25)
    paste(canvas, im, x + dx * (1 - e), y + dy * (1 - e), a)


# ---------------------------------------------------------------- branding
def make_logo(height=64):
    """Logo TERA24 : cartouche rouge incliné, TERA blanc italique, 24 rouge sur blanc."""
    f = F(int(height * 0.78), "Black", italic=True)
    tw, th, ox, oy = text_size("TERA", f)
    tw2, _, ox2, _ = text_size("24", f)
    sk = int(height * 0.28)
    box24 = tw2 + int(height * 0.35)
    Wl = sk + 18 + tw + 14 + box24 + sk + 12
    im = Image.new("RGBA", (Wl, height), (0, 0, 0, 0))
    # dégradé rouge
    grad = Image.new("RGBA", (Wl, height))
    gd = ImageDraw.Draw(grad)
    for yy in range(height):
        k = yy / height
        c = tuple(int(a + (b - a) * k) for a, b in zip((240, 40, 50), (130, 0, 12)))
        gd.line([(0, yy), (Wl, yy)], fill=c + (255,))
    mask = Image.new("L", (Wl, height), 0)
    ImageDraw.Draw(mask).polygon([(sk, 0), (Wl, 0), (Wl - sk, height), (0, height)], fill=255)
    im.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(im)
    d.line([(sk, 1), (Wl - 2, 1)], fill=(255, 140, 140, 255), width=2)
    x = sk + 10
    d.text((x - ox, (height - th) / 2 - oy), "TERA", font=f, fill=WHITE)
    bx = x + tw + 12
    bw = box24
    d.polygon([(bx + 8, 7), (bx + bw + 8, 7), (bx + bw - 2, height - 7), (bx - 2, height - 7)], fill=WHITE)
    d.text((bx + 3 + (bw - tw2) / 2 - ox2, (height - th) / 2 - oy), "24", font=f, fill=RED_D)
    return im


def make_tag(country="ÉTATS-UNIS", date="4 NOVEMBRE 2026"):
    a = label(country, F(30, "Black"), WHITE, RED_D, padx=16, pady=7)
    b = label(date, F(32, "Black"), RED_D, WHITE, padx=20, pady=9)
    im = Image.new("RGBA", (max(a.width, b.width + 16), a.height + b.height), (0, 0, 0, 0))
    im.alpha_composite(a, (0, 0))
    im.alpha_composite(b, (16, a.height))
    return im


def make_title(lines, size=62, bracket=True, width_pad=26):
    """Titre façon TERA24 : lignes sur pavés blancs, texte rouge, cadre rouge à gauche."""
    f = F(size, "ExtraBold", display=False)
    pads = [label(l, f, RED_D, WHITE, padx=width_pad, pady=12) for l in lines]
    gap = 10
    h = sum(p.height for p in pads) + gap * (len(pads) - 1)
    w = max(p.width for p in pads)
    off = 34
    im = Image.new("RGBA", (w + off + 10, h + 60), (0, 0, 0, 0))
    if bracket:  # cadre rouge derrière les pavés, comme sur TERA24
        ImageDraw.Draw(im).rectangle([0, 0, 120, im.height - 1], outline=RED, width=9)
    y = 30
    for i, p in enumerate(pads):
        im.alpha_composite(p, (off + (0 if i == 0 else 8), y))
        y += p.height + gap
    return im


# ---------------------------------------------------------------- backgrounds
class Clip:
    def __init__(self, d):
        self.dir = d
        self.n = len([f for f in os.listdir(d) if f.endswith(".jpg")])

    @lru_cache(maxsize=64)
    def frame(self, i):
        i = int(clamp(i, 0, self.n - 1))
        return Image.open(os.path.join(self.dir, "%04d.jpg" % (i + 1))).convert("RGB")


def kenburns(img, z, cx=0.5, cy=0.5):
    w, h = img.size
    cw, ch = w / z, h / z
    x0 = clamp(cx * w - cw / 2, 0, w - cw)
    y0 = clamp(cy * h - ch / 2, 0, h - ch)
    return img.resize((W, H), Image.BILINEAR, box=(x0, y0, x0 + cw, y0 + ch))


def grade(img, sat=1.05, con=1.08, red=0.0, dark=0.0):
    img = ImageEnhance.Contrast(ImageEnhance.Color(img).enhance(sat)).enhance(con)
    if red > 0:
        img = Image.blend(img, Image.new("RGB", img.size, (120, 0, 10)), red)
    if dark > 0:
        img = Image.blend(img, Image.new("RGB", img.size, (8, 4, 6)), dark)
    return img


@lru_cache(None)
def vignette():
    v = Image.new("L", (W // 4, H // 4), 0)
    d = ImageDraw.Draw(v)
    for i in range(60):
        k = i / 60
        a = int(200 * (1 - k) ** 2.2)
        d.ellipse([-W // 4 * 0.35 + i * 3, -H // 4 * 0.25 + i * 4, W // 4 * 1.35 - i * 3, H // 4 * 1.25 - i * 4], outline=a, width=4)
    v = v.filter(ImageFilter.GaussianBlur(18)).resize((W, H))
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    im.putalpha(v)
    return im


@lru_cache(None)
def graphic_bg():
    """Fond 'motion design' sombre avec halo rouge + trame."""
    im = Image.new("RGB", (W, H), (10, 6, 8))
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(glow)
    d.ellipse([-300, 300, W + 300, 1500], fill=(120, 6, 18))
    glow = glow.filter(ImageFilter.GaussianBlur(220))
    im = Image.blend(im, glow, 0.85)
    d = ImageDraw.Draw(im)
    for x in range(0, W, 60):
        d.line([(x, 0), (x, H)], fill=(40, 14, 18), width=1)
    for y in range(0, H, 60):
        d.line([(0, y), (W, y)], fill=(40, 14, 18), width=1)
    return im


@lru_cache(maxsize=8)
def blurred(clip_name, idx):
    c = CLIPS[clip_name]
    im = c.frame(idx).filter(ImageFilter.GaussianBlur(14))
    return grade(im, sat=0.6, con=1.0, red=0.35, dark=0.45)


# ---------------------------------------------------------------- graphiques
def hemicycle(canvas, cx, cy, r_in, r_out, total, n_blue, p, rows, dot):
    """Hémicycle animé : p∈[0,1] = proportion de sièges allumés (de gauche à droite)."""
    d = ImageDraw.Draw(canvas)
    seats = []
    radii = [r_in + (r_out - r_in) * i / (rows - 1) for i in range(rows)]
    tot_len = sum(radii)
    counts = [round(total * r / tot_len) for r in radii]
    counts[-1] += total - sum(counts)
    for r, n in zip(radii, counts):
        for j in range(n):
            a = math.pi * (1 - j / (n - 1))
            seats.append((a, r))
    seats.sort(key=lambda s: -s[0] + s[1] * 1e-6)
    lit = int(total * p)
    for k, (a, r) in enumerate(seats):
        x = cx + r * math.cos(a)
        y = cy - r * math.sin(a)
        if k < lit:
            col = BLUE if k < n_blue else RED
        else:
            col = (50, 40, 44)
        d.ellipse([x - dot, y - dot, x + dot, y + dot], fill=col)


def gauge(canvas, cx, cy, r, val, p):
    d = ImageDraw.Draw(canvas)
    w = 54
    d.arc([cx - r, cy - r, cx + r, cy + r], 180, 360, fill=(60, 44, 48), width=w)
    end = 180 + 180 * val * p
    if p > 0:
        d.arc([cx - r, cy - r, cx + r, cy + r], 180, end, fill=RED, width=w)


def counter(v):
    return str(int(round(v)))


# ---------------------------------------------------------------- scènes
# (début, fin) calés sur la voix off MP3 (80,8 s)
SC = [
    ("hook", 0.0, 7.25),
    ("depouillement", 7.25, 12.0),
    ("verdict", 12.0, 16.55),
    ("mobilisation", 16.55, 19.7),
    ("approbation", 19.7, 23.2),
    ("chambre", 23.2, 27.3),
    ("senat", 27.3, 30.35),
    ("texas", 30.35, 34.0),
    ("maisonblanche", 34.0, 36.8),
    ("majorite", 36.8, 41.6),
    ("bloque", 41.6, 48.1),
    ("enquetes", 48.1, 52.4),
    ("jeffries", 52.4, 55.7),
    ("truth", 55.7, 59.35),
    ("wallstreet", 59.35, 65.0),
    ("monde", 65.0, 71.2),
    ("question", 71.2, 77.0),
    ("cta", 77.0, 81.0),
]


def bg_clip(name, t, t0, dur, speed=1.0, z0=1.04, z1=1.14, cx=0.5, cy=0.5, **g):
    c = CLIPS[name]
    lt = t - t0
    idx = min(c.n - 1, lt * FPS * speed) if speed * dur * FPS <= c.n else (lt * FPS * (c.n - 1) / (dur * FPS))
    z = z0 + (z1 - z0) * (lt / dur)
    return grade(kenburns(c.frame(int(idx)), z, cx, cy), **g).convert("RGBA")


def scene_frame(name, t, t0, t1):
    lt = t - t0
    dur = t1 - t0
    cv = None

    if name == "hook":
        cv = bg_clip("trumpA", t, t0, dur, z0=1.12, z1=1.02, cy=0.42, red=0.05)
        cv.alpha_composite(vignette())
        # bande "ÉLECTIONS DE MI-MANDAT" + titre central
        tag = A["hook_kicker"]
        slide(cv, tag, 64, 700, lt, 0.15, dx=-700)
        title = A["hook_title"]
        p = prog(lt, 0.3, 0.55)
        if p > 0:
            # révélation par balayage gauche → droite
            wv = int(title.width * eo(p))
            crop = title.crop((0, 0, max(1, wv), title.height))
            paste(cv, crop, 40, 790, 1 - prog(lt, 6.6, 0.4))
        sub = A["hook_sub"]
        slide(cv, sub, 64, 790 + title.height + 10, lt, 1.4, dy=60, dx=0, out=6.6)

    elif name == "depouillement":
        cv = bg_clip("capW", t, t0, dur, z0=1.05, z1=1.2, cy=0.45, dark=0.25)
        cv.alpha_composite(vignette())
        slide(cv, A["dep_label"], 70, 1180, lt, 0.1)
        f = F(190, "Black")
        n = counter(50 * eo(prog(lt, 0.2, 1.4)))
        tx = n + " ÉTATS"
        im = label(tx, f, WHITE, (0, 0, 0, 0), padx=0, pady=0)
        slide(cv, im, 70, 1260, lt, 0.2, dx=0, dy=40)
        # barre de dépouillement
        d = ImageDraw.Draw(cv)
        x0, y0, x1 = 74, 1520, W - 74
        d.rectangle([x0, y0, x1, y0 + 44], fill=(255, 255, 255, 60))
        pp = 0.97 * eo(prog(lt, 0.6, 3.2))
        d.rectangle([x0, y0, x0 + (x1 - x0) * pp, y0 + 44], fill=RED)
        pct = label("%d %% DÉPOUILLÉ" % round(pp * 100), F(40, "Black"), RED_D, WHITE, padx=14, pady=8)
        paste(cv, pct, x0, y0 + 64, clamp(prog(lt, 0.6, 0.3)))

    elif name == "verdict":
        cv = Image.blend(blurred("capS", 60), graphic_bg(), 0.35).convert("RGBA")
        slide(cv, A["verdict_label"], 70, 560, lt, 0.05)
        rows = [("CHAMBRE DES", "REPRÉSENTANTS", 0.35), ("SÉNAT", "", 1.0)]
        y = 720
        for i, (a, b, st) in enumerate(rows):
            card = A["verdict_card%d" % i]
            slide(cv, card, 70, y, lt, st, dx=-900)
            stamp = A["stamp_bascule"]
            if lt > st + 0.6:
                pop(cv, stamp, W - 250, y + card.height / 2 + 6, lt, st + 0.6, 0.3)
            y += card.height + 60
        pop(cv, A["verdict_bottom"], W / 2, 1520, lt, 2.4)

    elif name == "mobilisation":
        cv = bg_clip("voter", t, t0, dur, speed=0.5, z0=1.15, z1=1.25, cx=0.65, red=0.06)
        cv.alpha_composite(vignette())
        slide(cv, A["mob_label"], 70, 1180, lt, 0.1)
        slide(cv, A["mob_title"], 60, 1250, lt, 0.25, dx=-900)
        slide(cv, A["mob_chip1"], 70, 1250 + A["mob_title"].height + 30, lt, 0.9, dx=0, dy=50)
        slide(cv, A["mob_chip2"], 70, 1250 + A["mob_title"].height + 30 + A["mob_chip1"].height + 16, lt, 1.3, dx=0, dy=50)

    elif name == "approbation":
        cv = graphic_bg().copy().convert("RGBA")
        slide(cv, A["app_label"], 70, 470, lt, 0.05)
        p = eo(prog(lt, 0.3, 1.6))
        gauge(cv, W // 2, 1060, 360, 0.38, p)
        f = F(210, "Black")
        n = label("%d%%" % round(38 * p), f, WHITE, (0, 0, 0, 0), 0, 0)
        paste(cv, n, W / 2 - n.width / 2, 860, clamp(prog(lt, 0.3, 0.3)))
        pop(cv, A["app_sub"], W / 2, 1190, lt, 0.9)
        pop(cv, A["app_low"], W / 2, 1330, lt, 1.8)

    elif name == "chambre":
        cv = graphic_bg().copy().convert("RGBA")
        slide(cv, A["ch_label"], 70, 400, lt, 0.05)
        p = eo(prog(lt, 0.25, 2.0))
        hemicycle(cv, W // 2, 1030, 190, 470, 435, 252, p, 12, 9)
        d = ImageDraw.Draw(cv)
        # trait de majorité (218 sièges = moitié + 1)
        a = math.pi * (1 - 218 / 435)
        if lt > 1.2:
            al = int(255 * prog(lt, 1.2, 0.3))
            d.line([(W // 2 + 170 * math.cos(a), 1030 - 170 * math.sin(a)),
                    (W // 2 + 500 * math.cos(a), 1030 - 500 * math.sin(a))], fill=(255, 255, 255, al), width=5)
            paste(cv, A["ch_maj"], W // 2 + 30, 500, prog(lt, 1.2, 0.3))
        n = label(counter(252 * p), F(150, "Black"), BLUE, (0, 0, 0, 0), 0, 0)
        paste(cv, n, W / 2 - n.width / 2, 900, clamp(prog(lt, 0.25, 0.3)))
        pop(cv, A["ch_sub"], W / 2, 1150, lt, 1.0)
        pop(cv, A["ch_note"], W / 2, 1270, lt, 1.6)

    elif name == "senat":
        cv = graphic_bg().copy().convert("RGBA")
        slide(cv, A["se_label"], 70, 400, lt, 0.05)
        p = eo(prog(lt, 0.15, 1.5))
        hemicycle(cv, W // 2, 1030, 220, 440, 100, 51, p, 5, 17)
        n = label(counter(51 * p), F(150, "Black"), BLUE, (0, 0, 0, 0), 0, 0)
        paste(cv, n, W / 2 - n.width / 2, 900, clamp(prog(lt, 0.15, 0.3)))
        pop(cv, A["se_sub"], W / 2, 1150, lt, 0.7)
        pop(cv, A["se_plus6"], W / 2, 1290, lt, 1.3)

    elif name == "texas":
        cv = Image.blend(bg_clip("gates", t, t0, dur, z0=1.05, z1=1.15).convert("RGB"),
                         Image.new("RGB", (W, H), (20, 4, 8)), 0.55).convert("RGBA")
        slide(cv, A["tx_label"], 70, 420, lt, 0.05)
        slide(cv, A["tx_title"], 60, 490, lt, 0.15, dx=-900)
        face = A["tx_face"]
        fy = 760
        p = eo(prog(lt, 0.4, 0.5))
        paste(cv, face, 70, fy + 60 * (1 - p), p)
        slide(cv, A["tx_name"], 70, fy + face.height - 4, lt, 0.6, dx=0, dy=40)
        slide(cv, A["tx_beats"], 70, fy + face.height + A["tx_name"].height + 10, lt, 0.9, dx=0, dy=40)
        pop(cv, A["tx_1988"], W / 2, 1530, lt, 1.6)

    elif name == "maisonblanche":
        cv = bg_clip("wh", t, t0, dur, z0=1.18, z1=1.28, cx=0.62, cy=0.4, red=0.04)
        cv.alpha_composite(vignette())
        slide(cv, A["wh_label"], 70, 1150, lt, 0.05)
        slide(cv, A["wh_title"], 60, 1220, lt, 0.2, dx=-900)

    elif name == "majorite":
        cv = bg_clip("trumpB", t, t0, dur, z0=1.08, z1=1.2, cy=0.4, sat=0.9)
        cv.alpha_composite(vignette())
        slide(cv, A["maj_label"], 70, 1180, lt, 0.1)
        slide(cv, A["maj_title"], 60, 1250, lt, 0.3, dx=-900)
        if lt > 1.3:
            pop(cv, A["stamp_perdue"], W / 2 + 120, 1250 + A["maj_title"].height + 110, lt, 1.3, 0.3)

    elif name == "bloque":
        cv = Image.blend(bg_clip("capS", t, t0, dur, z0=1.05, z1=1.12, cx=0.3).convert("RGB"),
                         Image.new("RGB", (W, H), (20, 4, 8)), 0.6).convert("RGBA")
        slide(cv, A["bl_label"], 70, 470, lt, 0.05)
        items = [("RÉFORMES FISCALES", 0.4), ("BUDGETS", 3.55), ("NOMINATIONS JUDICIAIRES", 4.6)]
        y = 600
        for i, (txt, st) in enumerate(items):
            card = A["bl_item%d" % i]
            slide(cv, card, 70, y, lt, st, dx=-900)
            if lt > st + 0.45:
                pop(cv, A["cross"], W - 160, y + card.height / 2, lt, st + 0.45, 0.25)
            y += card.height + 40

    elif name == "enquetes":
        cv = Image.blend(blurred("capW", 30), graphic_bg(), 0.4).convert("RGBA")
        slide(cv, A["enq_label"], 70, 470, lt, 0.05)
        pop(cv, A["enq_big"], W / 2, 760, lt, 0.2)
        slide(cv, A["enq_c1"], 70, 960, lt, 0.9, dx=0, dy=50)
        slide(cv, A["enq_c2"], 70, 960 + A["enq_c1"].height + 20, lt, 2.6, dx=0, dy=50)
        slide(cv, A["enq_c3"], 70, 960 + 2 * (A["enq_c1"].height + 20), lt, 3.2, dx=0, dy=50)

    elif name == "jeffries":
        cv = graphic_bg().copy().convert("RGBA")
        slide(cv, A["jf_label"], 70, 420, lt, 0.05)
        face = A["jf_face"]
        p = eo(prog(lt, 0.15, 0.5))
        zz = 1 + 0.05 * (lt / dur)
        f2 = scaled(face, zz).crop((0, 0, face.width, face.height))
        paste(cv, f2, 70, 520 + 60 * (1 - p), p)
        slide(cv, A["jf_name"], 70, 520 + face.height - 4, lt, 0.4, dx=0, dy=40)
        slide(cv, A["jf_role"], 70, 520 + face.height + A["jf_name"].height + 10, lt, 0.7, dx=0, dy=40)
        pop(cv, A["jf_first"], W / 2, 1450, lt, 1.3)

    elif name == "truth":
        cv = Image.blend(bg_clip("trumpA", t, t0, dur, z0=1.3, z1=1.4, cy=0.35).convert("RGB"),
                         Image.new("RGB", (W, H), (20, 4, 8)), 0.6).filter(ImageFilter.GaussianBlur(6)).convert("RGBA")
        card = A["truth_card"]
        p = eback(prog(lt, 0.1, 0.45))
        c2 = scaled(card, 0.7 + 0.3 * p)
        ang = -3 * (1 - eo(prog(lt, 0.1, 0.6))) + 1.5
        c2 = c2.rotate(ang, resample=Image.BICUBIC, expand=True)
        paste(cv, c2, W / 2 - c2.width / 2, 760 - c2.height / 2, clamp(prog(lt, 0.1, 0.2)))
        card2 = A["truth_card2"]
        if lt > 1.9:
            c3 = card2.rotate(-2, resample=Image.BICUBIC, expand=True)
            slide(cv, c3, W / 2 - c3.width / 2, 1130, lt, 1.9, dx=0, dy=120)

    elif name == "wallstreet":
        cv = graphic_bg().copy().convert("RGBA")
        slide(cv, A["ws_label"], 70, 420, lt, 0.05)
        slide(cv, A["ws_title"], 60, 490, lt, 0.15, dx=-900)
        # courbe des contrats à terme
        d = ImageDraw.Draw(cv)
        x0, x1, ytop, ybot = 90, W - 90, 800, 1350
        for k in range(5):
            yy = ytop + (ybot - ytop) * k / 4
            d.line([(x0, yy), (x1, yy)], fill=(70, 40, 44), width=2)
        pts = []
        import random
        rnd = random.Random(7)
        n = 60
        v = 0.25
        for i in range(n):
            if i < 22:
                v += rnd.uniform(-0.02, 0.025)
            else:
                v += rnd.uniform(0.0, 0.045) if i < 50 else rnd.uniform(-0.01, 0.02)
            pts.append((x0 + (x1 - x0) * i / (n - 1), ytop + (ybot - ytop) * clamp(v, 0.05, 0.95)))
        p = eo(prog(lt, 0.4, 2.4))
        m = max(2, int(n * p))
        d.line(pts[:m], fill=RED, width=9, joint="curve")
        ex, ey = pts[m - 1]
        d.ellipse([ex - 16, ey - 16, ex + 16, ey + 16], fill=WHITE)
        d.ellipse([ex - 9, ey - 9, ex + 9, ey + 9], fill=RED)
        val = -2.0 * clamp((m - 22) / (n - 22), 0, 1)
        big = label("%.1f %%" % val if val < 0 else "0.0 %", F(170, "Black"), RED if val < 0 else WHITE, (0, 0, 0, 0), 0, 0)
        paste(cv, big, W / 2 - big.width / 2, 1420, clamp(prog(lt, 0.4, 0.3)))
        pop(cv, A["ws_sub"], W / 2, 1680, lt, 2.6)

    elif name == "monde":
        cv = Image.blend(bg_clip("wh", t, t0, dur, z0=1.25, z1=1.4, cx=0.55, cy=0.35).convert("RGB"),
                         Image.new("RGB", (W, H), (20, 4, 8)), 0.62).convert("RGBA")
        slide(cv, A["mo_label"], 70, 560, lt, 0.05)
        pop(cv, A["mo_big"], W / 2, 760, lt, 0.2)
        slide(cv, A["mo_c1"], 70, 940, lt, 2.9, dx=0, dy=50)
        slide(cv, A["mo_c2"], 70, 940 + A["mo_c1"].height + 20, lt, 3.7, dx=0, dy=50)
        slide(cv, A["mo_c3"], 70, 940 + 2 * (A["mo_c1"].height + 20), lt, 4.3, dx=0, dy=50)

    elif name == "question":
        cv = bg_clip("trumpA", t, t0, dur, z0=1.05, z1=1.25, cy=0.4, red=0.08)
        cv.alpha_composite(vignette())
        title = A["q_title"]
        p = prog(lt, 0.2, 0.55)
        if p > 0:
            wv = int(title.width * eo(p))
            paste(cv, title.crop((0, 0, max(1, wv), title.height)), 40, 820)
        slide(cv, A["q_sub"], 64, 820 + title.height + 10, lt, 1.0, dx=0, dy=60)

    elif name == "cta":
        cv = graphic_bg().copy().convert("RGBA")
        logo = A["logo_big"]
        pop(cv, logo, W / 2, 780, lt, 0.05, 0.45)
        pop(cv, A["cta_1"], W / 2, 1000, lt, 0.5)
        pop(cv, A["cta_2"], W / 2, 1130, lt, 0.8)
        # bouton s'abonner qui "pulse"
        s = 1 + 0.04 * math.sin(lt * 6)
        btn = scaled(A["cta_btn"], s)
        if lt > 1.2:
            paste(cv, btn, W / 2 - btn.width / 2, 1300 - btn.height / 2, prog(lt, 1.2, 0.3))
        fade = prog(lt, dur - 0.5, 0.5)
        if fade > 0:
            cv.alpha_composite(Image.new("RGBA", (W, H), (0, 0, 0, int(255 * fade))))
    return cv


# ---------------------------------------------------------------- assets
def build_assets(clips_dir):
    A = {}
    lab = lambda s: label(s, F(36, "Black"), WHITE, RED, padx=18, pady=10)
    card = lambda s, size=58: label(s, F(size, "ExtraBold", display=False), RED_D, WHITE, padx=26, pady=16)
    wcard = lambda s, size=44: label(s, F(size, "Bold", display=False), WHITE, (0, 0, 0, 150), padx=22, pady=14)
    big = lambda s, size=120, col=WHITE: label(s, F(size, "Black"), col, (0, 0, 0, 0), 0, 0)

    A["logo"] = make_logo(62)
    A["logo_big"] = make_logo(140)
    A["tag"] = make_tag()
    A["hook_kicker"] = lab("ÉLECTIONS DE MI-MANDAT")
    A["hook_title"] = make_title(["C'est officiel :", "Donald Trump perd", "le contrôle du Congrès"], size=74)
    A["hook_sub"] = wcard("Un revers historique aux États-Unis", 40)

    A["dep_label"] = lab("DÉPOUILLEMENT")

    A["verdict_label"] = lab("LE VERDICT DES URNES")
    for i, (a, b) in enumerate([("CHAMBRE DES", "REPRÉSENTANTS"), ("SÉNAT", None)]):
        f = F(58, "Black")
        f2 = F(40, "Bold", display=False)
        lines = [a] + ([b] if b else [])
        h = 70 * len(lines) + 90
        im = Image.new("RGBA", (W - 140, h), WHITE + (255,))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 16, h], fill=RED)
        y = 26
        for l in lines:
            d.text((44, y), l, font=f, fill=INK)
            y += 70
        d.text((44, y + 4), "→ DÉMOCRATES", font=f2, fill=BLUE)
        A["verdict_card%d" % i] = im
    st = label("BASCULE", F(46, "Black"), WHITE, RED, padx=20, pady=12)
    A["stamp_bascule"] = st.rotate(-8, resample=Image.BICUBIC, expand=True)
    A["verdict_bottom"] = card("Revers cinglant pour les républicains", 46)

    A["mob_label"] = lab("PARTICIPATION")
    A["mob_title"] = make_title(["Mobilisation", "record"], size=80, bracket=False)
    A["mob_chip1"] = wcard("● Colère sur le pouvoir d'achat")
    A["mob_chip2"] = wcard("● Tensions institutionnelles")

    A["app_label"] = lab("SONDAGES SORTIE DES URNES")
    A["app_sub"] = card("approuvent l'action de Trump", 50)
    A["app_low"] = wcard("Niveau historiquement bas pour un président à mi-mandat", 34)

    A["ch_label"] = lab("CHAMBRE DES REPRÉSENTANTS")
    A["ch_maj"] = label("MAJORITÉ : 218", F(34, "Black"), INK, WHITE, 14, 8)
    A["ch_sub"] = card("sièges démocrates (au moins)", 46)
    A["ch_note"] = wcard("Selon les projections · 435 sièges", 34)

    A["se_label"] = lab("SÉNAT")
    A["se_sub"] = card("sièges : majorité démocrate", 46)
    A["se_plus6"] = label("+6 ÉTATS ARRACHÉS AUX RÉPUBLICAINS", F(40, "Black"), WHITE, RED, 20, 12)

    A["tx_label"] = lab("TEXAS")
    A["tx_title"] = make_title(["Le bastion républicain", "tombe"], size=66, bracket=False)
    face = Image.open(os.path.join(clips_dir, "face_tallarico.png")).convert("RGB")
    fw = W - 140
    face = face.resize((fw, int(face.height * fw / face.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(3, 80))
    fr = Image.new("RGBA", (fw, face.height), RED + (255,))
    fr.paste(face, (0, 0))
    ImageDraw.Draw(fr).rectangle([0, 0, fw - 1, face.height - 1], outline=RED, width=8)
    A["tx_face"] = fr
    A["tx_name"] = label("JAMES TALARICO", F(60, "Black"), RED_D, WHITE, padx=26, pady=14)
    A["tx_beats"] = label("bat Ken Paxton", F(44, "Bold", display=False), WHITE, RED, padx=22, pady=12)
    A["tx_1988"] = card("1er démocrate élu sénateur du Texas depuis 1988", 38)

    A["wh_label"] = lab("MAISON-BLANCHE")
    A["wh_title"] = make_title(["2 ans de mandat", "sous haute tension"], size=74, bracket=False)

    A["maj_label"] = lab("ADMINISTRATION TRUMP")
    A["maj_title"] = make_title(["Majorité", "automatique"], size=80, bracket=False)
    st = label("PERDUE", F(80, "Black"), WHITE, RED, padx=30, pady=14)
    A["stamp_perdue"] = st.rotate(-7, resample=Image.BICUBIC, expand=True)

    A["bl_label"] = lab("CE QUI EST DÉSORMAIS MENACÉ")
    for i, s in enumerate(["Réformes fiscales", "Budgets", "Nominations judiciaires"]):
        im = Image.new("RGBA", (W - 140, 150), WHITE + (255,))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, 16, 150], fill=RED)
        d.text((48, 42), s, font=F(60, "ExtraBold", display=False), fill=INK)
        A["bl_item%d" % i] = im
    cr = Image.new("RGBA", (130, 130), (0, 0, 0, 0))
    d = ImageDraw.Draw(cr)
    d.ellipse([0, 0, 129, 129], fill=RED)
    d.line([(38, 38), (92, 92)], fill=WHITE, width=16)
    d.line([(92, 38), (38, 92)], fill=WHITE, width=16)
    A["cross"] = cr

    A["enq_label"] = lab("L'OPPOSITION À L'OFFENSIVE")
    A["enq_big"] = make_title(["Commissions", "d'enquête"], size=96, bracket=False)
    A["enq_c1"] = wcard("● Enquêtes parlementaires sur 2 ans", 40)
    A["enq_c2"] = wcard("● Blocage des décrets controversés", 40)
    A["enq_c3"] = wcard("● Cohabitation explosive à Washington", 40)

    A["jf_label"] = lab("EN JANVIER")
    face = Image.open(os.path.join(clips_dir, "face_jeffries.png")).convert("RGB")
    face = face.resize((fw, int(face.height * fw / face.width)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(3, 80))
    fr = Image.new("RGBA", (fw, face.height), RED + (255,))
    fr.paste(face, (0, 0))
    ImageDraw.Draw(fr).rectangle([0, 0, fw - 1, face.height - 1], outline=RED, width=8)
    A["jf_face"] = fr
    A["jf_name"] = label("HAKEEM JEFFRIES", F(60, "Black"), RED_D, WHITE, padx=26, pady=14)
    A["jf_role"] = label("futur président de la Chambre", F(44, "Bold", display=False), WHITE, RED, padx=22, pady=12)
    A["jf_first"] = card("Le 1er président noir de l'histoire de la Chambre", 36)

    # cartes Truth Social (style communiqué, liseré rouge TERA24)
    def truth(lines, head, w=900):
        fq = F(46, "BoldItalic", display=False)
        h = 200 + 62 * len(lines)
        im = Image.new("RGBA", (w, h), (250, 247, 242, 255))
        d = ImageDraw.Draw(im)
        d.rectangle([0, 0, w, 14], fill=RED)
        d.text((40, 44), "DONALD TRUMP · TRUTH SOCIAL", font=F(30, "Black"), fill=INK)
        d.text((40, 90), head, font=F(26, "Bold", display=False), fill=RED)
        d.line([(40, 132), (w - 40, 132)], fill=(200, 190, 190), width=2)
        y = 156
        for l in lines:
            d.text((40, y), l, font=fq, fill=INK)
            y += 62
        return im
    A["truth_card"] = truth(["« Je n'étais pas sur le bulletin,", "et si je l'avais été, nous aurions", "gagné haut la main ! »"], "COMMUNIQUÉ · MARDI 3 NOVEMBRE")
    A["truth_card2"] = truth(["Puis il félicite les démocrates :", "« hâte de travailler avec eux", "pour le bien du pays »"], "QUELQUES HEURES PLUS TARD", w=860)

    A["ws_label"] = lab("WALL STREET")
    A["ws_title"] = make_title(["Les marchés", "décrochent"], size=80, bracket=False)
    A["ws_sub"] = card("Contrats à terme : jusqu'à -2 %", 46)

    A["mo_label"] = lab("ONDE DE CHOC MONDIALE")
    A["mo_big"] = make_title(["Un séisme", "politique"], size=100, bracket=False)
    A["mo_c1"] = wcard("● Relations commerciales internationales", 38)
    A["mo_c2"] = wcard("● Équilibres géopolitiques en Europe", 38)
    A["mo_c3"] = wcard("● Fin de mandat sous blocage ?", 38)

    A["q_title"] = make_title(["Donald Trump peut-il", "encore gouverner ?"], size=76)
    A["q_sub"] = wcard("Donne ton avis en commentaire", 42)

    A["cta_1"] = card("Donne ton avis en commentaire", 50)
    A["cta_2"] = wcard("L'actu qui compte, chaque jour", 40)
    A["cta_btn"] = label("ABONNE-TOI", F(70, "Black"), WHITE, RED, padx=50, pady=24)
    return A


# ---------------------------------------------------------------- compositing
def frame_at(t):
    for name, t0, t1 in SC:
        if t0 <= t < t1:
            break
    cv = scene_frame(name, t, t0, t1)
    lt = t - t0
    # habillage permanent : tag haut-gauche + logo haut-droite (comme sur TERA24)
    if name != "cta":
        a = clamp(prog(t, 0.0, 0.3))
        paste(cv, A["tag"], 52, 160, a)
        lg = A["logo"]
        paste(cv, lg, W - lg.width - 30, 150, a)
    # transitions : punch + flash aux coupes
    if t0 > 0 and lt < 0.12:
        k = 1 - lt / 0.12
        cv.alpha_composite(Image.new("RGBA", (W, H), (255, 255, 255, int(150 * k))))
        z = 1 + 0.06 * k
        cv = kenburns(cv, z)
    if t0 > 0 and lt < 0.2:
        # liseré rouge de transition
        d = ImageDraw.Draw(cv)
        y = int(H * (lt / 0.2))
        d.rectangle([0, y - 30, W, y], fill=RED + (255,))
    return cv.convert("RGB")


def main():
    global CLIPS, A
    clips_dir, voice, out = sys.argv[1:4]
    CLIPS = {n: Clip(os.path.join(clips_dir, n)) for n in ["trumpA", "trumpB", "capW", "gates", "voter", "wh", "capS"]}
    A = build_assets(clips_dir)
    if len(sys.argv) > 4 and sys.argv[4] == "--preview":
        ts = [float(x) for x in sys.argv[5].split(",")]
        for t in ts:
            frame_at(t).save(out.replace(".mp4", "_%05.2f.jpg" % t), quality=85)
        return
    dur = SC[-1][2]
    nf = int(dur * FPS)
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H), "-r", str(FPS),
           "-i", "-", "-i", voice, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(nf):
        p.stdin.write(frame_at(i / FPS).tobytes())
        if i % 150 == 0:
            print("frame", i, "/", nf, flush=True)
    p.stdin.close()
    p.wait()


if __name__ == "__main__":
    main()
