# Contribuer à LogiChain

## Organisation et branches

Le monorepo conserve `TP3-M2-APi`, `TP3-M2-Front` et `TP3-M2-GIT` ensemble.
Une évolution du contrat de synchronisation peut ainsi modifier l'API, le mobile
et son déploiement dans la même Pull Request, avec une validation commune.
Les dépendances npm restent propres à chaque application.

- `main` : versions validées, déployables en production.
- `develop` : intégration des fonctionnalités avant recette.
- `feature/<ticket>-<description>` : créée depuis `develop`, fusionnée dans `develop`.
- `fix/<ticket>-<description>` : correction courante, même circuit.
- `hotfix/<ticket>-<description>` : correction urgente depuis `main`, PR vers `main`,
  puis report vers `develop` par une seconde PR.
- `release/<version>` : stabilisation facultative depuis `develop`, puis PR vers
  `main` et report des correctifs dans `develop`.

```bash
git switch develop
git pull --ff-only origin develop
git switch -c feature/42-suivi-livraison
# Modifier et vérifier le projet.
git add <fichiers-concernes>
git commit -m "feat(delivery): ajouter le suivi des livraisons"
git push -u origin feature/42-suivi-livraison
```

## Commits et revue obligatoire

Format : `type(scope): description`, avec un `!` avant `:` pour une rupture.
Types : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
`chore`, `revert`. Le scope est facultatif. Les titres des PR suivent le même
format et sont contrôlés par la CI. Le squash reprend ce titre ; vérifier le
message final avant fusion. Ne pas regrouper plusieurs changements sans rapport.

Une PR décrit le problème, le résultat, les tests et l'effet éventuel sur les
données, le mode hors ligne et le déploiement. Une approbation d'un autre
développeur est obligatoire. Toute nouvelle modification annule l'approbation.
Résoudre les discussions, remettre la branche à jour et attendre les contrôles
API, Mobile, Infrastructure et Conventional Commits. Aucun push direct ni push
forcé sur `main` ou `develop`, y compris par un administrateur.

Fusionner les fonctionnalités par squash. Pour une PR de promotion `develop`
vers `main`, utiliser un merge commit pour conserver l'ascendance commune.
Les commits intermédiaires doivent déjà suivre la convention. Supprimer les
branches de fonctionnalité après fusion ; conserver `main` et `develop`.

## Vérifications locales

Utiliser Node 24.20.0 et les lockfiles, sans les régénérer sans raison.

```bash
cd TP3-M2-APi
npm ci
npm run lint
npm run typecheck
npm test
cd ../TP3-M2-Front
npm ci
npm run lint -- --max-warnings=0
npm run typecheck
npm test -- --runInBand
```

Les tests API nécessitent MongoDB local sur le port 27017 ; ils créent et
suppriment une base `logichain_test_<identifiant>`. Ne pas les pointer vers une
base de production. Les tests unitaires de configuration ne nécessitent pas MongoDB.
Pour Ansible, consulter [le guide DevOps](TP3-M2-GIT/README.md).

## Secrets et compatibilité

Copier `.env.example` vers `.env` uniquement en local. Générer les secrets de
production avec un générateur cryptographique et les garder dans les secrets
d'environnement GitHub ou un coffre Ansible Vault. Ne jamais publier `.env`,
clés SSH/TLS, sauvegardes, jetons ou captures contenant des secrets.
Ne pas activer `--diff` sur des tâches manipulant des secrets.

Conserver les couches contrôleurs/services/repositories/modèles. Une modification
de schéma doit prévoir la coexistence des anciennes applications mobiles et le
rollback. Les modifications destructrices de données nécessitent une migration
distincte, relue et précédée d'une sauvegarde vérifiée.
