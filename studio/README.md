# Studio d'animation 3D voxel

Moteur de dessins animés 3D en style « voxel » (personnages et décors en blocs) pour des vidéos YouTube longues.

```
studio/
├── anim/              projet Remotion + Three.js (personnages, décors, moteur d'épisode)
├── episodes/<ep>/     script.json, dialogues.json, voix générées, sous-titres.srt
├── scripts/
│   ├── voix.py              voix Fish Audio (+ pitch), en parallèle
│   ├── meilleure_prise.py   régénère une réplique jusqu'à une diction nette (Whisper)
│   ├── build_ep2.py         timeline, mots horodatés, musique, bruitages, mixage
│   ├── render_part.sh       rendu d'un morceau (pour paralléliser sur plusieurs machines)
│   └── assembler.sh         assemble les morceaux + la bande son
└── output/            vidéos finales
```

## Règle de rangement (demandée par le propriétaire de la chaîne)
Quand une vidéo est finie et livrée :
- les sessions de rendu en morceaux sont archivées ;
- les morceaux (`output/parts/`) sont supprimés, sur le disque et sur la branche ;
- seule la vidéo finale est gardée ; les nouveaux rendus remplacent les anciens.
