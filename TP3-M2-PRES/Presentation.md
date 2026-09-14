# LogiChain — plan et texte pour l’oral

Ouvrir **Presentation-Frontend-Offline.html**. **← / →** : naviguer · **N** : texte oral · **P** : plan · **F** : plein écran. Le diaporama fonctionne sans Internet. Les notes ouvertes sont visibles sur l’écran projeté.

## Le plan de la présentation


**Le projet**

1. LogiChain
2. Le besoin sur le terrain
3. Les objectifs
4. Les fonctions présentées

**Les choix techniques**

5. Les outils utilisés
6. Les priorités
7. L’organisation du code

**Le fonctionnement hors ligne**

8. Les données sur le téléphone
9. Les fonctions hors ligne
10. Les actions en attente
11. L’enregistrement d’une action
12. La mise à jour de l’écran
13. Le retour du réseau
14. Les erreurs d’envoi
15. Les conflits

**Les fonctions de l’application**

16. Le scan
17. Les comptes et les rôles
18. La carte et les signalements
19. Le tableau de bord

**Bilan**

20. Les tests
21. Les limites
22. Ce qu’il faut retenir
23. Merci

## Le texte pour l’oral

### 1. LogiChain

LogiChain est une application mobile pour suivre le matériel, les tâches et les livraisons. Son mode hors ligne permet de garder les actions sur le téléphone et de les envoyer plus tard.

**Transition :** Le point de départ est une difficulté fréquente sur le terrain.

### 2. Le besoin sur le terrain

Sur le terrain, la connexion peut se couper. L’application garde donc les informations et les actions sur le téléphone pour permettre au travail de continuer.

**Transition :** Ce besoin se traduit par quatre objectifs.

### 3. Les objectifs

L’application a quatre objectifs : rendre les données accessibles, enregistrer les actions, les envoyer plus tard et afficher les problèmes éventuels.

**Transition :** Voici les fonctions concernées par ces objectifs.

### 4. Les fonctions présentées

L’application propose des écrans pour le matériel, les tâches et les livraisons. Cette présentation explique surtout comment ces fonctions restent utiles sans réseau.

**Transition :** Ces fonctions reposent sur plusieurs outils.

### 5. Les outils utilisés

React Native sert à construire les écrans mobiles. SQLite garde les données sur le téléphone. NetInfo détecte le réseau et AppState indique si l’application est active.

**Transition :** Ces outils doivent répondre à des besoins simples pour l’utilisateur.

### 6. Les priorités

L’application doit rester réactive et garder les actions. Une connexion lente ne doit pas bloquer le scan suivant, et les actions en attente doivent rester visibles.

**Transition :** Voici comment le code est organisé pour y répondre.

### 7. L’organisation du code

Les écrans permettent d’utiliser l’application. Le Workspace gère les données et les actions. SQLite les garde sur le téléphone.

**Transition :** La première partie du fonctionnement hors ligne est le stockage des données.

### 8. Les données sur le téléphone

SQLite garde les informations téléchargées et les actions à envoyer dans deux tables séparées. À la réouverture, l’application retrouve les deux.

**Transition :** Ces données permettent de garder plusieurs fonctions disponibles sans réseau.

### 9. Les fonctions hors ligne

Sans réseau, l’application permet de consulter les données déjà chargées et d’enregistrer des actions. Un signalement demande aussi une position GPS valide.

**Transition :** En plus des données, le téléphone garde les actions qui restent à envoyer.

### 10. Les actions en attente

Cette liste est parfois appelée une file d’attente. Elle garde les actions séparément des données téléchargées. Une action enregistrée sur le téléphone attend encore sa confirmation par le serveur.

**Transition :** Voici comment une action entre dans cette liste.

### 11. L’enregistrement d’une action

Quand une tâche est terminée, l’application vérifie les informations puis enregistre la modification. Elle peut ensuite l’afficher. Si l’enregistrement échoue, elle affiche une erreur.

**Transition :** Une fois l’action enregistrée, l’écran peut être mis à jour.

### 12. La mise à jour de l’écran

Une tâche terminée hors ligne apparaît tout de suite comme terminée. Cet affichage est dit optimiste : la modification est montrée avant sa confirmation. Si elle est refusée, l’affichage est corrigé.

**Transition :** La modification est visible sur le téléphone, mais elle doit encore être envoyée.

### 13. Le retour du réseau

Quand le réseau revient et que l’application est active, les actions sont envoyées. C’est la synchronisation. Le bouton Synchroniser maintenant permet aussi de lancer cet envoi.

**Transition :** L’envoi ne réussit pas toujours au premier essai.

### 14. Les erreurs d’envoi

Une action confirmée quitte la liste d’attente. Si le réseau coupe, elle reste sur le téléphone. Un refus ou un conflit est affiché pour que l’utilisateur puisse agir.

**Transition :** Parmi ces problèmes, un conflit demande un choix de l’utilisateur.

### 15. Les conflits

Un conflit peut arriver quand deux personnes modifient le même équipement. L’application propose de garder la version du serveur ou de réappliquer la modification locale. Le nouvel envoi doit encore être accepté.

**Transition :** Ce fonctionnement se retrouve dans une fonction importante sur le terrain : le scan.

### 16. Le scan

La caméra lit le code et l’application cherche l’équipement dans ses données. Le scan est ensuite enregistré sans réseau. Si le code est inconnu ou ambigu, un message l’indique.

**Transition :** Les actions proposées dépendent aussi du compte connecté.

### 17. Les comptes et les rôles

La première connexion demande du réseau. L’application peut ensuite retrouver la session et les données du compte. Certains boutons sont proposés selon le rôle de l’utilisateur.

**Transition :** La carte et les signalements complètent les outils disponibles.

### 18. La carte et les signalements

La carte est construite à partir des zones présentes sur le téléphone. Pour un signalement, l’utilisateur décrit le problème et capture une position GPS valide. L’application garde le signalement avant de l’envoyer.

**Transition :** Le tableau de bord permet ensuite de suivre la situation.

### 19. Le tableau de bord

Le tableau de bord utilise les données déjà disponibles sur le téléphone. Il reste donc consultable sans réseau. Les changements des autres utilisateurs deviennent visibles après une mise à jour.

**Transition :** Les tests vérifient ensuite les situations importantes pour l’application.

### 20. Les tests

Les tests vérifient la conservation des actions, les erreurs réseau et les conflits. Ils vérifient aussi qu’un envoi lent ne bloque pas un second scan. Le réseau et le stockage sont simulés dans ces tests.

**Transition :** Cette validation permet également de préciser les limites.

### 21. Les limites

La première connexion et certaines actions demandent encore du réseau. Les données des autres utilisateurs peuvent être moins récentes hors ligne. L’application doit être active pour reprendre l’envoi automatique.

**Transition :** Voici les points essentiels à retenir.

### 22. Ce qu’il faut retenir

LogiChain garde les données accessibles et conserve les actions sans réseau. Elle les envoie ensuite et indique les problèmes éventuels.

**Transition :** La présentation se termine sur ces trois points.

### 23. Merci

Merci pour votre attention. Place aux questions sur l’application et son fonctionnement hors ligne.

## Repères dans le code

Ces références servent à retrouver les détails techniques si une question est posée. Les fichiers sont dans TP3-M2-Front/.

- **Ce que fait l’application** : Sources : src/screens/ · src/hooks/useDashboard.ts
- **Les outils utilisés et pourquoi** : Sources : package.json · src/context/MobileContext.tsx · src/services/client.ts
- **Les priorités de l’application** : Sources : src/services/workspace.ts · src/context/MobileContext.tsx · src/hooks/useLocation.ts
- **Comment l’application est organisée** : Sources : src/context/MobileContext.tsx · src/services/workspace.ts
- **L’application enregistre d’abord sur le téléphone** : Source : src/services/workspace.ts → enqueue / sync
- **Ce que l’application permet sans réseau** : Sources : src/services/workspace.ts · src/components/ZoneMap.tsx · src/screens/AnomalyScreen.tsx
- **Ce que l’application garde sur le téléphone** : Source : src/storage/mobile.ts · base logichain-mobile-v2.db
- **Comment l’application enregistre une action** : Sources : src/services/workspace.ts → enqueue · src/services/operations.ts → validateAction
- **Ce que l’utilisateur voit tout de suite** : Source : src/services/operations.ts → optimistic
- **Comment fonctionne le scan** : Source : src/hooks/useScanner.ts
- **Ce qui se passe quand le réseau revient** : Sources : src/context/MobileContext.tsx · src/screens/SyncScreen.tsx
- **Si l’envoi ne se passe pas comme prévu** : Source : src/services/workspace.ts → sendPending
- **Si deux personnes modifient la même chose** : Sources : src/screens/SyncScreen.tsx · src/services/workspace.ts → resolve
- **Ce que l’application propose aussi** : Sources : src/components/ZoneMap.tsx · src/hooks/useLocation.ts · src/hooks/useDashboard.ts
- **Comment l’application gère les comptes** : Sources : src/services/client.ts · src/storage/mobile.ts · src/screens/ItemsScreen.tsx
- **Ce que les tests vérifient** : Sources : __tests__/workspace.test.ts · __tests__/geo.test.ts
