"""Miniature de l'épisode 2 (Loup-Garou) : LE J choqué au premier plan, les 7 autres joueurs dans la pénombre,
deux paires d'yeux jaunes dans le noir (sans désigner personne).

Usage : blender -b -P miniature_ep02.py -- <sortie.png> [eevee|cycles]
Le texte (« 2 LOUPS ? », « 3 H DU MATIN ») est posé ensuite par-dessus.
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
MOTEUR = ARGS[1] if len(ARGS) > 1 else "cycles"
SC = bpy.context.scene

V.chalet()
for o in list(bpy.data.objects):
    if o.name.startswith(("carte",)):
        bpy.data.objects.remove(o)

# les 7 autres en arc dans le fond, LE J au premier plan à gauche, tourné vers la caméra
FOND = ["NADIA", "KEKE", "LOUNA", "MOMO", "ELISE", "THEO", "PAPI_GERARD"]
xs = [-2.9, -1.95, -1.0, 0.0, 1.0, 1.95, 2.9]
positions = {nom: ((x, 0.9 + 0.06 * x * x, 0), -math.degrees(math.atan2(x, 9.0))) for nom, x in zip(FOND, xs)}
positions["LE_J"] = ((-0.75, -3.1, 0), -8)
casting(positions)

# visage choqué : bouche ouverte, sourcils levés
b = bpy.data.objects.get("LE_J_bouche")
if b:
    b.scale = (1.05, 1.0, 5.0)
    b.location.z -= 0.03
    b.data.materials[0] = V.mat_simple("bouche_choc", (0.08, 0.01, 0.01), rough=0.5)
for c in (-1, 1):
    s = bpy.data.objects.get(f"LE_J_sourcil{c}")
    if s:
        s.location.z += 0.035
        s.rotation_euler.y = 0.10 * c

# deux paires d'yeux de loup dans l'ombre, entre les joueurs du fond (personne de précis)
oeil = V.mat_simple("yeux_loup_mini", (1.0, 0.75, 0.1), emission=(1.0, 0.55, 0.05), force=9)
for (x, y, z) in ((1.85, 3.93, 2.60), (2.6, 3.93, 2.56)):
    for c in (-1, 1):
        V.bloc(f"oeil_loup_{x}_{c}", (0.12, 0.03, 0.06), (x + 0.09 * c, y, z), oeil, 0.01)


def lampe_zone(nom, pos, cible, energie, couleur, taille):
    o = V.lumiere(nom, "AREA", pos, energie, couleur, taille)
    o.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


# ambiance de nuit : on baisse les lumières du décor
for o in bpy.data.objects:
    if o.type == "LIGHT":
        o.data.energy *= 0.10

# lumière chaude devant (bougie / feu), contre-jour bleu froid derrière, fond sombre
lampe_zone("cle", (1.4, -5.6, 2.3), (-0.75, -3.1, 1.85), 260, (1.0, 0.62, 0.30), 1.6)
lampe_zone("bougie", (-0.3, -4.3, 1.2), (-0.75, -3.1, 1.8), 60, (1.0, 0.5, 0.15), 0.4)
lampe_zone("contre", (-2.2, -1.2, 3.0), (-0.75, -3.1, 1.9), 420, (0.35, 0.55, 1.0), 1.2)
lampe_zone("fond", (0.0, -1.5, 3.4), (0.0, 1.0, 1.4), 60, (1.0, 0.55, 0.25), 6.0)
lampe_zone("lune", (0.0, 5.0, 3.0), (0.0, 1.0, 1.6), 160, (0.4, 0.55, 1.0), 4.0)

monde = bpy.data.worlds.new("monde")
SC.world = monde
monde.use_nodes = True
monde.node_tree.nodes["Background"].inputs["Color"].default_value = (0.004, 0.005, 0.012, 1)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
bpy.context.collection.objects.link(cam)
SC.camera = cam
pos, cible = Vector((0.15, -6.4, 1.95)), Vector((0.15, 0.0, 1.55))
cam.location = pos
cam.rotation_euler = (cible - pos).to_track_quat("-Z", "Y").to_euler()
cam_d.lens = 38
cam_d.dof.use_dof = True
cam_d.dof.focus_distance = (Vector((-0.75, -3.1, 1.9)) - pos).length
cam_d.dof.aperture_fstop = 1.1

r = SC.render
r.resolution_x, r.resolution_y = 1920, 1080
SC.view_settings.view_transform = "AgX"
SC.view_settings.look = "AgX - Punchy"
r.image_settings.file_format = "PNG"
if MOTEUR == "cycles":
    r.engine = "CYCLES"
    SC.cycles.samples = 256
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
    SC.eevee.taa_render_samples = 32
r.filepath = SORTIE
bpy.ops.render.render(write_still=True)
print("MINIATURE OK", MOTEUR)
