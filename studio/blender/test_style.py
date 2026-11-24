"""Test du style 2 (référence : personnages/style/reference_style.png).

Usage : blender -b -P test_style.py -- <dossier_sortie> [eevee|cycles] [--barbe]
Sortie : style_scene.png (LE J choqué devant les joueurs, comme la référence) et style_lej.png (gros plan).
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
bpy.ops.wm.read_factory_settings(use_empty=True)

import lib_voxel as V  # noqa: E402
from lib_casting import casting  # noqa: E402

ARGS = sys.argv[sys.argv.index("--") + 1:]
SORTIE = ARGS[0]
MOTEUR = ARGS[1] if len(ARGS) > 1 and not ARGS[1].startswith("--") else "eevee"
os.makedirs(SORTIE, exist_ok=True)
SC = bpy.context.scene

V.chalet()
for o in bpy.data.objects:
    if o.type == "LIGHT":
        o.data.energy *= 0.35
for o in list(bpy.data.objects):
    if o.name.startswith(("table", "pied", "bougie", "flammeb", "carte", "tapis")):
        bpy.data.objects.remove(o)

# joueurs derrière une longue table, LE J au premier plan à gauche
FOND = ["LOUNA", "KEKE", "MOMO", "ELISE", "THEO", "PAPI_GERARD"]
xs = [-0.6, 0.35, 1.3, 2.25, 3.2, 4.1]
positions = {n: ((x, 1.6 + 0.03 * (x - 1.8) ** 2, 0), -math.degrees(math.atan2(x - 0.4, 9.0))) for n, x in zip(FOND, xs)}
positions["LE_J"] = ((-1.25, -2.4, 0), -14)
casting(positions)

# table, bougies, tasses
bois = V.mat_texture("table_bois", (0.12, 0.06, 0.025), (0.30, 0.16, 0.07), 2.5, motif="bois", rough=0.4, bump=0.3,
                     etire=(0.2, 1, 1))
V.bloc("table_longue", (6.2, 1.1, 0.12), (1.75, 0.95, 0.88), bois, 0.04)
cire = V.mat_simple("cire", (0.95, 0.88, 0.75), 0.5, sss=0.4)
flamme = V.mat_simple("flamme_bougie", (1, 0.7, 0.3), emission=(1.0, 0.6, 0.2), force=80)
for n, (x, h) in enumerate([(0.0, 0.30), (0.18, 0.2), (0.9, 0.26), (1.75, 0.34), (1.95, 0.22), (2.8, 0.28)]):
    V.bloc(f"bg{n}", (0.11, 0.11, h), (x, 0.8, 0.94 + h / 2), cire, 0.04)
    V.sphere(f"fl{n}", 0.03, (x, 0.8, 1.0 + h), flamme)
    V.lumiere(f"lb{n}", "POINT", (x, 0.75, 1.05 + h), 14, (1.0, 0.55, 0.25), 0.05)
for n, x in enumerate([-0.4, 0.55, 1.45, 2.4, 3.35]):
    V.tasse(f"tasse{n}", (x, 0.6, 0.94), [(0.55, 0.32, 0.18), (0.75, 0.72, 0.68), (0.30, 0.10, 0.06)][n % 3])
V.yeux_dehors([(1.85, 5.6, 2.62), (2.75, 5.9, 2.58)])

# expressions : LE J choqué, main sur la tête ; les autres méfiants ou inquiets
V.expression("LE_J", "choc")
V.pose("LE_J", "tete")
if "--barbe" in ARGS:
    V.barbe("LE_J", (0.03, 0.02, 0.015), "courte")
goutte = V.mat_simple("goutte", (0.7, 0.85, 1.0), rough=0.05)
V.bloc("goutte", (0.035, 0.02, 0.065), (0.285, -0.345, -0.07), goutte, 0.015, bpy.data.objects["LE_J_tete_pivot"])
for n, q in zip(FOND, ["mefiant", "colere", "peur", "mefiant", "mefiant", "colere"]):
    V.expression(n, q, sourcil_unique=(n == "ELISE"))
# bras croisés / main au menton
for n in ("KEKE", "MOMO"):
    V.pose(n, "croises")
for n in ("ELISE", "THEO"):
    V.pose(n, "menton")


def zone(nom, pos, cible, e, col, t):
    o = V.lumiere(nom, "AREA", pos, e, col, t)
    o.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


# lumière : clé chaude orange devant, remplissage doux, contre-jour bleu froid
zone("cle", (1.0, -5.5, 3.0), (-1.25, -2.4, 1.9), 300, (1.0, 0.60, 0.30), 2.0)
zone("cle_groupe", (2.0, -3.5, 3.4), (1.8, 1.6, 1.6), 300, (1.0, 0.62, 0.32), 4.0)
zone("rempl", (-4.0, -4.0, 2.0), (-1.25, -2.4, 1.8), 40, (1.0, 0.75, 0.55), 3.0)
zone("contre_j", (-3.0, 0.5, 3.0), (-1.25, -2.4, 2.0), 220, (0.35, 0.55, 1.0), 1.2)
zone("contre_g", (1.8, 3.6, 3.2), (1.8, 1.6, 1.9), 600, (0.4, 0.6, 1.0), 5.0)

monde = bpy.data.worlds.new("monde")
SC.world = monde
monde.use_nodes = True
monde.node_tree.nodes["Background"].inputs["Color"].default_value = (0.01, 0.008, 0.012, 1)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
bpy.context.collection.objects.link(cam)
SC.camera = cam


def viser(pos, cible, lens, fstop, focus):
    cam.location = pos
    cam.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cam_d.lens = lens
    cam_d.dof.use_dof = True
    cam_d.dof.aperture_fstop = fstop
    cam_d.dof.focus_distance = (Vector(focus) - Vector(pos)).length


r = SC.render
r.resolution_x, r.resolution_y = 1920, 1080
SC.view_settings.view_transform = "AgX"
SC.view_settings.look = "AgX - Punchy"
r.image_settings.file_format = "PNG"
if MOTEUR == "cycles":
    r.engine = "CYCLES"
    SC.cycles.samples = 192
    SC.cycles.use_denoising = True
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for typ in ("OPTIX", "CUDA"):
        try:
            prefs.compute_device_type = typ
            prefs.get_devices()
            for d in prefs.devices:
                d.use = True
            SC.cycles.device = "GPU"
            break
        except TypeError:
            continue
else:
    r.engine = "BLENDER_EEVEE"
    SC.eevee.taa_render_samples = 48
    for attr, val in (("use_raytracing", True), ("shadow_pool_size", "1024")):
        try:
            setattr(SC.eevee, attr, val)
        except (AttributeError, TypeError):
            pass
print("POST", V.post_effets(SC))

viser((-0.2, -6.3, 2.05), (0.7, 0.0, 1.75), 32, 2.0, (-1.25, -2.4, 1.95))
r.filepath = os.path.join(SORTIE, "style_scene.png")
bpy.ops.render.render(write_still=True)

# gros plan LE J (pour juger yeux, bouche, mains, cheveux)
viser((-0.75, -4.4, 2.0), (-1.25, -2.4, 1.85), 45, 2.8, (-1.25, -2.4, 1.95))
r.filepath = os.path.join(SORTIE, "style_lej.png")
bpy.ops.render.render(write_still=True)
print("STYLE OK")
