import sys, glob, os
from PIL import Image
files = sorted(glob.glob("borz/personnages/*.png"))
H = 520; tiles = []
for f in files:
    im = Image.open(f); r = H / im.height
    tiles.append(im.resize((int(im.width * r), H), Image.LANCZOS))
W = sum(t.width + 20 for t in tiles[:7]); W2 = sum(t.width + 20 for t in tiles[7:])
sheet = Image.new("RGB", (max(W, W2) + 20, 2 * H + 60), (70, 140, 200))
x, y = 20, 20
for i, t in enumerate(tiles):
    if i == 7: x, y = 20, H + 40
    sheet.paste(t, (x, y), t); x += t.width + 20
sheet.save(sys.argv[1])
