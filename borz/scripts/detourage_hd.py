"""Détourage HD des personnages BORZ.

1. Masque IA (rembg isnet) sur la planche d'origine + nettoyage (detourage.py).
2. Masque agrandi x4 sur la planche agrandie par Real-ESRGAN.
3. Bord affiné au pixel près à partir de l'image HD (le fond est noir pur :
   l'opacité du bord vient de la luminosité réelle des pixels, pas d'un masque flou).
4. Décontamination : on retire le noir du fond mélangé dans les pixels du bord (pas de liseré).
"""
import sys, numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, "scripts")
from detourage import CROPS, cut  # noqa: E402

SRC, OUT = "source", "personnages"
S = 4
BAND = 10          # demi-largeur de la zone de bord affinée (pixels HD)
LO, HI = 10, 34    # rampe d'opacité selon la luminosité (fond noir ~0-6)
MAXH = 2400        # hauteur maximale des PNG finaux

only = set(sys.argv[1:])
cache = {}
for fname, name, box in CROPS:
    if only and name not in only:
        continue
    lo = Image.open(f"{SRC}/{fname}").convert("RGB").crop(box)
    a_lo = cut(lo)                                   # alpha propre, résolution d'origine
    if fname not in cache:
        cache[fname] = Image.open(f"{SRC}/x4/{fname}").convert("RGB")
    hd = np.asarray(cache[fname].crop(tuple(v * S for v in box))).astype(np.float32)
    a_up = np.asarray(Image.fromarray(a_lo).resize((hd.shape[1], hd.shape[0]), Image.BICUBIC)).astype(np.float32) / 255

    inside = a_up > 0.5
    core = ndimage.binary_erosion(inside, iterations=BAND)
    zone = ndimage.binary_dilation(inside, iterations=BAND)
    band = zone & ~core
    bright = hd.max(axis=2)
    a_col = np.clip((bright - LO) / (HI - LO), 0, 1)
    # dans la bande : opacité dictée par l'image HD ; partie sombre côté intérieur gardée par le masque
    inner = ndimage.binary_erosion(inside, iterations=3)
    a_band = np.where(inner, np.maximum(a_col, a_up), a_col * np.clip(a_up * 3, 0, 1))
    alpha = np.where(core, 1.0, np.where(band, a_band, 0.0))
    # petites miettes isolées dehors
    lab, n = ndimage.label(alpha > 0.05)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        alpha[(lab > 0) & ~np.isin(lab, np.nonzero(sizes > 400)[0] + 1)] = 0
    # petits trous fermés (entre les lacets, plis sombres) : ce n'est pas du fond -> on bouche
    solid = alpha > 0.5
    holes, nh = ndimage.label(ndimage.binary_fill_holes(solid) & ~solid)
    if nh:
        hs = ndimage.sum(np.ones_like(holes), holes, range(1, nh + 1))
        small = np.isin(holes, np.nonzero(hs < 3000)[0] + 1)
        alpha[small] = 1.0
    # reflets du sol sous les semelles : on rabote les fines saletés du bas de l'image
    h0 = int(alpha.shape[0] * 0.9)
    bot = alpha[h0:] > 0.5
    opened = ndimage.binary_opening(bot, structure=np.ones((3, 3)), iterations=5)
    opened = ndimage.binary_dilation(opened, iterations=2) & bot
    below = np.zeros_like(opened); below[:-7] = opened[7:]
    opened &= below          # retire la bande de reflet collée sous la semelle (7 px HD)
    alpha[h0:] = np.where(opened, alpha[h0:], 0)
    # léger anti-crénelage (0,6 px) pour un bord net mais pas en escalier
    alpha = np.clip(ndimage.gaussian_filter(alpha, 0.6), 0, 1)
    alpha[alpha < 0.03] = 0
    # décontamination du fond noir
    rgb = np.where(alpha[..., None] > 0.02, hd / np.maximum(alpha[..., None], 0.02), hd)
    rgb = np.where(alpha[..., None] < 0.999, np.minimum(rgb, np.maximum(hd, ndimage.maximum_filter(hd, size=(5, 5, 1)))), hd)
    out = np.dstack([np.clip(rgb, 0, 255), alpha * 255]).astype(np.uint8)
    ys, xs = np.nonzero(alpha > 0.03)
    out = out[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    im = Image.fromarray(out, "RGBA")
    if im.height > MAXH:
        im = im.resize((round(im.width * MAXH / im.height), MAXH), Image.LANCZOS)
    im.save(f"{OUT}/{name}.png", optimize=True)
    print(name, im.size, flush=True)
