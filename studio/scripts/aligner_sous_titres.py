"""Remplace les mots de Whisper par les mots exacts du script, en gardant les temps de Whisper.

Pourquoi : Whisper se trompe parfois (« Luna » pour « Louna »), oublie des mots, ou invente une phrase entière
(« Sous-titres réalisés par la communauté d'Amara.org »). Le texte du script, lui, est juste.

Méthode : alignement lettre par lettre (difflib) entre le texte du script et ce que Whisper a entendu.
Chaque mot du script prend le temps de sa première lettre retrouvée ; les mots non retrouvés sont placés
entre leurs voisins. Si Whisper a inventé la réplique (presque rien en commun), les mots sont répartis
sur la durée de la voix, au prorata de leur longueur.

Usage : python scripts/aligner_sous_titres.py anim/src/ep02.json
"""
import difflib
import json
import re
import sys
import unicodedata


def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


def aligner(beat):
    toks = [w for w in beat["text"].split() if norm(w)]
    ws = [w for w in beat.get("words", []) if norm(w["w"])]
    debut, fin = beat["vstart"], beat["vstart"] + beat["dur"]
    # lettres de Whisper, chacune avec son temps (interpolé dans le mot)
    lw, tw = [], []
    for w in ws:
        n = norm(w["w"])
        for k, c in enumerate(n):
            lw.append(c)
            tw.append(w["s"] + (w["e"] - w["s"]) * k / max(1, len(n)))
    # lettres du script, avec l'index du mot
    ls, idx = [], []
    for i, w in enumerate(toks):
        for c in norm(w):
            ls.append(c)
            idx.append(i)
    sm = difflib.SequenceMatcher(a=ls, b=lw, autojunk=False)
    t_mot = [None] * len(toks)
    commun = 0
    for a, b, n in sm.get_matching_blocks():
        commun += n
        for k in range(n):
            i = idx[a + k]
            if t_mot[i] is None:
                t_mot[i] = tw[b + k]
    if commun < 0.5 * len(ls):  # réplique inventée par Whisper : répartition régulière
        total = sum(len(norm(w)) + 2 for w in toks)
        t, t_mot = debut, []
        for w in toks:
            t_mot.append(t)
            t += (fin - debut) * (len(norm(w)) + 2) / total
    else:  # trous : interpolation entre voisins connus
        connus = [(i, t) for i, t in enumerate(t_mot) if t is not None]
        for i in range(len(toks)):
            if t_mot[i] is None:
                av = [(j, t) for j, t in connus if j < i]
                ap = [(j, t) for j, t in connus if j > i]
                ja, ta = av[-1] if av else (-1, debut)
                jb, tb = ap[0] if ap else (len(toks), fin)
                t_mot[i] = ta + (tb - ta) * (i - ja) / (jb - ja)
    for i in range(1, len(t_mot)):  # temps croissants
        t_mot[i] = max(t_mot[i], t_mot[i - 1] + 0.06)
    return [{"w": w, "s": round(t_mot[i], 3), "e": round(t_mot[i + 1] if i + 1 < len(toks) else min(fin, t_mot[i] + 0.6), 3)}
            for i, w in enumerate(toks)]


if __name__ == "__main__":
    chemin = sys.argv[1]
    tl = json.load(open(chemin, encoding="utf-8"))
    for o in tl["items"]:
        if o["kind"] == "beat":
            o["words"] = aligner(o)
    json.dump(tl, open(chemin, "w", encoding="utf-8"), ensure_ascii=False)
    print("sous-titres alignés sur le script :", chemin)
