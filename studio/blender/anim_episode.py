"""Animation Blender d'un épisode Loup-Garou à partir de la timeline (anim/src/ep02.json).

Usage :
  blender -b -P anim_episode.py -- <timeline.json> <dossier_images> <image_debut> <image_fin> [qualite] [--sauver]
  qualite : "brouillon" (rapide, pour vérifier) ou "final" (défaut).
Sortie : <dossier_images>/img_00001.jpg … (numéro d'image Blender = numéro d'image Remotion + 1).
Les images déjà rendues sont gardées : on peut relancer un morceau interrompu.
"""
import json
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
TL = json.load(open(ARGS[0], encoding="utf-8"))
SORTIE = ARGS[1]
DEBUT, FIN = int(ARGS[2]), int(ARGS[3])
QUALITE = ARGS[4] if len(ARGS) > 4 and not ARGS[4].startswith("--") else "final"
FPS = TL["fps"]
SC = bpy.context.scene
ITEMS = TL["items"]
BEATS = [o for o in ITEMS if o["kind"] == "beat"]


def F(t):
    return int(round(t * FPS)) + 1


# ---------------------------------------------------------------- décor
V.chalet()
for o in list(bpy.data.objects):
    if o.name.startswith(("table", "pied", "bougie", "flammeb", "carte", "tapis")):
        bpy.data.objects.remove(o)
parquet = bpy.data.materials["parquet"]
nappe = V.mat_texture("nappe", (0.30, 0.04, 0.04), (0.45, 0.08, 0.06), 40, motif="maille", rough=0.95, bump=0.2)
V.bloc("grande_table", (7.4, 1.0, 0.10), (0, -1.35, 0.85), parquet, 0.04)
V.bloc("chemin_table", (7.0, 0.45, 0.012), (0, -1.35, 0.906), nappe, 0.004)
for x in (-3.4, 3.4):
    for y in (-1.7, -1.0):
        V.bloc(f"pied_table{x}{y}", (0.12, 0.12, 0.8), (x, y, 0.40), parquet, 0.02)
cire = V.mat_simple("cire", (0.9, 0.85, 0.75), 0.5, sss=0.4)
flamme = V.mat_simple("flamme_bougie", (1, 0.7, 0.3), emission=(1.0, 0.62, 0.25), force=60)
BOUGIES = []
for n, (x, h) in enumerate([(-2.6, 0.24), (-1.2, 0.18), (0.4, 0.26), (1.9, 0.2), (3.0, 0.16)]):
    V.bloc(f"bougie{n}", (0.09, 0.09, h), (x, -1.45, 0.91 + h / 2), cire, 0.03)
    V.sphere(f"flammeb{n}", 0.022, (x, -1.45, 0.96 + h), flamme)
    BOUGIES.append(V.lumiere(f"bougie{n}", "POINT", (x, -1.45, 1.0 + h), 10, (1.0, 0.6, 0.3), 0.05))
dos = V.mat_simple("dos_carte", (0.25, 0.04, 0.06), 0.4)
SIEGES = ["THEO", "NADIA", "KEKE", "LE_J", "LOUNA", "MOMO", "ELISE", "PAPI_GERARD"]
C = Vector((0, -7.0, 0))
R = 7.0
positions = {}
for k, nom in enumerate(SIEGES):
    th = math.radians(-31 + k * (62 / 7))
    p = Vector((R * math.sin(th), C.y + R * math.cos(th), 0))
    rz = math.degrees(math.atan2(C.x - p.x, -(C.y - p.y)))
    positions[nom] = ((p.x, p.y, 0), rz)
    V.bloc(f"carte_{nom}", (0.16, 0.24, 0.01), (p.x * 0.93, -1.1, 0.91), dos, 0.005, rot=(0, 0, math.radians(rz)))
pm = Vector((4.05, -2.75, 0))
positions["MENEUR"] = ((pm.x, pm.y, 0), math.degrees(math.atan2(0 - pm.x, -(-0.6 - pm.y))))
RACINES = casting(positions)
POS = {n: Vector(p) for n, (p, _) in positions.items()}
ROT = {n: math.radians(r) for n, (_, r) in positions.items()}

# yeux de loup derrière la fenêtre (fin de l'épisode)
yeux = V.mat_simple("yeux_loup", (1.0, 0.8, 0.1), emission=(1.0, 0.75, 0.1), force=0.0)
for cote in (-1, 1):
    V.sphere(f"oeil_loup{cote}", 0.045, (2.3 + 0.12 * cote, 3.94, 1.62), yeux)


# ---------------------------------------------------------------- lumières
def lampe_zone(nom, pos, cible, energie, couleur, taille):
    o = V.lumiere(nom, "AREA", pos, energie, couleur, taille)
    o.rotation_euler = (Vector(cible) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
    return o


L = {
    "cle": lampe_zone("cle", (3.0, -5.8, 3.8), (0, -0.4, 1.6), 500, (1.0, 0.80, 0.60), 4.0),
    "remplissage": lampe_zone("remplissage", (-4.0, -5.0, 2.4), (0, -0.4, 1.4), 90, (0.75, 0.8, 1.0), 4.0),
    "contre": lampe_zone("contre", (0.0, 3.2, 3.8), (0, -0.4, 1.9), 380, (1.0, 0.6, 0.3), 3.0),
    "lune": lampe_zone("lune", (2.3, 3.6, 2.2), (0, -0.6, 1.5), 0, (0.45, 0.6, 1.0), 2.0),
    "feu": bpy.data.objects["feu"],
    "fenetre": bpy.data.objects["fenetre"],
}
AMBIANCES = {  # énergie des lumières selon l'ambiance
    "normal": {"cle": 500, "remplissage": 90, "contre": 380, "lune": 0, "feu": 450, "fenetre": 120, "bougie": 10},
    "revelation": {"cle": 650, "remplissage": 130, "contre": 420, "lune": 0, "feu": 450, "fenetre": 120, "bougie": 10},
    "suspense": {"cle": 170, "remplissage": 12, "contre": 520, "lune": 0, "feu": 380, "fenetre": 80, "bougie": 12},
    "nuit": {"cle": 25, "remplissage": 8, "contre": 90, "lune": 380, "feu": 160, "fenetre": 200, "bougie": 14},
}

monde = bpy.data.worlds.new("monde")
SC.world = monde
monde.use_nodes = True
monde.node_tree.nodes["Background"].inputs["Color"].default_value = (0.012, 0.010, 0.012, 1)

cam_d = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("cam", cam_d)
bpy.context.collection.objects.link(cam)
SC.camera = cam
cam_d.dof.use_dof = True


# ---------------------------------------------------------------- outils d'animation
def _fcurves(action):
    if hasattr(action, "fcurves"):
        return list(action.fcurves)
    out = []
    for layer in action.layers:
        for strip in layer.strips:
            for bag in strip.channelbags:
                out.extend(bag.fcurves)
    return out


def tete_vers(nom):
    return POS[nom] + Vector((0, 0, 2.05 if nom == "MENEUR" else (1.95 if nom == "MOMO" else 1.88)))


def devant(nom):
    a = ROT[nom]
    return Vector((math.sin(a), -math.cos(a), 0))


def angle_vers(nom, cible):
    d = cible - POS[nom]
    voulu = math.atan2(d.x, -d.y)
    x = (voulu - ROT[nom] + math.pi) % (2 * math.pi) - math.pi
    return max(-1.0, min(1.0, x))


def plan(beat, idx):
    """Position, cible, focale et point net de la caméra pour un plan."""
    shot = beat.get("shot", "large")
    if shot == "large":
        net = tete_vers(beat["who"]) if beat["who"] in POS else None
        return Vector((0, -9.0, 2.7)), Vector((0, -0.2, 1.25)), 26, net
    if shot == "table":
        return Vector((0.4, -3.2, 2.5)), Vector((0, -1.3, 0.95)), 35, Vector((0, -1.3, 0.95))
    if shot == "fenetre":
        return Vector((0.9, 0.6, 1.75)), Vector((2.3, 4.0, 1.85)), 38, Vector((2.3, 4.0, 1.85))
    nom = {"camera": "LE_J", "meneur": "MENEUR", "couloir": "LOUNA"}.get(shot, shot)
    if nom not in POS:
        nom = beat["who"]
    h = tete_vers(nom)
    lacet = 0.22 * (1 if idx % 2 else -1) if shot != "camera" else 0.0
    d = devant(nom)
    d = Vector((d.x * math.cos(lacet) - d.y * math.sin(lacet), d.x * math.sin(lacet) + d.y * math.cos(lacet), 0))
    dist = 2.9 if shot == "camera" else 3.4
    return h + d * dist + Vector((0, 0, 0.16)), h - Vector((0, 0, 0.22)), 38, h


# ---------------------------------------------------------------- qui est absent ?
def absents():
    """Pour chaque réplique, les joueurs qui ne sont plus dans le chalet."""
    out, elim, attente = [], set(), set()
    for i, b in enumerate(BEATS):
        if b.get("hud") and b["hud"] != "VOTE":
            elim |= attente
            attente = set()
        if b.get("elimine"):
            if b["elimine"] == "NADIA":
                elim.add("NADIA")
            else:
                attente.add(b["elimine"])
        cache = set(elim)
        if i <= 4:  # accroche : 3 h du matin, nuit 3
            cache |= {"KEKE", "NADIA", "MOMO"}
        out.append(cache)
    return out


ABS = absents()
POSES = {
    "pointe": ((-1.45, 0, 0), None), "salut": ((0, 0, -2.6), None), "montre_carte": ((-1.2, 0, 0.2), None),
    "panique": ((0, 0, -2.2), (0, 0, 2.2)), "choc": ((0, 0, -1.2), (0, 0, 1.2)), "crie": ((-1.6, 0, 0), (-1.6, 0, 0)),
    "joie": ((0, 0, -2.8), (0, 0, 2.8)), "debout": ((-1.3, 0, 0), None), "defend": ((-0.9, 0, -0.4), (-0.9, 0, 0.4)),
    "apparait": ((-0.5, 0, -0.8), (-0.5, 0, 0.8)),
}
INCLINAISONS = {"triste": 0.25, "pleure": 0.3, "espionne": -0.12, "chuchote": 0.12, "tombe": 0.45}

# ---------------------------------------------------------------- animation
AMB_PREC = None
for idx, b in enumerate(BEATS):
    f0 = F(b["start"])
    nxt = BEATS[idx + 1]["start"] if idx + 1 < len(BEATS) else TL["duration"]
    for o in ITEMS:  # la carte de phase juste avant reprend le même plan
        if o["kind"] == "daycard" and abs(o["end"] - b["start"]) < 0.05:
            f0 = F(o["start"])
    if idx == 0:
        f0 = 1
    nxt_card = [o["start"] for o in ITEMS if o["kind"] == "daycard" and abs(o["end"] - nxt) < 0.05]
    f_fin = F(nxt_card[0] if nxt_card else nxt)
    # caméra : coupe nette + léger travelling avant
    pos, cible, lens, net = plan(b, idx)
    rentre = (cible - pos) * 0.06
    for f, p in ((f0, pos), (f_fin - 1, pos + rentre)):
        cam.location = p
        cam.rotation_euler = (cible - p).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f)
        cam.keyframe_insert("rotation_euler", frame=f)
    cam_d.lens = lens
    cam_d.keyframe_insert("lens", frame=f0)
    cam_d.dof.focus_distance = ((net or cible) - pos).length
    cam_d.dof.aperture_fstop = 1.4 if b.get("shot") != "large" else 2.8
    cam_d.dof.keyframe_insert("focus_distance", frame=f0)
    cam_d.dof.keyframe_insert("aperture_fstop", frame=f0)
    # ambiance lumineuse
    amb = b.get("lumiere") or AMB_PREC or "normal"
    AMB_PREC = amb
    if b.get("scene") == "chalet_nuit" and amb in ("normal", "revelation"):
        amb = "nuit"
    if b.get("scene") == "chalet" and amb == "nuit":
        amb = "normal"
    for k, o in L.items():
        o.data.energy = AMBIANCES[amb][k]
        o.data.keyframe_insert("energy", frame=f0)
    for o in BOUGIES:
        o.data.energy = AMBIANCES[amb]["bougie"]
        o.data.keyframe_insert("energy", frame=f0)
    # présents / absents (les absents passent sous le plancher)
    for nom, rac in RACINES.items():
        rac.location = POS[nom] + (Vector((0, 0, -40)) if nom in ABS[idx] else Vector())
        rac.keyframe_insert("location", frame=f0)
    # regards : tout le monde regarde celui qui parle
    qui = b["who"]
    for nom in RACINES:
        piv = bpy.data.objects[f"{nom}_tete_pivot"]
        if nom == qui:
            gros_plan = b.get("shot") in (nom, "camera", "meneur", "couloir")
            ang = 0.0 if gros_plan else angle_vers(nom, Vector((0, -1.3, 1.6)))
        elif qui in POS:
            ang = angle_vers(nom, tete_vers(qui))
        else:
            ang = 0.0
        piv.rotation_euler = (0, 0, ang)
        piv.keyframe_insert("rotation_euler", frame=f0 + 5)
    # bouche : ouverture suivant l'énergie de la voix
    env = b.get("env", [])
    fv = F(b["vstart"])
    if qui == "MENEUR":
        m = bpy.data.materials["yeux_meneur"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
        m.default_value = 6
        m.keyframe_insert("default_value", frame=fv - 1)
        for k in range(0, len(env), 2):
            m.default_value = 6 + 10 * env[k]
            m.keyframe_insert("default_value", frame=fv + k)
        m.default_value = 6
        m.keyframe_insert("default_value", frame=fv + len(env) + 2)
    elif qui in RACINES:
        bouche = bpy.data.objects[f"{qui}_bouche"]
        bouche.scale = (1, 1, 1)
        bouche.keyframe_insert("scale", frame=fv - 1)
        for k in range(0, len(env), 2):
            e = env[k]
            bouche.scale = (1 - 0.2 * e, 1, 1 + 2.6 * e)
            bouche.keyframe_insert("scale", frame=fv + k)
        bouche.scale = (1, 1, 1)
        bouche.keyframe_insert("scale", frame=fv + len(env) + 1)
    # gestes
    fa = F(b["vstart"])
    fb = max(fa + 8, F(b["vstart"] + b["dur"]) - 4)
    for nom, act in (b.get("act") or {}).items():
        if nom not in RACINES:
            continue
        p = POSES.get(act)
        if p:
            for ep, rot in ((bpy.data.objects[f"{nom}_epaule-1"], p[0]), (bpy.data.objects[f"{nom}_epaule1"], p[1])):
                if rot is None:
                    continue
                ep.rotation_euler = (0, 0, 0)
                ep.keyframe_insert("rotation_euler", frame=fa - 4)
                ep.rotation_euler = rot
                ep.keyframe_insert("rotation_euler", frame=fa + 4)
                ep.keyframe_insert("rotation_euler", frame=fb)
                ep.rotation_euler = (0, 0, 0)
                ep.keyframe_insert("rotation_euler", frame=fb + 6)
        if act in INCLINAISONS:
            piv = bpy.data.objects[f"{nom}_tete_pivot"]
            z = piv.rotation_euler[2]
            piv.rotation_euler = (INCLINAISONS[act], 0, z)
            piv.keyframe_insert("rotation_euler", frame=fa + 3)
            piv.keyframe_insert("rotation_euler", frame=fb)
            piv.rotation_euler = (0, 0, z)
            piv.keyframe_insert("rotation_euler", frame=fb + 6)
    # bulle de chewing-gum de Louna
    if b.get("sfx") == "bulle" and "LOUNA" not in ABS[idx]:
        bul = bpy.data.objects["LOUNA_bulle"]
        for f, s, vis in ((fa - 12, 0.05, False), (fa - 10, 0.1, True), (fa + 2, 1.0, True), (fa + 3, 1.0, False)):
            bul.scale = (s, s, s)
            bul.hide_render = not vis
            bul.keyframe_insert("scale", frame=f)
            bul.keyframe_insert("hide_render", frame=f)
    # yeux du loup à la fenêtre (dernier retournement)
    if b.get("shot") == "fenetre":
        e = bpy.data.materials["yeux_loup"].node_tree.nodes["Principled BSDF"].inputs["Emission Strength"]
        e.default_value = 0.0
        e.keyframe_insert("default_value", frame=f0 + 6)
        e.default_value = 7.0
        e.keyframe_insert("default_value", frame=f0 + 14)

# coupes nettes : caméra (début de plan), focale, lumières, présences
for idb, chemins in [(cam_d, ("lens",)), (cam_d.dof, ("focus_distance", "aperture_fstop"))] + \
        [(o.data, ("energy",)) for o in list(L.values()) + BOUGIES] + [(r, ("location",)) for r in RACINES.values()]:
    ad = getattr(idb, "animation_data", None)
    if ad is None and hasattr(idb, "id_data"):
        ad = idb.id_data.animation_data
    if ad and ad.action:
        for fc in _fcurves(ad.action):
            if fc.data_path.split(".")[-1] in chemins:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
for fc in _fcurves(cam.animation_data.action):
    for j, kp in enumerate(fc.keyframe_points):
        kp.interpolation = "LINEAR" if j % 2 == 0 else "CONSTANT"
# petits mouvements de tête (vivant)
for nom in RACINES:
    piv = bpy.data.objects[f"{nom}_tete_pivot"]
    if piv.animation_data and piv.animation_data.action:
        for fc in _fcurves(piv.animation_data.action):
            if fc.data_path == "rotation_euler" and fc.array_index in (0, 2):
                mod = fc.modifiers.new("NOISE")
                mod.scale = 40
                mod.strength = 0.05
                mod.phase = sum(map(ord, nom)) % 100

# ---------------------------------------------------------------- rendu
r = SC.render
r.engine = "BLENDER_EEVEE"
r.fps = FPS
r.resolution_x, r.resolution_y = 1920, 1080
r.resolution_percentage = 50 if QUALITE == "brouillon" else 100
# final = 24 échantillons ; rapide = 12 (environ 2 fois plus vite, différence peu visible)
SC.eevee.taa_render_samples = {"final": 24, "rapide": 12}.get(QUALITE, 8)
for attr, val in (("use_raytracing", False), ("shadow_pool_size", "1024"), ("use_shadows", True)):
    try:
        setattr(SC.eevee, attr, val)
    except (AttributeError, TypeError):
        pass
SC.view_settings.view_transform = "AgX"
SC.view_settings.look = "AgX - Punchy"
r.image_settings.file_format = "JPEG"
r.image_settings.quality = 93
r.use_overwrite = False
r.use_placeholder = True
if "--bordure" in ARGS:
    # shorts 9:16 : seul le centre de l'image sert, on ne calcule que cette bande (environ 2 fois plus rapide)
    r.use_border, r.use_crop_to_border = True, False
    r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = 0.24, 0.76, 0.0, 1.0
if "--bande" in ARGS:
    # réparation des sous-titres : seule la bande du bas (y 815 à 1045 px) est recalculée
    r.use_border, r.use_crop_to_border = True, False
    r.border_min_x, r.border_max_x, r.border_min_y, r.border_max_y = 0.0, 1.0, 0.03, 0.25
os.makedirs(SORTIE, exist_ok=True)
r.filepath = os.path.join(SORTIE, "img_#####")
SC.frame_start, SC.frame_end = DEBUT, FIN
if "--sauver" in ARGS:
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SORTIE, "episode.blend"))
bpy.ops.render.render(animation=True)
print("MORCEAU OK", DEBUT, FIN)
