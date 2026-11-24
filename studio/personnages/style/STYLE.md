# Style des personnages « Le J » — version 2 (à partir de l'épisode 3)

Référence validée par le propriétaire de la chaîne : `reference_style.png` (miniature de l'épisode 2 refaite avec ChatGPT).
Test Blender de ce style : `style_scene.png` et `style_lej.png` (script `blender/test_style.py`).

## Règle
Toutes les prochaines vidéos utilisent ce style. Le code est dans `blender/lib_voxel.py` et `blender/lib_casting.py` :
il s'applique tout seul à chaque personnage créé avec `personnage()` ou `casting()`.

## Visage (fonction `visage`)
- Grands yeux carrés : blanc haut (0,18 × 0,17), gros iris brun très sombre, pupille noire, reflet blanc lumineux en haut.
- Sourcils noirs épais (0,22 × 0,068), légèrement froncés au repos (air sûr de soi).
- Petit nez en bloc, couleur de la peau.
- Bouche : intérieur rouge sombre, dents blanches en haut, langue rose en bas. Elle s'ouvre vers le bas.
- Barbe en option : `barbe(nom, couleur, "courte" | "pleine")`.

## Expressions (fonction `expression(nom, quoi)`)
`neutre`, `choc`, `peur`, `colere`, `mefiant` (option `sourcil_unique=True` : un sourcil levé), `rire`, `sourire`.
Elles règlent l'angle et la hauteur des sourcils, l'ouverture des yeux et de la bouche.
Une goutte de sueur (petit bloc bleu clair sur la joue) renforce le `choc` et la `peur`.

## Mains et poses (fonction `pose(nom, quoi)`)
- Mains avec 4 doigts repliés et un pouce (plus de « moufle »).
- Poses : `croises` (bras croisés), `menton` (main au menton, air de réflexion), `tete` (main sur la tête, panique), `repos`.

## Cheveux et matières
- Cheveux en mèches fines (motif `meches`) : très sombres dans les creux, reflets chauds sur les crêtes.
- LE J : pompadour volumineuse avec mèches fines par-dessus.
- Pulls en maille torsadée (motif `torsade`), chemises à carreaux (motif `tartan`).

## Lumière et décor
- Clé chaude orange devant (bougies, feu), remplissage faible, contre-jour bleu froid derrière : contraste fort.
- AgX « Punchy », halo autour des lumières et léger vignetage (`post_effets(scene)`).
- Chalet : plafond en planches sombres, guirlande d'ampoules, vraie fenêtre ouverte sur la nuit : ciel bleu, sapins enneigés,
  flocons qui tombent en boucle (`dehors()`), yeux jaunes possibles dehors (`yeux_dehors([...])`), tasses (`tasse()`).

## Limites connues (Blender contre image IA)
- L'image de référence est une illustration IA : elle a plus de détails peints (rides, plis, fourrure) que des blocs 3D animés.
- Le rendu Blender garde la même direction : visages expressifs, couleurs chaudes, contraste, décor riche. Il reste « voxel ».
- Pour les miniatures, le plus fort reste : rendu Cycles puis passage dans ChatGPT avec le prompt de `PUBLICATION.md`.
