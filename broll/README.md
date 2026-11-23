# B-roll « images seules »

Vidéo composée uniquement de photos réelles liées au script : zoom lent (Ken Burns),
coupes franches calées sur la voix off, sans texte ni effets sonores.
Format par défaut 1080×960 (la moitié basse d'une vidéo 9:16, à poser sous la face caméra).

```
cd zelensky_merkury
python3 ../render_broll.py timeline.json voix_frances1.mp3 ../../output/Zelensky_Merkury_Images.mp4
python3 ../render_broll.py timeline.json voix_frances1.mp3 plein_ecran.mp4 --size 1080x1920   # 9:16 plein écran
```

- `timeline.json` : début de chaque plan (en secondes) et l'image associée.
- `script.txt` : texte lu ; `voix_frances1.mp3` : voix Fish Audio « frances 1 » (modèle s2.1-pro-free).
- `sources.txt` : provenance de chaque image.
