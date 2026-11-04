# TERA24 — Trump perd le Congrès (version motion design, Remotion)

Rendu : `../output/TERA24_Trump_Midterms_MotionDesign.mp4` (1080×1920, 30 i/s, 80,8 s). Pas de sous-titres incrustés.

```
npm install
scripts/prepare.sh <video_source_trump.mp4> <voix_off.mp3>   # clips + voix + sfx.wav
npx remotion studio src/index.ts                             # éditer / prévisualiser
npx remotion render src/index.ts Main ../output/TERA24_Trump_Midterms_MotionDesign.mp4
```

- `src/timeline.json` : découpage des scènes calé sur la voix off.
- `src/scenes.tsx` : les 18 scènes (carte des USA, hémicycles, jauge, courbe Wall Street, globe…).
- `src/ui.tsx` : habillage TERA24 (logo, tag date, titres pavés blancs/texte rouge, cadre rouge, tampons, grain).
- `scripts/sfx.py` : sound design synthétisé (whoosh, impacts, tics, frappe, pulsation grave).
- Portraits : sources officielles (Texas House pour J. Talarico, Texas Attorney General pour K. Paxton, Congrès américain pour H. Jeffries).
