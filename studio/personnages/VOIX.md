# Banque de voix Fish Audio (réutilisable d'un épisode à l'autre)

Chaque personnage récurrent garde sa voix. Pour un nouveau personnage, on demande une voix en plus.
Format : NOM | identifiant Fish Audio (reference_id) | réglages (pitch, vitesse) | remarques

| Personnage | Rôle / type de voix | Identifiant Fish Audio | Réglages |
|---|---|---|---|
| LE J | héros de la chaîne, homme 20-30 ans, dynamique et charismatique | `b268730efffc42a89fa4eaccdde1af48` ([lien](https://fish.audio/m/b268730efffc42a89fa4eaccdde1af48)) | pitch 0, modèle s2.1-pro-free |
| LE MENEUR | maître du jeu, voix grave, posée et mystérieuse | `7e327849fe89489387cb3e016c714834` ([lien](https://fish.audio/m/7e327849fe89489387cb3e016c714834)) | pitch 0, modèle s2.1-pro-free |
| NADIA | stratège calme et calculatrice, femme 25-30 ans | `9ab918eff1784bdd938a92b629b1eaaa` ([lien](https://fish.audio/m/9ab918eff1784bdd938a92b629b1eaaa)) | pitch 0, modèle s2.1-pro-free |
| KÉKÉ | bavard qui accuse tout le monde, homme jeune, énergique et drôle | `d99596e8405d4651bcd3ebe45df58f97` ([lien](https://fish.audio/m/d99596e8405d4651bcd3ebe45df58f97)) | pitch 0, modèle s2.1-pro-free |
| LOUNA | naïve adorable qui panique vite, jeune femme, voix douce et aiguë | `eb6af859cca44114a92dee68f39cf4a9` ([lien](https://fish.audio/m/eb6af859cca44114a92dee68f39cf4a9)) | pitch 0, modèle s2.1-pro-free |
| MOMO | grand costaud gentil et un peu lent, homme, voix grave et chaleureuse | `fe118d40f7e042dd86143e2938f0cc2e` ([lien](https://fish.audio/m/fe118d40f7e042dd86143e2938f0cc2e)) | pitch 0, modèle s2.1-pro-free |
| ÉLISE | élégante, sarcastique, menteuse de génie, femme, voix assurée un peu rauque | `339d8b4a48bb4222acc5f58a9826ae96` ([lien](https://fish.audio/m/339d8b4a48bb4222acc5f58a9826ae96)) | pitch 0, modèle s2.1-pro-free |
| THÉO | geek parano plein de théories, jeune homme, débit rapide | `0a672e4cbc5d43e7b87464d5c48a9456` ([lien](https://fish.audio/m/0a672e4cbc5d43e7b87464d5c48a9456)) | pitch 0, modèle s2.1-pro-free |
| PAPI GÉRARD | doyen ronchon et rusé, vieil homme | `0295b1d678ad4086af8b0d74b5c205e2` ([lien](https://fish.audio/m/0295b1d678ad4086af8b0d74b5c205e2)) | pitch 0, modèle s2.1-pro-free |

## Contrôle des voix (23/11/2026)
- Les 9 voix passent le test de diction Whisper (score 0.93 à 0.99), avec `scripts/test_voix.py`.
- Les extraits test sont dans `personnages/voix_tests/` (hors dépôt).
- Astuce : Whisper entend « Logi » pour « Le J ». Dans les textes envoyés à Fish Audio, écrire « Le Dji » si la prononciation sonne mal.
