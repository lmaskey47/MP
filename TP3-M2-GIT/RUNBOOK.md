# Exploitation et reprise d'activité

## Déployer et contrôler

Depuis `TP3-M2-GIT/ansible`, avec l'environnement décrit dans le README chargé :

```bash
ansible-playbook site.yml
curl --fail https://api.exemple.fr/ready
```

Le digest déployé figure dans le résumé du workflow GitHub. Consigner ce digest,
la date et le résultat de recette dans le journal d'exploitation de l'équipe.
Le déploiement remplace un seul conteneur API : une courte interruption est
possible. Les mobiles conservent leurs opérations hors ligne puis se reconnectent.

Sur le serveur :

```bash
sudo docker ps
sudo docker logs --tail 100 logichain-api
sudo docker logs --tail 100 logichain-mongodb
sudo systemctl status nginx fail2ban logichain-backup.timer
sudo nginx -t
sudo ufw status verbose
sudo fail2ban-client status sshd
sudo journalctl -u logichain-backup.service --since yesterday
df -h
```

Ne pas partager un `docker inspect` complet : il peut afficher les variables
privées. Une erreur 502 indique souvent une API indisponible ; vérifier ses logs,
puis MongoDB et les secrets. Une erreur de connexion SSH se diagnostique depuis
la console hébergeur (UFW, CIDR, clé autorisée, configuration SSH, Fail2Ban).
Un redémarrage Docker relance automatiquement les conteneurs ; un conteneur
`unhealthy` encore actif nécessite une investigation, Docker ne le redémarre
pas automatiquement sur le seul critère de santé.

## Rollback applicatif

Reprendre le digest de la dernière version validée, conservé dans les résumés CD.
Ne pas supprimer ses images GHCR pendant la période de retour arrière.

```bash
export API_IMAGE='ghcr.io/proprietaire/depot/api@sha256:DIGEST_PRECEDENT'
ansible-playbook rollback.yml
curl --fail https://api.exemple.fr/ready
```

Remplacer `DIGEST_PRECEDENT` par les 64 caractères réels. Ce playbook modifie
seulement le runtime applicatif et vérifie la santé de l'API ; il ne restaure ni
ne supprime la base. Garder les mêmes secrets que pour la version précédente.
Si le déploiement échoue, la CD reste rouge et l'exploitant lance ce rollback ;
aucun succès ni retour arrière automatique n'est supposé.

Avant une migration incompatible, sauvegarder et documenter sa procédure inverse.
Un rollback d'image ne suffit pas à annuler une migration de données destructive.

## Sauvegardes MongoDB

Une sauvegarde gzip au format archive MongoDB est programmée à 02:00 UTC chaque
jour (04:00 en été et 03:00 en hiver à Paris). Conservation locale : 14 jours.
La rétention ne s'exécute qu'après un dump réussi. Les fichiers incomplets
`.partial` sont retirés. Un verrou empêche deux sauvegardes simultanées.

MongoDB est une instance standalone : le script arrête brièvement l'API pendant
le dump afin d'éviter ses écritures concurrentes, puis la redémarre même en cas
d'échec du dump. Prévoir cette interruption et interdire les autres écritures
administratives pendant la sauvegarde. Les données mobiles non synchronisées
restent sur les appareils ; elles ne figurent pas dans la sauvegarde serveur.

Déclenchement manuel et contrôle :

```bash
sudo systemctl start logichain-backup.service
sudo journalctl -u logichain-backup.service -n 30 --no-pager
sudo ls -lh /var/backups/logichain/
sudo docker ps --filter name=logichain-api
```

Les archives et `/etc/logichain/mongotools.yml` sont privés (root). Le mot de
passe n'est pas passé en argument du processus de dump. Copier chaque sauvegarde
réussie vers un stockage externe chiffré et à accès restreint, avec une rétention
indépendante ; le stockage externe n'est pas configuré sans destination fournie.
Une sauvegarde conservée uniquement sur la VM ne protège pas contre sa perte.

Objectif RPO : au plus 24 h pour les données déjà synchronisées **si la sauvegarde
quotidienne réussit et est externalisée**. Le RTO dépend du volume et du serveur :
le mesurer lors d'une restauration de recette, sans annoncer un délai non testé.
Vérifier chaque jour les échecs de timer et l'espace disque ; configurer les
alertes dans la supervision de l'équipe. Tester une restauration mensuellement.

## Tester une restauration isolée

Sur un serveur de recette, copier une archive en `/var/backups/logichain/test.archive.gz`.
Ne pas utiliser un volume de production pour ce test.

```bash
sudo docker run -d --name logichain-restore-test --network none mongo:8.0.14
sudo docker cp /var/backups/logichain/test.archive.gz logichain-restore-test:/tmp/test.archive.gz
sudo docker exec logichain-restore-test mongosh --quiet --eval 'db.adminCommand({ping:1})'
sudo docker exec logichain-restore-test mongorestore --archive=/tmp/test.archive.gz --gzip
sudo docker exec logichain-restore-test mongosh logichain --quiet --eval 'db.getCollectionNames(); db.users.countDocuments(); db.items.getIndexes()'
sudo docker rm -fv logichain-restore-test
```

Attendre que le ping MongoDB réussisse avant la restauration. Comparer les
collections, volumes de données et index au compte rendu du dump ; idéalement
démarrer une API de recette et vérifier connexion, inventaire, tâches et
synchronisation mobile. Le nettoyage final supprime uniquement le conteneur
de test nommé et ses volumes anonymes.

## Restaurer après incident

1. Suspendre les déploiements GitHub, prévenir l'équipe et choisir une archive
   vérifiée. Conserver une copie de l'état actuel avant toute restauration.
2. Si la VM est perdue, créer une nouvelle Ubuntu 24.04, rétablir DNS et accès SSH,
   recharger les secrets du coffre et exécuter `ansible-playbook site.yml`.
3. Copier l'archive choisie sur le serveur, puis arrêter API et timer :

```bash
sudo systemctl stop logichain-backup.timer
sudo docker stop logichain-api
```

4. Restaurer en remplaçant explicitement les collections présentes dans l'archive :

```bash
sudo docker run --rm --network host \
  --mount type=bind,src=/etc/logichain/mongotools.yml,dst=/run/mongotools.yml,readonly \
  --mount type=bind,src=/var/backups/logichain/ARCHIVE.archive.gz,dst=/run/backup.archive.gz,readonly \
  mongo:8.0.14 mongorestore --config=/run/mongotools.yml \
  --archive=/run/backup.archive.gz --gzip --nsInclude='logichain.*' --drop
```

`--drop` efface les collections concernées avant leur restauration ; cette
commande est réservée à l'incident validé. Les collections absentes de l'archive
ne sont pas supprimées par `--drop` : pour un retour strict à un état antérieur,
restaurer sur une base vierge, ou examiner les collections résiduelles avant
réouverture. Le dump applicatif ne contient pas les comptes MongoDB : Ansible
les recrée avec les secrets conservés dans le coffre.

5. Redémarrer, vérifier et réactiver le timer :

```bash
sudo docker start logichain-api
curl --fail https://api.exemple.fr/ready
sudo systemctl start logichain-backup.timer
```

Vérifier une connexion, un inventaire et une synchronisation mobile. Des conflits
peuvent apparaître pour les opérations enregistrées après la date de l'archive ;
les examiner avant reprise normale. Consigner la perte de données éventuelle,
la durée réelle de reprise et le digest applicatif utilisé.

## Rotation des secrets et certificats

Les mots de passe MongoDB sont créés une seule fois (`update_password: on_create`)
pour garantir l'idempotence. Modifier uniquement une variable ne change pas le
mot de passe d'un utilisateur existant. Pour une rotation : mettre l'API en
maintenance, modifier le mot de passe MongoDB via une session administrateur
interactive, mettre à jour le coffre/GitHub puis rejouer le playbook. Ne jamais
supprimer le volume pour faire prendre effet à un nouveau mot de passe.

Un nouveau `JWT_SECRET` invalide les jetons d'accès précédents ; prévenir les
utilisateurs et vérifier la reconnexion. Renouveler le certificat auprès de son
autorité avant expiration, remplacer les secrets/fichiers TLS puis rejouer
`site.yml`. Nginx valide la paire certificat/clé avant son rechargement.
Le renouvellement automatique ACME n'est pas configuré sans fournisseur DNS
ni domaine réel. Vérifier la date d'expiration dans la supervision.

Après une mise à jour système nécessitant un redémarrage, planifier la coupure,
redémarrer la VM et refaire les contrôles HTTPS, Docker, timer et synchronisation.
