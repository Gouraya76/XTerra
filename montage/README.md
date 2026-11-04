# TERA24 – Remontage « Trump perd le Congrès » (midterms 2026)

- Rendu final : `output/TERA24_Trump_Midterms.mp4` (1080×1920, 30 i/s, 80,8 s, voix off MP3)
- Script : `render.py` (Python/PIL + ffmpeg), sans sous-titres incrustés.

```
python3 render.py <dossier_clips> <voix.mp3> <sortie.mp4>
python3 render.py <dossier_clips> <voix.mp3> <prefixe.mp4> --preview 3,10,20   # images de contrôle
```
Le dossier de clips contient les plans extraits de la vidéo source (trumpA, trumpB, capW, gates, voter, wh, capS en JPG 1080×1920) et deux portraits (`face_tallarico.png`, `face_jeffries.png`).
