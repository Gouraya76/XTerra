# Casting permanent de la chaîne « Le J »

Règle : chaque personnage a UNE planche de référence faite par le propriétaire avec ChatGPT, rangée dans
`personnages/<NOM>/reference/`. Les vidéos reproduisent CE personnage, jamais une autre version.

## Les 14 personnages (assez pour tous les jeux et concepts : 8 à 12 joueurs par vidéo + l'hôte + le maître du jeu)
| # | Nom | Rôle permanent | Statut |
|---|---|---|---|
| 1 | LE J | Hôte de la chaîne, joue ou présente | Complet le 24/11/2026 (avec moustache : `tete_vide_et_14_bouches_moustache.png`) |
| 2 | LE MENEUR | Maître du jeu mystérieux (cape, capuche, yeux ambrés) : arbitre de tous les jeux | À faire |
| 3 | NADIA | La maligne qui devine tout | À faire |
| 4 | KÉKÉ | Le bavard qui accuse tout le monde (casquette bleue, sweat rouge) | À faire |
| 5 | LOUNA | La gentille… en apparence (sweat rose, chewing-gum, créoles dorées) | Complète le 24/11/2026 (`LOUNA/FICHE.md`) |
| 6 | MOMO | Le gentil géant gourmand (barbe, chemise à carreaux) | À faire |
| 7 | ÉLISE | La menteuse de génie, élégante (rouge et noir) | À faire |
| 8 | THÉO | Le complotiste à lunettes, toujours une théorie | À faire |
| 9 | PAPI GÉRARD | Le papi sarcastique (béret, gilet, canne) | À faire |
| 10 | INÈS | La sportive mauvaise perdante (queue de cheval, survêtement) | Nouveau |
| 11 | MAXENCE | Le fils de riche frimeur (chemise, lunettes de soleil sur la tête) | Nouveau |
| 12 | MAMIE JO | La mamie gameuse espiègle (cheveux violets, casque audio) | Nouveau |
| 13 | SAMY | Le petit frère de LE J, 12 ans, insolent (casquette à l'envers) | Nouveau |
| 14 | YASMINE | L'influenceuse, toujours téléphone en main | Nouveau |

## Ce qu'il faut demander à ChatGPT pour chaque personnage
1. La même planche que celle de LE J (vues 360°, expressions, formes de bouche, formes d'yeux, mains, éléments séparés).
2. En plus, en fichiers séparés (c'est ce qui permet de reproduire le personnage à l'identique) :
   - corps entier de face, bras écartés à 30° (« A-pose »), expression neutre, fond noir uni, 2048 px de haut, sans perspective ;
   - même chose de profil, puis de dos ;
   - la tête seule de face, neutre, 1024 × 1024, sans perspective ;
   - une planche « visage HD » : les 8 bouches (M, A/E, O, U, F/V, L, S/Z, B/P) + sourire, rire, choc ; les 5 yeux ;
     4 sourcils (neutre, colère, inquiet, levé) ; chaque élément grand (300 px au moins), sur fond uni ;
   - la liste des couleurs en code hexadécimal (peau, cheveux, chaque vêtement, chaussures).
3. Aucun logo de marque (baskets, vêtements) : risque de droit des marques sur YouTube.

## Comment je m'en sers
- Le corps 3D (Blender) est construit d'après les vues de face, de profil et de dos, aux couleurs exactes.
- Le visage vient directement des éléments HD : yeux, sourcils et bouches sont posés sur la tête 3D.
  La bouche change selon le son prononcé (synchronisation labiale par phonème), au lieu de juste s'ouvrir.
