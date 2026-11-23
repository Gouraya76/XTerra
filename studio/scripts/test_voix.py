"""Teste chaque voix de VOIX_TEST : une phrase dans le ton du personnage, jusqu'à 3 prises, garde la mieux articulée.

Usage : python test_voix.py <dossier_sortie>
Sortie : <dossier_sortie>/<NOM>.mp3 et un score de diction (Whisper) par voix.
"""
import difflib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.request

import numpy as np
from faster_whisper import WhisperModel

VOIX_TEST = {
    "LE_J": ("b268730efffc42a89fa4eaccdde1af48",
             "Salut tout le monde, c'est Le J ! Ce soir, huit joueurs, un chalet perdu dans la neige, et des loups cachés parmi nous."),
    "LE_MENEUR": ("7e327849fe89489387cb3e016c714834",
                  "La nuit tombe sur le chalet. Fermez les yeux. Les loups-garous, réveillez-vous."),
    "NADIA": ("9ab918eff1784bdd938a92b629b1eaaa",
              "Calmez-vous. Réfléchissez deux secondes. Qui a voté contre Momo hier soir ? Exactement."),
    "KEKE": ("d99596e8405d4651bcd3ebe45df58f97",
             "C'est lui ! Je vous jure que c'est lui ! Regardez sa tête, il transpire, il est grillé !"),
    "LOUNA": ("eb6af859cca44114a92dee68f39cf4a9",
              "Attendez, attendez, je comprends rien ! Pourquoi tout le monde me regarde comme ça ?"),
    "MOMO": ("fe118d40f7e042dd86143e2938f0cc2e",
             "Hé, doucement les gars. Moi je suis gentil, je veux juste qu'on mange une raclette tranquille."),
    "ELISE": ("339d8b4a48bb4222acc5f58a9826ae96",
              "Oh, quelle surprise. Kéké accuse encore quelqu'un. C'est presque attendrissant."),
    "THEO": ("0a672e4cbc5d43e7b87464d5c48a9456",
             "J'ai une théorie : la porte grince à minuit pile, donc le loup dort dans la chambre du fond !"),
    "PAPI_GERARD": ("0295b1d678ad4086af8b0d74b5c205e2",
                    "De mon temps, on ne votait pas au hasard. Vous êtes tous des amateurs."),
}


def cle_fish():
    k = os.environ.get("FISH_API_KEY")
    if not k and os.name == "nt":
        import winreg
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, "Environment") as r:
            k = winreg.QueryValueEx(r, "FISH_API_KEY")[0]
    if not k:
        sys.exit("FISH_API_KEY manquante")
    return k.strip().strip('"')


def tts(texte, ref, sortie):
    req = urllib.request.Request(
        "https://api.fish.audio/v1/tts", method="POST",
        data=json.dumps({"text": texte, "reference_id": ref, "format": "wav"}).encode(),
        headers={"Authorization": f"Bearer {cle_fish()}", "Content-Type": "application/json", "model": "s2.1-pro-free"})
    with urllib.request.urlopen(req, timeout=180) as r:
        open(sortie, "wb").write(r.read())


def norm(s):
    return re.sub(r"[^a-zàâçéèêëîïôûùüÿœ ]", "", s.lower().replace("-", " "))


def main():
    dossier = sys.argv[1]
    os.makedirs(dossier, exist_ok=True)
    modele = WhisperModel("small", device="cpu", compute_type="int8")
    tmp = tempfile.mkdtemp()
    for nom, (ref, texte) in VOIX_TEST.items():
        meilleur = (-1.0, "", None)
        for prise in range(3):
            brut = os.path.join(tmp, f"{nom}_{prise}.wav")
            for essai in range(4):
                try:
                    tts(texte, ref, brut)
                    break
                except Exception as e:  # noqa: BLE001
                    print(nom, "erreur", e, flush=True)
                    if "401" in str(e) or "402" in str(e):
                        sys.exit(f"Clé refusée par Fish Audio : {e}")
                    time.sleep(5 * (essai + 1))
            else:
                continue
            pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", brut, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                                 capture_output=True).stdout
            audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
            lu = " ".join(s.text for s in modele.transcribe(audio, language="fr")[0])
            score = difflib.SequenceMatcher(None, norm(texte), norm(lu)).ratio()
            if score > meilleur[0]:
                meilleur = (score, lu, brut)
            if score >= 0.92:
                break
        if meilleur[2] is None:
            print(f"{nom} | ÉCHEC", flush=True)
            continue
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", meilleur[2], "-af", "loudnorm=I=-16:TP=-1.5",
                        "-ar", "44100", "-b:a", "192k", os.path.join(dossier, f"{nom}.mp3")], check=True)
        print(f"{nom} | score {meilleur[0]:.2f} | entendu : {meilleur[1].strip()}", flush=True)


if __name__ == "__main__":
    main()
