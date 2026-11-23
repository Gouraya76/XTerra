Je reprends un projet de vidéos YouTube animées commencé dans une session Claude Code cloud. Lis tout avant d'agir.

## Le projet
Chaîne YouTube « Le J ». Ce sont des vidéos animées en 3D voxel (personnages en blocs arrondis, style Minecraft premium) d'au moins 8 minutes. Elles reprennent des concepts viraux de YouTubeurs français (Squeezie, Michou, Inoxtag…) avec une histoire, des événements et une fin 100 % originaux.

## Le dépôt
- GitHub `Gouraya76/XTerra`, branche `claude/youtube-character-stories-wg86ck`. Clone-la ou récupère-la dans ce dossier, puis travaille dans `studio/`.
- Ne pousse que sur cette branche, jamais de force push, et pas de pull request sauf si je la demande.
- Lis d'abord `studio/README.md`, `studio/personnages/HOTE.md` et `studio/personnages/VOIX.md`.

## Ce qui existe déjà
- Épisode 1 « QUI EST LE VRAI CHEF ? » (concept « Qui est l'imposteur ? »), terminé : 8 min 24, en 1080p.
  - Script : `studio/episodes/ep01_vrai_chef/script.json` et `dialogues.json`.
  - Moteur actuel : Remotion 4 + three.js, dans `studio/anim/`. Les fichiers principaux sont `src/voxel/Emission.tsx`, `Perso3D.tsx` et `Plateau3D.tsx`.
  - Scripts dans `studio/scripts/` :
    - `voix.py` : voix Fish Audio, modèle `s2.1-pro-free`.
    - `meilleure_prise.py` : contrôle de la diction avec faster-whisper.
    - `build_emission.py` : timeline, musique, bruitages et sous-titres.
    - `render_part.sh` : rendu en morceaux.
    - `assembler.sh` : assemblage des morceaux et ajout du son.
- Fish Audio : sur cet ordinateur, il faut une vraie clé API. Dans le cloud, un proxy l'ajoutait tout seul. Ne la mets jamais dans un fichier du dépôt : utilise une variable d'environnement.

## Mon personnage : LE J
C'est le héros de la chaîne, celui qui présente et joue dans chaque vidéo, comme Squeezie. La référence visuelle est `studio/personnages/hote_reference.png` :
- cheveux noirs épais en mèches de blocs, coiffés en arrière ;
- peau mate, sourcils noirs épais, petit sourire en coin.

Sa tenue peut changer à chaque vidéo. Tu dois toujours me proposer 2 ou 3 tenues belles et flatteuses avant de choisir.

## Prochaine vidéo : épisode 2 « LOUP-GAROU »
- 8 joueurs dans un chalet isolé, plus un maître du jeu. Ça fait 9 voix :
  - LE J ;
  - LE MENEUR (grave, mystérieux) ;
  - NADIA (stratège calme) ;
  - KÉKÉ (bavard qui accuse tout le monde) ;
  - LOUNA (naïve qui panique) ;
  - MOMO (costaud gentil) ;
  - ÉLISE (élégante sarcastique, menteuse) ;
  - THÉO (geek parano) ;
  - PAPI GÉRARD (doyen ronchon).
- Je vais t'envoyer un lien Fish Audio par personnage. Enregistre-les dans `studio/personnages/VOIX.md` pour les réutiliser dans les prochains épisodes. S'il faut plus de personnages un jour, dis-moi combien de voix ajouter.
- Ne me dis pas qui sont les loups : je veux la surprise.
- Tenues proposées pour LE J (j'en choisirai une) :
  1. chalet chic ;
  2. maître du jeu mystérieux en costume noir ;
  3. streetwear de luxe.

## Nouvelle direction technique : rendu Blender sur ma carte graphique
- Je veux une qualité proche des images IA que j'ai montrées : lumière douce, halos, flou de profondeur, matières détaillées (maille du pull, reflets de la montre).
- Vérifie ma carte graphique avec `nvidia-smi` et installe ou vérifie Blender 4.2+ et ffmpeg.
- Construis les personnages et le chalet en Python (bpy), en blocs arrondis mais finement modélisés et texturés. Utilise EEVEE pour la vidéo et Cycles pour les miniatures.
- Garde l'habillage existant (sous-titres mot par mot, bandeaux, titres) par-dessus le rendu Blender.
- Commence par une **image test** de LE J dans le chalet, avec 2 ou 3 joueurs, pour que je valide le style avant l'épisode complet.

## Exigences qualité
- Belles voix bien adaptées aux personnages, jamais de voix « dégueulasses ». Vérifie la diction de chaque réplique et régénère celles qui sont mauvaises.
- Vidéo d'au moins 8 minutes, avec musique, bruitages et sous-titres.
- Après chaque vidéo finie : supprime les morceaux de rendu et les fichiers intermédiaires, garde uniquement la vidéo finale, et remplace l'ancienne par la nouvelle.
- Pour chaque vidéo : un titre, une description YouTube accrocheuse (putaclic) avec chapitres, et un prompt de miniature.

Commence par lire les fichiers indiqués, vérifie ma carte graphique, puis dis-moi ce qu'il te faut (liens de voix, choix de tenue).
