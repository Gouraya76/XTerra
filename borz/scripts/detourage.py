"""Détourage des personnages BORZ : crop par personnage + rembg + plus grande composante connexe."""
import sys, numpy as np
from PIL import Image
from rembg import remove, new_session
from scipy import ndimage

SRC = sys.argv[1] if len(sys.argv) > 1 else "borz/source"
OUT = sys.argv[2] if len(sys.argv) > 2 else "borz/personnages"
MODEL = sys.argv[3] if len(sys.argv) > 3 else "isnet-general-use"

# (fichier, nom, box x0,y0,x1,y1)
CROPS = [
    ("principaux.png", "vert",   (0, 160, 440, 1215)),
    ("principaux.png", "blanc",  (400, 75, 800, 1185)),
    ("principaux.png", "rouge",  (725, 170, 1199, 1215)),
    ("secondaires.png", "bleu",     (0, 15, 255, 630)),
    ("secondaires.png", "rose",     (245, 30, 485, 630)),
    ("secondaires.png", "orange",   (480, 30, 720, 625)),
    ("secondaires.png", "violet",   (714, 15, 965, 625)),
    ("secondaires.png", "jaune",    (945, 25, 1199, 620)),
    ("secondaires.png", "papi",     (0, 645, 245, 1245)),
    ("secondaires.png", "turquoise",(245, 665, 475, 1240)),
    ("secondaires.png", "mamie",    (480, 670, 740, 1240)),
    ("secondaires.png", "ouvrier",  (740, 665, 965, 1240)),
    ("secondaires.png", "grise",    (955, 650, 1199, 1240)),
]

sess = new_session(MODEL)
for fname, name, box in CROPS:
    im = Image.open(f"{SRC}/{fname}").convert("RGB").crop(box)
    cut = remove(im, session=sess)
    a = np.array(cut)
    alpha = a[..., 3]
    lum = a[..., :3].astype(float).mean(axis=2)
    bg = alpha < 10
    lb, nb = ndimage.label(bg)
    border = set(np.unique(np.concatenate([lb[0], lb[-1], lb[:, 0], lb[:, -1]]))) - {0}
    exterior = np.isin(lb, list(border))
    lab, n = ndimage.label(alpha > 40)
    if n > 1:
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        keep = np.argmax(sizes) + 1
        mask = ndimage.binary_dilation(lab == keep, iterations=2)
        alpha = np.where(mask, alpha, 0)
    # Rend opaque l'intérieur (jambes sombres semi-transparentes), garde un bord doux
    base = alpha > 25
    solid = ndimage.binary_fill_holes(base)
    holes, nh = ndimage.label(solid & ~base)
    for h in range(1, nh + 1):
        m = holes == h
        if alpha[m].mean() < 12 and lum[m].mean() < 35:  # vrai fond noir piégé (entre les jambes)
            solid[m] = False
    core = ndimage.binary_erosion(solid, iterations=3)
    alpha = np.maximum(alpha, (core * 255).astype(np.uint8))
    alpha = np.where(solid | (alpha > 25), alpha, 0).astype(np.uint8)
    # Fond noir piégé : on propage le fond extérieur à travers les pixels quasi noirs
    dark = lum < 8
    dark[: int(dark.shape[0] * 0.55)] = False  # seulement le bas du corps (entre les jambes)
    grown = ndimage.binary_propagation(exterior, mask=dark | exterior)
    grown = ndimage.binary_opening(grown, iterations=1) | exterior
    soft = ndimage.binary_dilation(grown, iterations=1) & ~grown
    alpha = np.where(grown, 0, alpha)
    alpha = np.where(soft, alpha // 2, alpha).astype(np.uint8)
    a[..., 3] = alpha
    ys, xs = np.nonzero(alpha > 10)
    a = a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    Image.fromarray(a).save(f"{OUT}/{name}.png")
    print(name, a.shape)
