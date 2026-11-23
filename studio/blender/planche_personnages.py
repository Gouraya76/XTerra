"""Planche des personnages : photo de groupe + un portrait par personnage, dans le chalet.

Usage : blender -b -P planche_personnages.py -- <dossier_sortie>
Sortie : groupe.png et portrait_<NOM>.png (EEVEE).
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

SORTIE = sys.argv[sys.argv.index("--") + 1]
os.makedirs(SORTIE, exist_ok=True)
SC = bpy.context.scene

V.chalet()
for o in list(bpy.data.objects):
    if o.name.startswith(("table", "pied", "bougie", "flammeb", "carte")):
        bpy.data.objects.remove(o)

ORDRE = ["LE_J", "NADIA", "KEKE", "LOUNA", "MOMO", "ELISE", "THEO", "PAPI_GERARD"]
xs = [-3.95, -3.0, -2.05, -1.1, 1.1, 2.05, 3.0, 3.95]
positions = {nom: ((x, 0.3 + 0.07 * x * x, 0), -math.degrees(math.atan2(x, 9.0))) for nom, x in zip(ORDRE, xs)}
positions["MENEUR"] = ((0.0, 0.9, 0), 0)
casting(positions)


def lampe_zone(nom, pos, cible, energie, couleur, taille):
    o = V.lumiere(nom, "AREA", pos, energie, couleur, taille)
    o.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


lampe_zone("cle", (3.5, -5.0, 3.6), (0, 0.5, 1.6), 600, (1.0, 0.80, 0.60), 4.0)
lampe_zone("remplissage", (-4.0, -4.5, 2.4), (0, 0.5, 1.4), 120, (0.75, 0.8, 1.0), 4.0)
lampe_zone("contre", (0.0, 3.4, 3.8), (0, 0.5, 1.9), 400, (1.0, 0.6, 0.3), 3.0)

monde = bpy.data.worlds.new("monde")
SC.world = monde
monde.use_nodes = True
monde.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.010, 0.012, 1)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
bpy.context.collection.objects.link(cam)
SC.camera = cam


def viser(pos, cible, lens, fstop=None, focus=None):
    cam.location = pos
    cam.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    cam_d.lens = lens
    cam_d.dof.use_dof = fstop is not None
    if fstop:
        cam_d.dof.aperture_fstop = fstop
        cam_d.dof.focus_distance = (Vector(focus or cible) - Vector(pos)).length


r = SC.render
r.engine = "BLENDER_EEVEE"
SC.eevee.taa_render_samples = 64
for attr, val in (("use_raytracing", True), ("shadow_pool_size", "1024")):
    try:
        setattr(SC.eevee, attr, val)
    except (AttributeError, TypeError):
        pass
SC.view_settings.view_transform = "AgX"
SC.view_settings.look = "AgX - Punchy"
r.image_settings.file_format = "PNG"

# photo de groupe
r.resolution_x, r.resolution_y = 1920, 1080
viser((0, -8.6, 1.75), (0, 0.6, 1.25), 30)
r.filepath = os.path.join(SORTIE, "groupe.png")
bpy.ops.render.render(write_still=True)

# portraits (tête + buste), arrière-plan flou
r.resolution_x, r.resolution_y = 720, 900
for nom, ((x, y, _), rz) in positions.items():
    a = math.radians(rz)
    hauteur = {"MENEUR": 2.05, "MOMO": 1.95}.get(nom, 1.85)
    tete = Vector((x, y, hauteur))
    pos = tete + Vector((math.sin(a), -math.cos(a), 0)) * 2.9 + Vector((0, 0, 0.12))
    viser(pos, tete - Vector((0, 0, 0.12)), 42, fstop=1.6, focus=tete)
    r.filepath = os.path.join(SORTIE, f"portrait_{nom}.png")
    bpy.ops.render.render(write_still=True)
print("PLANCHE OK")
