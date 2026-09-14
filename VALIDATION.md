# Validation LogiChain

## Fonctions implémentées

| Exigence du sujet | Implémentation |
| --- | --- |
| Connexion et cache initial | Connexion JWT, renouvellement de session, tokens dans Keystore/Keychain, téléchargement du secteur |
| SQLite offline-first | Cache indexé par compte, événement et zone, requête de jointure événements/équipements, file persistante |
| Terrain | Tâches prioritaires, mouvements, statut livré, maintenance, anomalies GPS |
| Scanner | QR, EAN et Code 128/39, saisie manuelle, anti-doublon, vibration et module sonore Android |
| Synchronisation | Automatique au retour réseau/app active, reprise temporisée, bouton manuel, conflits, abandon ou réapplication |
| Intégrité | Écriture locale avant retour positif, validation GPS/GeoJSON, déduplication serveur, verrou atomique |
| Optimistic UI | Application immédiate des modifications en attente ; retour serveur si refus/conflit |
| Cartographie | Polygones GeoJSON natifs, étapes de tournée, position GPS ponctuelle, utilisable sans tuiles réseau |
| Pilotage | Stocks par statut, carbone consolidé, tâches bloquées/en retard, livraisons en retard |
| Configuration | Création/édition d’événements, dates, statut, zones carrées ou import de contours GeoJSON avec aperçu |
| Responsabilité et livraison | Transferts réservés aux responsables, validation de feuilles de route, avancement terrain |
| Alertes | SSE authentifié, notifications critiques issues des anomalies graves, affichage et marquage lu |
| Ressources | Caméra inactive hors écran, pas de suivi GPS continu, SSE et envois suspendus app inactive |
| Architecture | Écrans de présentation, hooks, service Workspace, client HTTP, couche SQLite ; API en couches |

## Vérifications automatisées

- 18 tests mobiles : persistance/reprise, erreurs réseau, conflits et rollback,
  sérialisation des envois, réconciliation des versions, réseau lent non bloquant,
  refresh obsolète, validation GeoJSON et GPS.
- 19 contrôles d’intégration HTTP avec une vraie base MongoDB temporaire :
  authentification, affectations, idempotence, écritures concurrentes, tâches,
  livraisons, anomalies, notifications, SSE, refresh, logout et création d’événement.
- Contrôle TypeScript des deux projets, lint mobile et construction du bundle Metro Android.
- Compilation native Android réussie le 7 septembre 2026 avec Gradle 9.4.1.
  APK : `TP3-M2-Front/android/app/build/outputs/apk/debug/app-debug.apk`.
  Les configurations SQLite et les chemins C++ trop longs sous Windows ont été corrigés.

## Recette à effectuer après installation Android

Ces vérifications nécessitent les modules natifs ; les tests JavaScript ne les remplacent pas.

1. Démarrer MongoDB, API, Metro et émulateur avec les commandes du README.
2. Se connecter avec un compte de démonstration et attendre le téléchargement du secteur.
3. Scanner `SEED-EQ-001` (ou le saisir), vérifier vibration, son, statut de file et envoi.
4. Couper le réseau : modifier une tâche, déplacer un équipement, enregistrer une anomalie GPS.
5. Fermer puis rouvrir l’app hors réseau : vérifier le cache et les actions en attente.
6. Rétablir le réseau : vérifier leur transmission et l’absence de doublon côté API.
7. Depuis un second client, modifier un équipement déjà chargé par le mobile,
   puis transmettre une modification offline : vérifier le conflit et les deux choix de résolution.
8. Avec un responsable, vérifier la carte, ajouter une zone, valider une feuille de route
   et transférer un équipement à une personne du même événement.
9. Créer une anomalie critique depuis un agent et vérifier l’alerte sur le client responsable.
10. Refuser les permissions caméra/GPS puis les rétablir ; vérifier les messages et la reprise.
11. Vérifier l’affichage sur un petit écran, le clavier, la navigation retour et les safe areas.

## Limites explicites

- L’APK debug est compilé, mais aucun émulateur/appareil n’était disponible pour un lancement.
- SQLite, stockage sécurisé, son, caméra et GPS natifs attendent la recette sur appareil.
- La carte est un plan géospatial hors ligne, sans fond routier ni guidage turn-by-turn.
- Synchronisation et SSE fonctionnent lorsque l’application est active et reprennent
  après réouverture. Il n’y a pas de push FCM ni de service Android permanent app fermée.
- Le retour sonore ajouté est Android ; iOS conserve la vibration et attend une recette macOS/Xcode.
- Le développement local utilise HTTP. Une distribution exige une API HTTPS configurée.
