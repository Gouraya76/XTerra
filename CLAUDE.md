# XTerra — vidéos d'actualité TERA24

## Règles permanentes
- **Chaque vidéo livrée doit avoir une description (légende TikTok) qui mentionne TERA24** :
  fichier `description.txt` dans le dossier de la vidéo, à donner aussi à l'utilisateur dans la réponse.
  Format : accroche avec emojis drapeaux, résumé factuel (revendications non confirmées présentées comme telles),
  question pour les commentaires, ligne « 📲 Suis TERA24… », puis hashtags dont `#TERA24`.
- Vidéos « images seules » : uniquement des photos réelles liées au script, plein écran 1080×1920,
  zoom lent, coupes franches, pas de texte ni d'effets sonores (voir `broll/README.md`).
- Voix off : Fish Audio, voix « frances 1 » (reference_id 966a09df9c194c04818dbb9bf27e6ae0),
  en-tête `model: s2.1-pro-free` (gratuit ; l'ASR Fish Audio est payant → transcription locale faster-whisper).
- Recherche d'images : Yandex Images (Bing ne garde que le premier mot de la requête).
- Si l'utilisateur envoie une vidéo d'images réelles (amateur, reportage) : garder la vidéo source,
  voix off française par-dessus (`broll/render_footage.py`), créditer la source dans la description.
- Toujours vérifier les faits (recherche web) avant d'écrire le script ; accusations = attribuées et nuancées.
- Son : normalisé à -14 LUFS (déjà fait par les deux scripts de rendu).
