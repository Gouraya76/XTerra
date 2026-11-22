# BORZ : atelier de dessins animés

```
borz/
├── source/           images d'origine (principaux + secondaires)
├── personnages/      les 13 personnages détourés (PNG transparents)
├── BIBLE.md          univers, personnages, arc de la saison 1
├── episodes/
│   ├── EP01_le_grand_defi.md      script complet de l'épisode 1
│   └── ep01_test/                 dialogues.json, voix générées, sous-titres.srt
├── scripts/
│   ├── detourage.py   détourage automatique (rembg + nettoyage)
│   ├── voix.py        voix Fish Audio + pitch « cartoon »
│   └── build_ep.py    minutage, musique et bruitages synthétisés, mixage, timeline
├── anim/             projet Remotion (décors SVG, personnages animés, caméra)
└── output/           vidéos finales
```

## Fabriquer un épisode

```
python3 scripts/voix.py episodes/ep01_test
python3 scripts/build_ep.py episodes/ep01_test anim/public/ep01 anim/src/ep01.json
cd anim && npm install && npx remotion render src/index.ts EP01 ../output/BORZ_EP01_test.mp4
```

`npx remotion studio src/index.ts` ouvre l'éditeur pour prévisualiser et ajuster.
