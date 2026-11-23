# B-roll « images seules »

Vidéo composée uniquement de photos réelles liées au script : zoom lent (Ken Burns),
coupes franches calées sur la voix off, sans texte ni effets sonores.
Format : `"size"` dans timeline.json (1080x1920 plein écran vertical, ou 1080x960 pour la moitié basse).

```
cd zelensky_merkury
python3 ../render_broll.py timeline.json voix_frances1.mp3 ../../output/Zelensky_Merkury_Images.mp4
python3 ../render_broll.py timeline.json voix_frances1.mp3 plein_ecran.mp4 --size 1080x1920   # 9:16 plein écran
```

- `timeline.json` : début de chaque plan (en secondes) et l'image associée.
- `script.txt` : texte lu ; `voix_frances1.mp3` : voix Fish Audio « frances 1 » (modèle s2.1-pro-free).
- `sources.txt` : provenance de chaque image.
- `description.txt` : légende de la vidéo (mentionne toujours TERA24).

## Vidéo source + voix off (`render_footage.py`)
Quand l'actu est une vidéo (images amateur, reportage), on garde la vidéo source et on ajoute
la voix off par-dessus, son d'origine baissé (coupé sur les ralentis), volume normalisé à -14 LUFS.

```
cd pitbull_lapd
python3 ../render_footage.py montage.json ../../output/Pitbull_LAPD_VoixOff.mp4
```
`montage.json` : liste de segments `[debut, fin, vitesse, note]` de la vidéo source, mis bout à bout.

## Habillage TERA24 + VFX (`tera24_vfx.py`)
Pour les vidéos reprises depuis un lien : overlay TERA24 adapté à chaque sujet + cercles et flèches rouges.
- Haut gauche : « VILLE, PAYS » (bandeau rouge) + date (bandeau blanc), redessinés à chaque vidéo.
- Haut droite : logo TERA24 (`overlay/tera24_logo.png`, découpé de `overlay/tera24_overlay_reference.png`), toujours identique.
- Bas : titre + sous-titre, 5 s maximum, entrée/sortie en glissement.
- VFX : `cercles` (tracé animé, suivi par images clés `[t, x, y, r]`) et `fleches` (`[t, x, y]` = pointe, `angle` = côté d'où elle vient).

```
cd pitbull_lapd
python3 ../render_footage.py montage.json /tmp/base.mp4
python3 ../tera24_vfx.py vfx.json /tmp/base.mp4 ../../output/Pitbull_LAPD_TERA24.mp4
```
