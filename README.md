# LogiChain — démarrage Windows

Le code mobile et l’API sont dans `TP3-M2-Front` et `TP3-M2-APi`.
Node 24.20.0 est installé localement dans `.tools` : les commandes ci-dessous
l’utilisent sans modifier le Node 25 global de Windows.

## Documentation

- [Infrastructure DevOps et CI/CD](TP3-M2-GIT/README.md) : consignes de la partie 3, Ansible et configuration GitHub.
- [Contribuer au projet](CONTRIBUTING.md) : Gitflow, revue obligatoire et Conventional Commits.
- [Guide d'exploitation](TP3-M2-GIT/RUNBOOK.md) : déploiement, rollback, sauvegarde et restauration.

- [Schéma de la base SQLite du téléphone](docs/schema-bdd.md) : diagramme des tables, champs et fonctionnement hors ligne.

## Avant Android Studio

Pour une nouvelle installation, exécuter `npm ci` dans `TP3-M2-APi` et dans
`TP3-M2-Front`. Copier `TP3-M2-APi/.env.example` vers `TP3-M2-APi/.env`, puis
remplir `JWT_SECRET` avec une valeur générée par la commande indiquée dans
l'exemple. Les autres valeurs de l'exemple correspondent au développement
local. Ne pas remplacer un `.env` déjà configuré. La configuration de production
et l'authentification MongoDB sont décrites dans le guide DevOps.

Depuis ce dossier :

```powershell
.\Start-LogiChain.ps1 -Mode Check
.\Start-LogiChain.ps1 -Mode Database
.\Start-LogiChain.ps1 -Mode Test
```

Docker Desktop doit être démarré pour MongoDB. Le script réutilise le conteneur
`logichain-mongodb` existant, sans remplacer son volume.
Les tests API utilisent une base temporaire distincte puis la suppriment.

## Après installation d’Android Studio

Dans SDK Manager, installer les versions demandées par le projet :

- Android SDK Platform 37 ;
- Android SDK Build-Tools 37.0.0 ;
- Android SDK Platform-Tools, Command-line Tools et Android Emulator ;
- NDK (Side by side) 27.1.12297006.

Créer et démarrer un appareil virtuel Android dans Device Manager.
Pour compiler l’APK sans appareil connecté :

```powershell
.\Start-LogiChain.ps1 -Mode Build
```

L’APK de développement sera dans
`TP3-M2-Front/android/app/build/outputs/apk/debug/app-debug.apk`.
Ce build debug utilise Metro pour charger le JavaScript.

Le script détecte le SDK dans `%LOCALAPPDATA%\Android\Sdk` et Java dans
`C:\Program Files\Android\Android Studio\jbr`. Pour des emplacements différents,
renseigner `ANDROID_HOME` et `JAVA_HOME`.

Dans trois terminaux distincts, depuis ce dossier :

```powershell
# Terminal 1
.\Start-LogiChain.ps1 -Mode Database
.\Start-LogiChain.ps1 -Mode Api

# Terminal 2
.\Start-LogiChain.ps1 -Mode Metro

# Terminal 3, avec l’émulateur démarré
.\Start-LogiChain.ps1 -Mode Android
```

Si PowerShell bloque les scripts, la même commande peut être appelée avec
`powershell -ExecutionPolicy Bypass -File .\Start-LogiChain.ps1 -Mode Check`
(remplacer Check par le mode voulu).

L’émulateur utilise `http://10.0.2.2:3000/api/v1`. Sur un vrai téléphone,
adapter `TP3-M2-Front/src/config.ts` à l’adresse LAN du PC et utiliser le même réseau.
Le HTTP local est destiné au build de développement ; une distribution nécessite
une API HTTPS et sa configuration d’URL.

## Données de démonstration

Si les données de démonstration n’existent pas :

```powershell
.\Start-LogiChain.ps1 -Mode Seed
```

Cette commande remet à jour les enregistrements de démonstration portant les
identifiants fixes du seed ; ne pas la relancer pour conserver leurs modifications.
Comptes : `seed.agent@logichain.fr`, `seed.manager@logichain.fr`,
`seed.provider@logichain.fr`, `seed.admin@logichain.fr`.
Mot de passe de démonstration : `Password123`.
Code équipement : `SEED-EQ-001`.

La première connexion doit être en ligne pour télécharger le secteur.
Ensuite, tâches, scans, mouvements, livraisons et anomalies sont conservés dans
SQLite par compte. Les opérations sont envoyées automatiquement lorsque le
réseau revient et que l’application est active. Une action refusée restaure
l’affichage serveur ; le centre de synchronisation permet de réessayer ou
d’abandonner la modification locale. Les actions survivent à la fermeture de l’app.
L’envoi et les SSE reprennent à sa réouverture ; aucun service permanent ne tourne
lorsque l’application est fermée.

## Vérification et limites matérielles

Le typage, le lint, les 37 tests et le bundle JavaScript Android passent.
La compilation native Gradle a également réussi : l’APK debug est disponible
dans le chemin indiqué ci-dessus. Le rendu sur écran, les permissions,
SQLite/Keystore en fonctionnement, le son, la caméra et le GPS restent à vérifier
sur émulateur ou téléphone.

La carte affiche les polygones GeoJSON et les étapes des livraisons même sans réseau.
Les lignes entre étapes sont un plan de tournée, pas un calcul routier.

Voir `VALIDATION.md` pour les scénarios de recette et les fonctions couvertes.
