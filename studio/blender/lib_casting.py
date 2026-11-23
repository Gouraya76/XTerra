"""Distribution « Le J » : les 9 personnages de l'épisode Loup-Garou (et des suivants)."""
import math

import bpy

from lib_voxel import (COIFFURES, NOIR_CHEVEUX, PEAU_MATE, bloc, camel, mat_cheveux, mat_simple, mat_texture,
                       personnage, sphere, tenue_le_j, tenue_momo, tenue_nadia)


# ---------------------------------------------------------------- coiffures en plus
def cheveux_longs(tete, nom, couleur):
    """Cheveux longs lâchés avec frange (LOUNA)."""
    m = mat_cheveux(nom, couleur)
    bloc(f"{nom}_calotte", (0.72, 0.72, 0.14), (0, 0.01, 0.35), m, 0.05, tete)
    for j in range(4):
        bloc(f"{nom}_frange{j}", (0.17, 0.08, 0.15 + 0.02 * (j % 2)), (-0.255 + j * 0.17, -0.33, 0.25), m, 0.03, tete)
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.08, 0.72, 0.95), (0.35 * cote, 0.02, -0.08), m, 0.035, tete)
    bloc(f"{nom}_arriere", (0.72, 0.09, 0.98), (0, 0.35, -0.08), m, 0.035, tete)


def cheveux_carre(tete, nom, couleur):
    """Carré plongeant, raie sur le côté (ÉLISE)."""
    m = mat_cheveux(nom, couleur)
    bloc(f"{nom}_calotte", (0.72, 0.72, 0.15), (0, 0.01, 0.35), m, 0.05, tete)
    bloc(f"{nom}_meche", (0.34, 0.07, 0.12), (-0.17, -0.335, 0.27), m, 0.03, tete, rot=(0, 0.18, 0))
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.08, 0.70, 0.62), (0.35 * cote, 0.0, 0.03), m, 0.035, tete, rot=(0.12, 0, 0))
    bloc(f"{nom}_arriere", (0.72, 0.09, 0.60), (0, 0.35, 0.08), m, 0.035, tete)


def cheveux_papi(tete, nom, couleur):
    """Crâne dégarni, couronne de cheveux blancs (PAPI GÉRARD)."""
    m = mat_cheveux(nom, couleur)
    for cote in (-1, 1):
        bloc(f"{nom}_cote{cote}", (0.07, 0.50, 0.24), (0.345 * cote, 0.09, 0.10), m, 0.03, tete)
    bloc(f"{nom}_arriere", (0.70, 0.07, 0.30), (0, 0.345, 0.10), m, 0.03, tete)


def mat_cape():
    return mat_texture("cape_meneur", (0.015, 0.014, 0.016), (0.06, 0.055, 0.065), 70, motif="bruit", rough=0.9, bump=0.2)


def capuche(tete, nom, couleur):
    """Grande capuche qui laisse le visage dans l'ombre (LE MENEUR)."""
    m = mat_cape()
    bloc(f"{nom}_cap_haut", (0.86, 0.86, 0.12), (0, 0.04, 0.42), m, 0.06, tete)
    bloc(f"{nom}_cap_pointe", (0.40, 0.46, 0.16), (0, 0.22, 0.52), m, 0.07, tete, rot=(-0.4, 0, 0))
    bloc(f"{nom}_cap_bord", (0.84, 0.16, 0.10), (0, -0.40, 0.36), m, 0.04, tete)
    for cote in (-1, 1):
        bloc(f"{nom}_cap_cote{cote}", (0.10, 0.84, 0.92), (0.40 * cote, 0.02, 0.0), m, 0.05, tete)
    bloc(f"{nom}_cap_dos", (0.84, 0.10, 0.92), (0, 0.41, 0.0), m, 0.05, tete)


COIFFURES.update({"longs": cheveux_longs, "carre": cheveux_carre, "papi": cheveux_papi, "capuche": capuche})


def lunettes(nom, couleur=(0.02, 0.02, 0.02)):
    m = mat_simple(f"monture_{nom}", couleur, rough=0.3)
    verre = mat_simple("verre", (0.8, 0.9, 1.0), rough=0.02)
    verre.node_tree.nodes["Principled BSDF"].inputs["Alpha"].default_value = 0.12
    tete = bpy.data.objects[f"{nom}_tete_pivot"]
    for cote in (-1, 1):
        x = 0.14 * cote
        bloc(f"{nom}_cadre_h{cote}", (0.21, 0.02, 0.02), (x, -0.36, 0.11), m, 0.01, tete)
        bloc(f"{nom}_cadre_b{cote}", (0.21, 0.02, 0.02), (x, -0.36, -0.03), m, 0.01, tete)
        bloc(f"{nom}_cadre_ext{cote}", (0.02, 0.02, 0.16), (x + 0.105 * cote, -0.36, 0.04), m, 0.01, tete)
        bloc(f"{nom}_cadre_int{cote}", (0.02, 0.02, 0.16), (x - 0.095 * cote, -0.36, 0.04), m, 0.01, tete)
        bloc(f"{nom}_verre{cote}", (0.17, 0.01, 0.13), (x, -0.355, 0.04), verre, 0.005, tete)
        bloc(f"{nom}_branche{cote}", (0.02, 0.36, 0.025), (0.35 * cote, -0.18, 0.10), m, 0.008, tete)
    bloc(f"{nom}_pont", (0.08, 0.03, 0.025), (0, -0.36, 0.07), m, 0.008, tete)


# ---------------------------------------------------------------- matières des tenues
def mat_louna():
    return mat_texture("sweat_rose", (0.78, 0.42, 0.55), (0.95, 0.66, 0.76), 110, motif="bruit", rough=0.95, bump=0.12)


def mat_elise():
    return mat_texture("blazer_bordeaux", (0.22, 0.02, 0.05), (0.38, 0.05, 0.09), 140, motif="bruit", rough=0.6, bump=0.08)


def mat_theo():
    return mat_texture("sweat_gris", (0.16, 0.17, 0.19), (0.30, 0.31, 0.34), 120, motif="bruit", rough=0.9, bump=0.1)


# ---------------------------------------------------------------- tenues
def tenue_louna(racine, nom, k):
    bonbon = mat_simple("chewing_gum", (1.0, 0.35, 0.6), rough=0.35, sss=0.3)
    blanc = mat_texture("cordon_blanc", (0.85, 0.85, 0.85), (0.95, 0.95, 0.95), 60, motif="bruit", rough=0.8, bump=0.1)
    bloc(f"{nom}_capuche_dos", (0.56, 0.22, 0.20), (0, 0.20, 1.50), mat_louna(), 0.07, racine)
    bloc(f"{nom}_poche_ventrale", (0.40, 0.03, 0.18), (0, -0.18 * k, 0.98), mat_louna(), 0.03, racine)
    for cote in (-1, 1):
        bloc(f"{nom}_cordon{cote}", (0.025, 0.02, 0.22), (0.07 * cote, -0.18 * k, 1.36), blanc, 0.008, racine)
    b = sphere(f"{nom}_bulle", 0.07, (0.05, -0.43, 1.76), bonbon)
    b.parent = racine
    b.hide_render = True  # visible seulement quand elle fait une bulle


def tenue_elise(racine, nom, k):
    perle = mat_simple("perle", (0.95, 0.93, 0.88), rough=0.15, sss=0.2)
    noir = mat_texture("col_noir", (0.01, 0.01, 0.012), (0.05, 0.05, 0.06), 34, motif="maille", rough=0.8, bump=0.3)
    bloc(f"{nom}_plastron", (0.26, 0.04, 0.64), (0, -0.165 * k, 1.17), noir, 0.02, racine)
    bloc(f"{nom}_colroule", (0.32, 0.28, 0.12), (0, 0, 1.53), noir, 0.05, racine)
    for cote in (-1, 1):
        sphere(f"{nom}_perle{cote}", 0.035, (0.36 * cote, -0.02, 1.82), perle).parent = racine
    bpy.data.objects[f"{nom}_bouche"].data.materials[0] = mat_simple("rouge_levres", (0.45, 0.02, 0.05), rough=0.3)


def tenue_theo(racine, nom, k):
    lunettes(nom)
    orange = mat_simple("orange_vif", (0.95, 0.38, 0.05), rough=0.6)
    bloc(f"{nom}_bande", (0.64 * k, 0.36 * k, 0.07), (0, 0, 1.10), orange, 0.02, racine)
    bloc(f"{nom}_capuche_dos", (0.56, 0.22, 0.20), (0, 0.20, 1.50), mat_theo(), 0.07, racine)
    ecran = mat_simple("ecran_tel", (0.01, 0.01, 0.015), rough=0.1, emission=(0.2, 0.5, 1.0), force=0.6)
    bloc(f"{nom}_telephone", (0.10, 0.18, 0.02), (0.0, -0.10, -0.73), ecran, 0.01, bpy.data.objects[f"{nom}_epaule-1"])


def tenue_papi(racine, nom, k):
    blanc = mat_cheveux("moustache_papi", (0.80, 0.78, 0.74))
    tete = bpy.data.objects[f"{nom}_tete_pivot"]
    bloc(f"{nom}_moustache", (0.30, 0.05, 0.07), (0.0, -0.35, -0.10), blanc, 0.025, tete)
    for nom_obj in (f"{nom}_sourcil-1", f"{nom}_sourcil1"):
        bpy.data.objects[nom_obj].data.materials[0] = blanc
    beret = mat_texture("beret_gris", (0.16, 0.16, 0.17), (0.28, 0.28, 0.30), 160, motif="bruit", rough=0.9, bump=0.1)
    bloc(f"{nom}_beret", (0.76, 0.76, 0.13), (0, -0.04, 0.39), beret, 0.06, tete, rot=(0.08, 0, 0))
    bloc(f"{nom}_beret_visiere", (0.62, 0.22, 0.04), (0, -0.42, 0.32), beret, 0.02, tete, rot=(0.15, 0, 0))
    bois = mat_simple("bois_canne", (0.22, 0.10, 0.04), rough=0.4)
    bloc(f"{nom}_canne", (0.06, 0.06, 0.95), (0.62, -0.12, 0.48), bois, 0.02, racine)
    bloc(f"{nom}_canne_poignee", (0.20, 0.07, 0.06), (0.56, -0.12, 0.95), bois, 0.025, racine)
    corne = mat_simple("corne", (0.08, 0.05, 0.03), 0.3)
    for z in (1.30, 1.12, 0.94):
        bloc(f"{nom}_bouton{z}", (0.04, 0.02, 0.04), (0, -0.175 * k, z), corne, 0.012, racine)


def tenue_meneur(racine, nom, k):
    """Longue cape noire jusqu'au sol, yeux ambrés qui brillent sous la capuche."""
    bloc(f"{nom}_cape", (0.86 * k, 0.48 * k, 1.42), (0, 0.02, 0.73), mat_cape(), 0.08, racine)
    oeil = mat_simple("yeux_meneur", (1.0, 0.6, 0.1), emission=(1.0, 0.55, 0.12), force=8)
    for cote in (-1, 1):
        bpy.data.objects[f"{nom}_iris{cote}"].data.materials[0] = oeil
        bpy.data.objects[f"{nom}_reflet{cote}"].hide_render = True
        bpy.data.objects[f"{nom}_oeil{cote}"].data.materials[0] = mat_simple("ombre", (0.01, 0.01, 0.01), 0.9)
    bpy.data.objects[f"{nom}_bouche"].hide_render = True
    for cote in (-1, 1):
        bpy.data.objects[f"{nom}_sourcil{cote}"].hide_render = True
        bpy.data.objects[f"{nom}_oreille{cote}"].hide_render = True
    or_ = mat_simple("or", (1.0, 0.72, 0.35), rough=0.15, metal=1.0)
    bloc(f"{nom}_fermoir", (0.12, 0.03, 0.12), (0, -0.26 * k, 1.38), or_, 0.03, racine, rot=(0, 0.785, 0))


# ---------------------------------------------------------------- distribution
def _tenues():
    bas_brun = mat_texture("pantalon_brun", (0.10, 0.065, 0.045), (0.20, 0.13, 0.08), 80, motif="bruit", rough=0.8, bump=0.1)
    cuir = mat_simple("cuir_brun", (0.16, 0.07, 0.03), rough=0.35)
    vert = mat_texture("pull_vert", (0.04, 0.16, 0.12), (0.10, 0.30, 0.22), 30, motif="maille", rough=0.9, bump=0.4)
    jean = mat_texture("jean", (0.06, 0.09, 0.18), (0.14, 0.20, 0.35), 150, motif="bruit", rough=0.85, bump=0.15)
    jean_clair = mat_texture("jean_clair", (0.25, 0.33, 0.48), (0.40, 0.50, 0.65), 150, motif="bruit", rough=0.85, bump=0.15)
    bottes = mat_simple("bottes_noires", (0.02, 0.02, 0.02), 0.3)
    rouge = mat_texture("sweat_rouge", (0.40, 0.03, 0.03), (0.70, 0.10, 0.06), 120, motif="bruit", rough=0.9, bump=0.1)
    gris = mat_texture("jogging_gris", (0.18, 0.18, 0.19), (0.32, 0.32, 0.33), 120, motif="bruit", rough=0.9, bump=0.1)
    baskets = mat_simple("baskets", (0.85, 0.85, 0.85), 0.5)
    carreaux = mat_texture("chemise_carreaux", (0.15, 0.05, 0.04), (0.45, 0.10, 0.07), 6, motif="maille", rough=0.9, bump=0.2)
    noir_pant = mat_texture("pantalon_noir", (0.015, 0.015, 0.018), (0.05, 0.05, 0.06), 120, motif="bruit", rough=0.7, bump=0.08)
    velours = mat_texture("velours_brun", (0.20, 0.12, 0.06), (0.32, 0.20, 0.10), 45, motif="maille", rough=0.9, bump=0.3,
                          etire=(1, 0.2, 1))
    gilet = mat_texture("gilet_beige", (0.48, 0.40, 0.28), (0.66, 0.58, 0.44), 30, motif="maille", rough=0.95, bump=0.45)
    return {
        "LE_J": dict(peau=PEAU_MATE, haut=camel(), bas=bas_brun, pieds=cuir, coiffure="pompadour", cheveux=NOIR_CHEVEUX,
                     extras=tenue_le_j),
        "NADIA": dict(peau=(0.80, 0.56, 0.42), haut=vert, bas=jean, pieds=bottes, coiffure="chignon", cheveux=(0.10, 0.05, 0.02),
                      carrure=0.92, extras=tenue_nadia),
        "KEKE": dict(peau=(0.45, 0.27, 0.15), haut=rouge, bas=gris, pieds=baskets, coiffure="casquette", cheveux=(0.05, 0.08, 0.20)),
        "LOUNA": dict(peau=(0.86, 0.64, 0.52), haut=mat_louna(), bas=jean_clair, pieds=baskets, coiffure="longs",
                      cheveux=(0.36, 0.22, 0.11), carrure=0.88, extras=tenue_louna),
        "MOMO": dict(peau=(0.70, 0.46, 0.30), haut=carreaux, bas=jean, pieds=cuir, coiffure="courts", cheveux=(0.03, 0.02, 0.015),
                     carrure=1.25, extras=tenue_momo),
        "ELISE": dict(peau=(0.84, 0.62, 0.50), haut=mat_elise(), bas=noir_pant, pieds=bottes, coiffure="carre",
                      cheveux=(0.012, 0.010, 0.012), carrure=0.9, extras=tenue_elise),
        "THEO": dict(peau=(0.78, 0.55, 0.40), haut=mat_theo(), bas=jean, pieds=baskets, coiffure="courts",
                     cheveux=(0.20, 0.11, 0.05), carrure=0.95, extras=tenue_theo),
        "PAPI_GERARD": dict(peau=(0.76, 0.52, 0.40), haut=gilet, bas=velours, pieds=cuir, coiffure="papi",
                            cheveux=(0.80, 0.78, 0.74), carrure=0.95, extras=tenue_papi),
        "MENEUR": dict(peau=(0.012, 0.009, 0.008), haut=mat_cape(), bas=mat_cape(), pieds=mat_cape(), coiffure="capuche",
                       cheveux=(0.02, 0.02, 0.02), carrure=1.15, extras=tenue_meneur),
    }


def casting(positions):
    """Crée les personnages demandés. positions = {NOM: ((x, y, z), rot_z en degrés)}."""
    tenues = _tenues()
    racines = {}
    for nom, (pos, rz) in positions.items():
        d = tenues[nom]
        racines[nom] = personnage(nom, pos, math.radians(rz), d["peau"], d["haut"], d["bas"], d["pieds"], d["coiffure"],
                                  d["cheveux"], carrure=d.get("carrure", 1.0), extras=d.get("extras"))
    return racines
