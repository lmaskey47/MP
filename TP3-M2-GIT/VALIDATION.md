# Validation de la partie DevOps

Contrôles réalisés le 14 septembre 2026 sur le projet local. Les contrôles Linux
et les essais de conteneurs utilisent Docker Desktop ; aucun serveur distant
ni dépôt GitHub n'a été configuré pendant cette validation.

| Contrôle | Résultat |
| --- | --- |
| API : ESLint et TypeScript | Réussite |
| Configuration API de production | 4 tests unitaires réussis |
| API : droits, synchronisation, conflits, authentification et SSE | 19 contrôles d'intégration réussis sur MongoDB 8.0.14 |
| Runtime : disponibilité MongoDB, index, collection time-series, second démarrage | Réussite |
| Mobile : ESLint et TypeScript | Réussite |
| Mobile : Jest | 18 tests réussis, 2 suites |
| Construction de l'image API de production | Réussite avec les lockfiles et Node 24.20.0 |
| MongoDB avec authentification + API de production non-root | Réussite dans des conteneurs isolés |
| Sauvegarde/restauration MongoDB | Document témoin et index unique restaurés |
| Ansible : syntaxe du provisionnement et du rollback | Réussite |
| Ansible : lint, profil `production` | Aucun échec, aucun avertissement de règle |
| Audit npm API après corrections compatibles | Aucune vulnérabilité signalée lors du contrôle |

## Reproduire

Les commandes applicatives figurent dans `CONTRIBUTING.md`. MongoDB doit être
disponible localement sur 27017 pour les tests API. Les bases de test portent
un nom aléatoire distinct et sont supprimées à la fin.

Depuis la racine du projet, avec Docker en mode conteneurs Linux :

```powershell
docker build -t logichain-api:local TP3-M2-APi
python TP3-M2-GIT/tests/smoke.py logichain-api:local
docker build -t logichain-ansible:local TP3-M2-GIT/ansible
$ansibleDirectory = (Resolve-Path TP3-M2-GIT/ansible).Path
docker run --rm --mount "type=bind,source=$ansibleDirectory,target=/work/TP3-M2-GIT/ansible" -e ANSIBLE_CONFIG=/work/TP3-M2-GIT/ansible/ansible.cfg logichain-ansible:local ansible-lint --offline
docker run --rm --mount "type=bind,source=$ansibleDirectory,target=/work/TP3-M2-GIT/ansible" -e ANSIBLE_CONFIG=/work/TP3-M2-GIT/ansible/ansible.cfg logichain-ansible:local ansible-playbook site.yml --syntax-check
docker run --rm --mount "type=bind,source=$ansibleDirectory,target=/work/TP3-M2-GIT/ansible" -e ANSIBLE_CONFIG=/work/TP3-M2-GIT/ansible/ansible.cfg logichain-ansible:local ansible-playbook rollback.yml --syntax-check
```

`smoke.py` génère des mots de passe temporaires, ne publie aucun port de ses
conteneurs et supprime ses conteneurs et volumes de test à la fin. Il vérifie
la lecture refusée sans authentification, le démarrage avec un compte `readWrite`,
l'UID 1000 de l'API, puis un dump/restauration avec vérification des index.
La CI exécute aussi ce test après la construction de l'image.

## Recette à réaliser sur la cible réelle

Une première recette a été exécutée le 14 septembre 2026 sur un VPS Ubuntu 26.04
LTS. L'API répond en HTTPS, MongoDB exige une authentification, Nginx, UFW,
Fail2Ban et les conteneurs sont actifs. La connexion SSH directe à root est
refusée et le compte `deploy` fonctionne par clé. Une sauvegarde réelle a produit
une archive privée et l'API a redémarré. Le renouvellement Certbot simulé a réussi.

Les points ci-dessous servent à rejouer la recette ou à recueillir de nouvelles
preuves après un changement d'infrastructure.

1. Appliquer les protections `main` et `develop`, tenter un push direct refusé,
   puis vérifier qu'une PR exige une revue et ses quatre contrôles CI.
2. Sur une Ubuntu 24.04 vierge, exécuter `ansible-playbook site.yml` puis une
   seconde fois avec les mêmes variables. Conserver les deux récapitulatifs ;
   le deuxième doit afficher `changed=0` en l'absence de nouveaux paquets.
3. Vérifier la connexion SSH par clé `deploy`, le refus du mot de passe/root,
   UFW et Fail2Ban. Contrôler depuis une autre machine que 3000 et 27017 ne sont
   pas exposés, et que HTTPS possède un certificat reconnu.
4. Fusionner une PR de recette dans `main` ; observer le passage CI, la publication
   GHCR et l'approbation éventuelle de l'environnement avant la CD.
5. Contrôler `/ready`, une connexion mobile et un flux SSE. Couper puis rétablir
   le réseau mobile et vérifier la synchronisation.
6. Exécuter le rollback vers le digest précédent et refaire la recette.
7. Déclencher le service de sauvegarde, vérifier le redémarrage API, externaliser
   l'archive puis restaurer sur une machine de recette. Mesurer RPO et RTO.
8. Redémarrer le serveur et contrôler Docker, Nginx, Fail2Ban et le timer.

Le test local valide les outils de dump/restauration ; le timer systemd, le
pare-feu, le durcissement SSH et le provisionnement complet nécessitent cette
recette sur une vraie VM. L'idempotence complète n'est pas déclarée testée
sur la seule base du lint.
