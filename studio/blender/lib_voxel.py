"""Bibliothèque « Le J » : matières, blocs arrondis, personnages, chalet."""
import math
import random

import bpy
from mathutils import Vector

random.seed(7)


def camel():
    return mat_texture("laine_camel", (0.42, 0.25, 0.11), (0.62, 0.40, 0.20), 90, motif="bruit", rough=0.85, bump=0.15)


# ---------------------------------------------------------------- matières
_MATS = {}


def _bsdf(m):
    return m.node_tree.nodes["Principled BSDF"]


def mat_simple(nom, couleur, rough=0.6, metal=0.0, emission=None, force=0.0, sss=0.0):
    if nom in _MATS:
        return _MATS[nom]
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    b = _bsdf(m)
    b.inputs["Base Color"].default_value = (*couleur, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.6, 0.3, 0.2)
        b.inputs["Subsurface Scale"].default_value = 0.05
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = force
    _MATS[nom] = m
    return m


def mat_texture(nom, c1, c2, echelle, motif="maille", rough=0.85, bump=0.35, etire=(1, 1, 1)):
    """Matière procédurale : maille de pull, bois, tissu, pierre."""
    if nom in _MATS:
        return _MATS[nom]
    m = bpy.data.materials.new(nom)
    m.use_nodes = True
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    b = _bsdf(m)
    b.inputs["Roughness"].default_value = rough
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = etire
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    ramp = N.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (*c1, 1)
    ramp.color_ramp.elements[1].color = (*c2, 1)
    bp = N.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    if motif == "maille":
        w = N.new("ShaderNodeTexWave")
        w.wave_type = "BANDS"
        w.bands_direction = "X"
        w.inputs["Scale"].default_value = echelle
        w.inputs["Distortion"].default_value = 2.0
        w.inputs["Detail"].default_value = 3
        w2 = N.new("ShaderNodeTexWave")
        w2.wave_type = "BANDS"
        w2.bands_direction = "Z"
        w2.inputs["Scale"].default_value = echelle * 2.2
        mx = N.new("ShaderNodeMath")
        mx.operation = "MULTIPLY"
        L.new(mp.outputs["Vector"], w.inputs["Vector"])
        L.new(mp.outputs["Vector"], w2.inputs["Vector"])
        L.new(w.outputs["Fac"], mx.inputs[0])
        L.new(w2.outputs["Fac"], mx.inputs[1])
        src = mx.outputs[0]
        b.inputs["Sheen Weight"].default_value = 0.6
        b.inputs["Sheen Roughness"].default_value = 0.4
    elif motif == "bois":
        w = N.new("ShaderNodeTexWave")
        w.wave_type = "RINGS"
        w.inputs["Scale"].default_value = echelle
        w.inputs["Distortion"].default_value = 8.0
        w.inputs["Detail"].default_value = 6
        L.new(mp.outputs["Vector"], w.inputs["Vector"])
        src = w.outputs["Fac"]
    else:
        n = N.new("ShaderNodeTexNoise")
        n.inputs["Scale"].default_value = echelle
        n.inputs["Detail"].default_value = 8
        L.new(mp.outputs["Vector"], n.inputs["Vector"])
        src = n.outputs["Fac"]
    L.new(src, ramp.inputs["Fac"])
    L.new(ramp.outputs["Color"], b.inputs["Base Color"])
    L.new(src, bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    _MATS[nom] = m
    return m


# ---------------------------------------------------------------- géométrie
def bloc(nom, taille, pos, mat, biseau=0.05, parent=None, rot=(0, 0, 0), segments=4):
    """Bloc arrondi (biseau) : la brique de base du style voxel premium."""
    sx, sy, sz = (t / 2 for t in taille)
    v = [(x * sx, y * sy, z * sz) for x in (-1, 1) for y in (-1, 1) for z in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    me = bpy.data.meshes.new(nom)
    me.from_pydata(v, [], f)
    me.validate()
    ob = bpy.data.objects.new(nom, me)
    bpy.context.collection.objects.link(ob)
    ob.location = pos
    ob.rotation_euler = rot
    ob.data.materials.append(mat)
    if biseau > 0:
        md = ob.modifiers.new("biseau", "BEVEL")
        md.width = min(biseau, min(taille) * 0.45)
        md.segments = segments
    for p in me.polygons:
        p.use_smooth = True
    if parent:
        ob.parent = parent
    return ob


def vide(nom, pos=(0, 0, 0), rot_z=0.0):
    e = bpy.data.objects.new(nom, None)
    bpy.context.collection.objects.link(e)
    e.location = pos
    e.rotation_euler = (0, 0, rot_z)
    return e


def cylindre(nom, rayon, long, pos, mat, rot=(0, 0, 0), sommets=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=rayon, depth=long, location=pos, rotation=rot, vertices=sommets)
    ob = bpy.context.active_object
    ob.name = nom
    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


def sphere(nom, rayon, pos, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=rayon, location=pos, segments=16, ring_count=8)
    ob = bpy.context.active_object
    ob.name = nom
    ob.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return ob


def lumiere(nom, typ, pos, energie, couleur, taille=0.1, rot=None):
    l = bpy.data.lights.new(nom, typ)
    l.energy = energie
    l.color = couleur
    if typ == "AREA":
        l.size = taille
    else:
        l.shadow_soft_size = taille
    o = bpy.data.objects.new(nom, l)
    bpy.context.collection.objects.link(o)
    o.location = pos
    if rot:
        o.rotation_euler = rot
    return o


# ---------------------------------------------------------------- personnages
PEAU_MATE = (0.56, 0.30, 0.14)
NOIR_CHEVEUX = (0.018, 0.016, 0.016)


def mat_peau(nom, peau):
    return mat_simple(f"peau_{nom}", peau, 0.5, sss=0.25)


def visage(tete, nom, peau, sourcils, regard=(0.0, 0.0)):
    """Yeux en amande, sourcils épais, petit sourire en coin. Face avant = -Y."""
    blanc = mat_simple("oeil_blanc", (0.92, 0.92, 0.9), rough=0.25)
    iris = mat_simple("iris_brun", (0.10, 0.05, 0.025), rough=0.15)
    mat_s = mat_simple(f"sourcil_{nom}", sourcils, rough=0.8)
    bouche = mat_simple(f"bouche_{nom}", tuple(c * 0.35 for c in peau), rough=0.6)
    y = -0.335
    for cote in (-1, 1):
        x = 0.14 * cote
        bloc(f"{nom}_oeil{cote}", (0.15, 0.03, 0.10), (x, y, 0.04), blanc, 0.012, tete)
        ix = x + regard[0] * 0.035
        bloc(f"{nom}_iris{cote}", (0.07, 0.03, 0.085), (ix, y - 0.008, 0.035 + regard[1] * 0.02), iris, 0.01, tete)
        bloc(f"{nom}_reflet{cote}", (0.022, 0.02, 0.022), (ix + 0.015, y - 0.02, 0.06), blanc, 0.005, tete)
        bloc(f"{nom}_sourcil{cote}", (0.19, 0.04, 0.05), (x, y - 0.005, 0.14), mat_s, 0.012, tete,
             rot=(0, -0.03 * cote, 0))
    bloc(f"{nom}_bouche", (0.15, 0.025, 0.032), (0.03, y + 0.002, -0.16), bouche, 0.01, tete, rot=(0, -0.15, 0))
    for cote in (-1, 1):
        bloc(f"{nom}_oreille{cote}", (0.05, 0.10, 0.13), (0.345 * cote, 0.02, 0.0), mat_peau(nom, peau), 0.02, tete)


def mat_cheveux(nom, couleur):
    m = mat_texture(f"cheveux_{nom}", tuple(c * 0.5 for c in couleur), tuple(min(1, c * 1.6 + 0.012) for c in couleur),
                    45, motif="maille", rough=0.32, bump=0.3, etire=(1, 0.3, 1))
    _bsdf(m).inputs["Sheen Weight"].default_value = 0.0
    _bsdf(m).inputs["Coat Weight"].default_value = 0.25
    return m


def cheveux_pompadour(tete, nom, couleur):
    """Cheveux épais en mèches de blocs, coiffés en arrière, côtés plus courts."""
    m = mat_cheveux(nom, couleur)
    bloc(f"{nom}_calotte", (0.70, 0.70, 0.16), (0, 0.01, 0.33), m, 0.05, tete)
    # vagues de mèches : rangées de l'avant (houppe haute) vers l'arrière, coupées en morceaux décalés
    for i in range(4):
        yy = -0.27 + i * 0.19
        haut = 0.24 - i * 0.05
        x0 = -0.36
        coupes = [0.0, 0.22 + random.uniform(-0.05, 0.05), 0.48 + random.uniform(-0.05, 0.05), 0.72]
        for j in range(3):
            larg = coupes[j + 1] - coupes[j] - 0.01
            xx = x0 + coupes[j] + larg / 2
            bloc(f"{nom}_meche_{i}_{j}", (larg, 0.22, haut),
                 (xx, yy, 0.40 + haut / 2 - 0.02 + random.uniform(0, 0.03)), m, 0.05, tete,
                 rot=(-0.45 + i * 0.1, random.uniform(-0.05, 0.05), random.uniform(-0.04, 0.04)))
    bloc(f"{nom}_houppe", (0.62, 0.12, 0.10), (0.02, -0.36, 0.47), m, 0.045, tete, rot=(-0.6, 0, 0.03))
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.06, 0.62, 0.30), (0.34 * cote, 0.05, 0.17), m, 0.025, tete)
        for k in range(3):
            bloc(f"{nom}_patte{cote}_{k}", (0.07, 0.12, 0.10), (0.35 * cote, 0.15 + k * 0.09, -k * 0.04), m, 0.02, tete)
    bloc(f"{nom}_nuque", (0.68, 0.06, 0.45), (0, 0.345, 0.10), m, 0.03, tete)


def cheveux_chignon(tete, nom, couleur):
    m = mat_cheveux(nom, couleur)
    bloc(f"{nom}_calotte", (0.72, 0.72, 0.14), (0, 0.01, 0.35), m, 0.05, tete)
    bloc(f"{nom}_frange", (0.70, 0.08, 0.16), (0, -0.33, 0.26), m, 0.03, tete)
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.07, 0.70, 0.62), (0.345 * cote, 0.02, 0.05), m, 0.03, tete)
    bloc(f"{nom}_arriere", (0.70, 0.08, 0.66), (0, 0.345, 0.05), m, 0.03, tete)
    bloc(f"{nom}_chignon", (0.30, 0.26, 0.26), (0, 0.30, 0.42), m, 0.10, tete)


def cheveux_courts(tete, nom, couleur):
    m = mat_cheveux(nom, couleur)
    bloc(f"{nom}_calotte", (0.70, 0.70, 0.12), (0, 0.01, 0.36), m, 0.05, tete)
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.05, 0.55, 0.22), (0.34 * cote, 0.07, 0.20), m, 0.02, tete)


def casquette(tete, nom, couleur):
    m = mat_texture(f"casquette_{nom}", couleur, tuple(min(1, c * 1.4) for c in couleur), 120, motif="bruit",
                    rough=0.8, bump=0.1)
    bloc(f"{nom}_casq", (0.74, 0.74, 0.20), (0, 0.0, 0.36), m, 0.08, tete)
    bloc(f"{nom}_visiere", (0.60, 0.36, 0.04), (0, -0.50, 0.28), m, 0.03, tete, rot=(0.12, 0, 0))
    noir = mat_cheveux(nom + "_c", (0.02, 0.015, 0.01))
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.06, 0.50, 0.28), (0.345 * cote, 0.10, 0.12), noir, 0.02, tete)


COIFFURES = {"pompadour": cheveux_pompadour, "chignon": cheveux_chignon, "courts": cheveux_courts,
             "casquette": casquette}


def personnage(nom, pos, rot_z, peau, haut_mat, bas_mat, chaussures, coiffure, couleur_cheveux,
               regard=(0, 0), carrure=1.0, extras=None):
    racine = vide(nom, pos, rot_z)
    m_peau = mat_peau(nom, peau)
    k = carrure
    for cote in (-1, 1):
        bloc(f"{nom}_jambe{cote}", (0.27 * k, 0.30, 0.70), (0.145 * k * cote, 0, 0.45), bas_mat, 0.05, racine)
        bloc(f"{nom}_pied{cote}", (0.29 * k, 0.38, 0.14), (0.145 * k * cote, -0.03, 0.07), chaussures, 0.05, racine)
    bloc(f"{nom}_torse", (0.62 * k, 0.34 * k, 0.70), (0, 0, 1.15), haut_mat, 0.06, racine)
    for cote in (-1, 1):
        epaule = vide(f"{nom}_epaule{cote}", ((0.31 * k + 0.13) * cote, 0, 1.44))
        epaule.parent = racine
        bloc(f"{nom}_bras{cote}", (0.24, 0.28, 0.62), (0, 0, -0.27), haut_mat, 0.06, epaule, rot=(0, 0.06 * cote, 0))
        bloc(f"{nom}_main{cote}", (0.20, 0.22, 0.17), (0.015 * cote, -0.005, -0.64), m_peau, 0.05, epaule)
    bloc(f"{nom}_cou", (0.22, 0.22, 0.10), (0, 0, 1.53), m_peau, 0.03, racine)
    tete = vide(f"{nom}_tete_pivot", (0, 0, 1.90))
    tete.parent = racine
    bloc(f"{nom}_tete", (0.68, 0.68, 0.66), (0, 0, 0), m_peau, 0.06, tete)
    sourcils = (0.02, 0.015, 0.01) if coiffure == "casquette" else couleur_cheveux
    visage(tete, nom, peau, sourcils, regard)
    COIFFURES[coiffure](tete, nom, couleur_cheveux)
    if extras:
        extras(racine, nom, k)
    return racine


def tenue_le_j(racine, nom, k):
    """Chalet chic : col roulé crème torsadé sous veste camel, montre à cadran vert."""
    creme = mat_texture("maille_creme", (0.62, 0.55, 0.43), (0.86, 0.80, 0.68), 34, motif="maille", rough=0.9, bump=0.5)
    bloc(f"{nom}_plastron", (0.26, 0.04, 0.66), (0, -0.165 * k, 1.16), creme, 0.02, racine)
    bloc(f"{nom}_colroule", (0.34, 0.30, 0.13), (0, 0, 1.53), creme, 0.05, racine)
    for cote in (-1, 1):
        bloc(f"{nom}_revers{cote}", (0.10, 0.04, 0.42), (0.15 * cote, -0.185 * k, 1.30), camel(), 0.015, racine,
             rot=(0, 0.25 * cote, 0))
        bloc(f"{nom}_poignet{cote}", (0.25, 0.29, 0.07), (0, 0, -0.53), creme, 0.03, bpy.data.objects[f"{nom}_epaule{cote}"])
    corne = mat_simple("corne", (0.08, 0.05, 0.03), 0.3)
    for z in (1.18, 1.00):
        bloc(f"{nom}_bouton{z}", (0.035, 0.02, 0.035), (0.14, -0.19 * k, z), corne, 0.012, racine)
    acier = mat_simple("acier", (0.85, 0.85, 0.87), rough=0.12, metal=1.0)
    cadran = mat_simple("cadran_vert", (0.02, 0.22, 0.14), rough=0.08, metal=0.6)
    ep = bpy.data.objects[f"{nom}_epaule1"]
    bloc(f"{nom}_bracelet", (0.215, 0.235, 0.035), (0.015, -0.005, -0.565), acier, 0.015, ep)
    bloc(f"{nom}_boitier", (0.08, 0.025, 0.08), (0.015, -0.125, -0.565), acier, 0.02, ep)
    bloc(f"{nom}_cadran", (0.06, 0.01, 0.06), (0.015, -0.139, -0.565), cadran, 0.012, ep)
    bloc(f"{nom}_poche", (0.13, 0.02, 0.025), (-0.17, -0.18 * k, 1.36), camel(), 0.008, racine)


def tenue_momo(racine, nom, k):
    barbe = mat_cheveux("barbe_momo", (0.05, 0.03, 0.02))
    tete = bpy.data.objects[f"{nom}_tete_pivot"]
    bloc(f"{nom}_menton", (0.50, 0.06, 0.11), (0, -0.34, -0.275), barbe, 0.03, tete)
    for cote in (-1, 1):
        bloc(f"{nom}_joue{cote}", (0.10, 0.06, 0.26), (0.28 * cote, -0.34, -0.19), barbe, 0.03, tete)
        bloc(f"{nom}_favori{cote}", (0.05, 0.30, 0.30), (0.345 * cote, -0.12, -0.12), barbe, 0.02, tete)
    bloc(f"{nom}_moustache", (0.26, 0.05, 0.05), (0.0, -0.345, -0.11), barbe, 0.02, tete)


def tenue_nadia(racine, nom, k):
    or_ = mat_simple("or", (1.0, 0.72, 0.35), rough=0.15, metal=1.0)
    for cote in (-1, 1):
        sphere(f"{nom}_boucle{cote}", 0.03, (0.36 * cote, -0.02, 1.83), or_).parent = racine


# ---------------------------------------------------------------- décor : chalet
def chalet():
    bois_mur = mat_texture("rondins", (0.16, 0.08, 0.035), (0.36, 0.20, 0.09), 3.5, motif="bois", rough=0.75,
                           bump=0.6, etire=(0.15, 1, 1))
    parquet = mat_texture("parquet", (0.10, 0.05, 0.022), (0.24, 0.13, 0.06), 2.5, motif="bois", rough=0.35,
                          bump=0.3, etire=(0.2, 1, 1))
    pierre = mat_texture("pierre", (0.22, 0.21, 0.20), (0.50, 0.47, 0.43), 6, motif="bruit", rough=0.9, bump=0.8)
    tapis = mat_texture("tapis", (0.35, 0.05, 0.04), (0.62, 0.15, 0.08), 30, motif="maille", rough=1.0, bump=0.4)

    for i in range(-9, 10):
        bloc(f"lame{i}", (0.48, 12, 0.10), (i * 0.5, 2, -0.05), parquet, 0.02)
    for i in range(12):
        cylindre(f"rondin_fond{i}", 0.17, 11, (0, 4.2, 0.17 + i * 0.34), bois_mur, rot=(0, math.pi / 2, 0))
    for cote in (-1, 1):
        for i in range(12):
            cylindre(f"rondin_cote{cote}_{i}", 0.17, 9, (4.6 * cote, 0.0, 0.17 + i * 0.34), bois_mur,
                     rot=(math.pi / 2, 0, 0))
    for x in (-2.5, 0, 2.5):
        bloc(f"poutre{x}", (0.35, 9, 0.35), (x, 0, 4.1), bois_mur, 0.05)

    # cheminée en pierre
    for i in range(9):
        for j in range(4):
            larg = 0.38 + random.uniform(-0.05, 0.05)
            bloc(f"pierre_{i}_{j}", (larg, 0.5, 0.30), (-4.0 + j * 0.40 + (0.2 if i % 2 else 0), 3.85, 0.15 + i * 0.31),
                 pierre, 0.07)
    bloc("foyer", (0.95, 0.12, 0.75), (-3.4, 3.72, 0.45), mat_simple("foyer", (0.02, 0.015, 0.01), 0.9), 0.04)
    feu = mat_simple("feu", (1, 0.4, 0.1), emission=(1.0, 0.42, 0.08), force=60)
    for n in range(6):
        bloc(f"flamme{n}", (0.10, 0.10, 0.18 + random.random() * 0.25),
             (-3.7 + n * 0.12, 3.52, 0.22 + random.random() * 0.1), feu, 0.04,
             rot=(0, random.uniform(-0.3, 0.3), random.uniform(0, 1)))
    lumiere("feu", "POINT", (-3.4, 3.2, 0.6), 450, (1.0, 0.45, 0.15), 0.4)

    # fenêtre de nuit
    nuit = mat_simple("nuit", (0.1, 0.2, 0.4), emission=(0.15, 0.30, 0.7), force=1.2)
    cadre = mat_simple("cadre", (0.12, 0.06, 0.03), 0.6)
    bloc("vitre", (1.6, 0.05, 1.5), (2.3, 4.0, 2.0), nuit, 0.0)
    bloc("cadre_h", (1.8, 0.15, 0.10), (2.3, 3.95, 2.78), cadre, 0.03)
    bloc("cadre_b", (1.8, 0.15, 0.10), (2.3, 3.95, 1.22), cadre, 0.03)
    bloc("cadre_v", (0.08, 0.15, 1.6), (2.3, 3.95, 2.0), cadre, 0.02)
    bloc("cadre_hz", (1.6, 0.15, 0.06), (2.3, 3.95, 2.0), cadre, 0.02)
    lumiere("fenetre", "AREA", (2.3, 3.7, 2.0), 150, (0.5, 0.65, 1.0), 1.6, rot=(math.radians(90), 0, math.radians(180)))

    bloc("tapis", (4.2, 2.8, 0.03), (0, 0.4, 0.015), tapis, 0.01)

    # guirlande (halos en flou de profondeur)
    ampoule = mat_simple("ampoule", (1, 0.8, 0.5), emission=(1.0, 0.72, 0.38), force=40)
    for n in range(26):
        t = n / 25
        sphere(f"ampoule{n}", 0.035, (-4.0 + t * 8.0, 3.6, 3.55 - 0.35 * math.sin(t * math.pi * 3) ** 2), ampoule)

    # table basse au premier plan, bougies, cartes retournées
    bloc("table", (2.6, 1.0, 0.10), (0.2, -1.55, 0.55), parquet, 0.04)
    for x in (-0.9, 1.3):
        for y in (-1.95, -1.15):
            bloc(f"pied{x}{y}", (0.10, 0.10, 0.5), (x, y, 0.25), parquet, 0.02)
    cire = mat_simple("cire", (0.9, 0.85, 0.75), 0.5, sss=0.4)
    flamme = mat_simple("flamme_bougie", (1, 0.7, 0.3), emission=(1.0, 0.62, 0.25), force=60)
    for n, (x, h) in enumerate([(-0.6, 0.25), (-0.4, 0.17), (1.0, 0.22)]):
        bloc(f"bougie{n}", (0.09, 0.09, h), (x, -1.45, 0.60 + h / 2), cire, 0.03)
        sphere(f"flammeb{n}", 0.022, (x, -1.45, 0.65 + h), flamme)
        lumiere(f"bougie{n}", "POINT", (x, -1.45, 0.69 + h), 8, (1.0, 0.6, 0.3), 0.05)
    carte = mat_simple("dos_carte", (0.25, 0.04, 0.06), 0.4)
    for n in range(5):
        bloc(f"carte{n}", (0.16, 0.24, 0.01), (-0.1 + n * 0.22, -1.6 + random.uniform(-0.1, 0.1), 0.61), carte, 0.005,
             rot=(0, 0, random.uniform(-0.4, 0.4)))


