# EYELIOS — Coffre-fort numérique personnel (Android)

Application Expo / React Native (SDK 54, nouvelle architecture), 100 % locale, chiffrée, conçue pour le Samsung Galaxy S25 Ultra.
Elle succède à JILANI VAULT v2, dont elle reprend la base technique.

## Architecture

```
app/                     écrans (expo-router)
  (tabs)/                Accueil · Coffres · Ajouter (+) · Assistant IA · Paramètres
  category/[type]        listes par catégorie + galerie privée Photos & Documents
  item/[id]  edit        fiche détaillée / formulaire de création et de modification
  vault/[id]             contenu d'un coffre      search      recherche universelle
  backup  ai  security  journal  generator
src/core/                logique pure, sans dépendance native, testée sous Node
  crypto.ts              PBKDF2-SHA256 (600 000 it.) · AES-256-GCM · enveloppe de clé
  model.ts               types, catégories, validation (refus PIN/CVV), migration JILANI v2
  search.ts              recherche universelle (n'indexe jamais les secrets)
  assistant.ts           compréhension locale des demandes (hors ligne)
  backup.ts              format .eyelios, contrôle d'intégrité SHA-256, fusion
  password.ts            générateur sans biais modulo, estimation d'entropie
src/storage/             SQLite, fichiers chiffrés, Android Keystore, fournisseur d'IA
src/state/vault.tsx      session : clé en mémoire, verrouillage auto, presse-papiers, sauvegardes
src/ui/                  design system Liquid Glass (palette officielle uniquement)
tests/core.test.ts       tests automatisés (npm test)
```

### Décisions de sécurité
- **Enveloppe de clé** : une clé de données aléatoire de 256 bits (DEK) chiffre le coffre et chaque fichier. La DEK est elle-même chiffrée par une clé dérivée du mot de passe maître (PBKDF2-SHA256, 600 000 itérations, sel de 128 bits). Changer de mot de passe ne ré-chiffre donc pas les données.
- **SQLite** ne contient que : sel, nombre d'itérations, DEK chiffrée, nonce et texte chiffré. Aucun secret n'y est en clair. L'écriture se fait en transaction, donc une fermeture brutale ne corrompt pas le coffre.
- **Fichiers** (photos, PDF…) : ils sont chiffrés en AES-256-GCM *avant* l'écriture dans le stockage privé de l'app. Ils sont écrits d'abord dans un fichier `.part`, puis renommés de façon atomique. La copie faite par le sélecteur de fichiers est supprimée aussitôt. Les images sont déchiffrées en mémoire uniquement. Ouvrir un PDF dans une autre app crée une copie temporaire en clair, effacée après 2 minutes, au verrouillage et au démarrage.
- **Biométrie** : l'empreinte protège la DEK dans l'Android Keystore (`requireAuthentication`). Ce n'est pas un moyen de récupérer le mot de passe, qui n'est jamais stocké. La clé est invalidée par Android si une nouvelle empreinte est ajoutée.
- **Verrouillage automatique** : immédiat, 30 s, 1, 5 ou 15 min en arrière-plan. Il est suspendu pendant les sélecteurs de fichiers, l'appareil photo et la biométrie.
- **Captures d'écran** : elles sont bloquées par défaut (FLAG_SECURE, ce qui masque aussi l'aperçu dans les applis récentes). C'est désactivable.
- **Presse-papiers** : il est effacé automatiquement après 30 s par défaut (réglable).
- **Journal** : il enregistre les actions avec le titre de l'élément concerné, jamais une valeur secrète. Le journal est lui-même chiffré.
- **Sauvegarde Android vers Google** : désactivée (`allowBackup: false`).
- **Cartes** : les libellés « PIN », « CVV », « cryptogramme » ou « code secret » sont refusés.
- **Permissions** : seuls la biométrie et l'appareil photo sont demandés. Le micro et l'accès large au stockage sont explicitement bloqués.

### Assistant IA
- **Hors ligne, en local** : retrouver, lister, créer (formulaire pré-rempli), classer et supprimer des éléments (avec confirmation à chaque fois), générer un mot de passe, verrouiller. Afficher ou copier un secret depuis l'assistant demande une nouvelle authentification (biométrie ou code de l'appareil).
- **En ligne, optionnel** : questions générales, rédaction, reformulation et résumé des textes que tu colles dans la conversation. Cela passe par l'API Claude d'Anthropic (modèle `claude-opus-5-5` par défaut). La clé API est saisie par l'utilisateur et stockée dans le Keystore : elle n'est jamais dans le code ni dans les sauvegardes. **Aucune donnée du coffre n'est envoyée** : seuls le texte que tu tapes dans la conversation et l'historique de la conversation le sont. Il faut une connexion internet et un compte Anthropic facturé à ton nom.

## Installation (APK)
1. Télécharge le fichier `.apk` depuis la page *Releases* du dépôt GitHub (lien fourni à chaque build).
2. Ouvre-le sur le téléphone. Si Android le demande, autorise « Installer des applis inconnues » pour ton navigateur.
3. Mises à jour : télécharge le nouvel APK et installe-le par-dessus. Tes données sont conservées, car tous les builds sont signés avec la même clé.

## Sauvegarde et restauration
- **Exporter** : *Paramètres → Sauvegarde & restauration*. Choisis un mot de passe de sauvegarde (10 caractères minimum), puis *Enregistrer dans un dossier…* (le système te laisse choisir l'emplacement) ou *Partager / envoyer…*. Chaque export produit un nouveau fichier daté `EYELIOS-sauvegarde-AAAA-MM-JJ-HH-MM.eyelios`, ce qui conserve les versions précédentes.
- **Contenu** : la sauvegarde contient tout le coffre et les fichiers, ré-chiffrés avec le mot de passe de sauvegarde, plus une empreinte SHA-256. Le contrôle d'intégrité se fait **avant** de demander le mot de passe.
- **Restaurer** : choisis le fichier, puis *Fusionner* (ajoute ce qui manque et garde la version la plus récente) ou *Remplacer*. Ton compte et ton mot de passe maître actuels sont conservés.
- **Nouveau téléphone ou mot de passe oublié** : installe l'app, crée un compte, puis restaure le fichier `.eyelios` avec son mot de passe de sauvegarde.
- **Anciennes sauvegardes** : les sauvegardes JILANI VAULT v2 sont acceptées et converties.

## Développement
```bash
npm ci
npm run typecheck     # TypeScript strict
npm test              # tests automatisés de la logique (Node)
npx expo export -p android   # vérifie que le bundle Android se compile
```
Le build APK passe par GitHub Actions (`.github/workflows/eyelios-apk.yml`) : `expo prebuild` puis `gradlew assembleRelease`, signé avec la clé définitive fournie par les secrets du dépôt. `eas.json` est aussi prêt pour `eas build -p android --profile production`.

Les fichiers `src/storage/*.web.ts` servent **uniquement** à l'aperçu navigateur utilisé pour contrôler le design (stockage simulé en mémoire). Ils ne sont pas inclus dans l'APK Android.
