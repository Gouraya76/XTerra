"""Note la diction de chaque réplique d'un épisode avec Whisper (0 à 1).

Usage : python noter_diction.py <episode> [seuil]
Écrit <episode>/voix/diction.json et affiche la liste des répliques sous le seuil (à passer à meilleure_prise.py).
"""
import difflib
import json
import re
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

ep = sys.argv[1]
seuil = float(sys.argv[2]) if len(sys.argv) > 2 else 0.88
lignes = json.load(open(f"{ep}/dialogues.json", encoding="utf-8"))["lines"]
modele = WhisperModel("small", device="cpu", compute_type="int8")


def norm(s):
    return re.sub(r"[^a-zàâçéèêëîïôûùüÿœ ]", "", s.lower().replace("-", " ").replace("’", "'"))


notes = {}
for i, l in enumerate(lignes):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{ep}/voix/{i:02d}.wav", "-f", "s16le", "-ac", "1",
                          "-ar", "16000", "-"], capture_output=True).stdout
    if not pcm:
        notes[i] = {"score": 0.0, "entendu": "(fichier absent)"}
        continue
    audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
    lu = " ".join(s.text for s in modele.transcribe(audio, language="fr")[0]).strip()
    notes[i] = {"score": round(difflib.SequenceMatcher(None, norm(l["text"]), norm(lu)).ratio(), 3), "entendu": lu}
    print(i, l["who"], notes[i]["score"], flush=True)

json.dump(notes, open(f"{ep}/voix/diction.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
mauvaises = [i for i, n in notes.items() if n["score"] < seuil]
print("MOYENNE", round(sum(n["score"] for n in notes.values()) / len(notes), 3))
print("A_REFAIRE", ",".join(map(str, mauvaises)))
