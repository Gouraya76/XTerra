# JILANI VAULT — Android source v2.0

Coffre-fort numérique personnel, Android, hors ligne et mono-utilisateur.

## Fonctionnalités prévues dans cette version
- Catégories : mots de passe, clés API, banque/cartes, documents, photos, notes privées et autres.
- Fiches personnalisables : titre, catégorie, mots-clés, notes et champs libres (avec option champ secret).
- Recherche universelle sur titres, catégories, mots-clés, notes, noms et valeurs des champs.
- Pièces jointes (photos et fichiers) intégrées au contenu chiffré du coffre.
- Chiffrement AES-256-GCM avec clé dérivée du mot de passe maître par PBKDF2-SHA256 (600 000 itérations).
- Déverrouillage biométrique Android via Android Keystore / Expo SecureStore (si configuré sur l'appareil).
- Export et restauration d'une sauvegarde chiffrée, pièces jointes comprises.
- Aucune synchronisation ni aucun serveur : le transfert vers un autre appareil se fait manuellement par sauvegarde.

## Démarrage / build APK
Prérequis : Node.js LTS, compte Expo et EAS CLI.

```bash
npm install
npx eas-cli login
npx eas-cli build --platform android --profile production
```

Télécharger ensuite l'APK depuis le lien fourni par EAS Build.

## Important avant utilisation réelle
Cette archive contient le **code source**, pas un APK compilé ni une application auditée. Il faut effectuer un build et des tests sur un vrai appareil Android avant d'y stocker des données sensibles. Tester notamment : création/déverrouillage, biométrie, ajout de fichiers volumineux, recherche, export et restauration. Les pièces jointes sont stockées dans le blob chiffré SQLite : la limite de sélection est fixée à 20 Mo par pièce jointe dans cette version et les fichiers volumineux peuvent augmenter fortement la taille du coffre et de la sauvegarde.

Le chiffrement protège les données au repos dans l'application, mais ne remplace pas les bonnes pratiques : mot de passe maître unique et robuste, téléphone verrouillé, système à jour, sauvegarde chiffrée conservée séparément. Le presse-papiers peut exposer temporairement une valeur copiée.

Pour les cartes bancaires, éviter d'enregistrer le code PIN ou le cryptogramme CVV. Préférer les informations strictement nécessaires et masquer les numéros non indispensables. Ne pas utiliser ce prototype comme coffre certifié ou audité pour des données réglementées.

## Limites connues
- Pas de synchronisation cloud ni récupération du mot de passe maître. Si le téléphone est perdu et qu'aucune sauvegarde n'existe, les données sont perdues.
- Le fichier de sauvegarde est protégé par le même mot de passe maître.
- Cette version v2 n'est pas compatible avec les sauvegardes v1 de JILANI API VAULT. Exporter et conserver séparément les anciennes données avant migration.
- La biométrie dépend du matériel et des réglages Android.
