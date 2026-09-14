# LogiChain API + BDD

Pour cette version mobile complète, suivre aussi le [guide Windows](../README.md)
et la [matrice de validation](../VALIDATION.md). Les routes `/mobile/bootstrap`,
`/mobile/operations`, `/mobile/stream`, `/auth/refresh` et `/auth/logout` sont
documentées dans Swagger. `npm test` compile puis exécute les tests HTTP dans
une base MongoDB temporaire isolée.

L’inscription publique ne peut plus attribuer un rôle privilégié ni des événements.
Utiliser les comptes du seed pour la démonstration. Les droits et affectations
sont relus en base à chaque requête authentifiée.

Backend REST LogiChain realise pour la partie API + base de donnees du sujet.  
Technos respectees : Node.js, TypeScript, Express, MongoDB, Mongoose.

## Demarrage

```bash
cp .env.example .env
docker compose up -d
npm run dev
```

Documentation interactive Swagger :

- `http://127.0.0.1:3000/docs`
- spec JSON : `http://127.0.0.1:3000/openapi.json`

Dans Swagger, lancer d'abord `POST /auth/register` ou `POST /auth/login`, copier le `token`, puis cliquer sur `Authorize`.
Comme Swagger utilise deja le schema Bearer, coller uniquement la valeur du token, sans ajouter `Bearer` devant.

```text
<token>
```

Build de verification :

```bash
npm run build
```

## Architecture

- `src/models` : entites metier et schemas MongoDB avec validations, index, GeoJSON, historique imbrique et collection time series.
- `src/repositories` : seule couche autorisee a interagir avec Mongoose/MongoDB.
- `src/services` : logique metier, KPI, transitions d'equipements, synchronisation offline et verrouillage optimiste.
- `src/controllers` : adaptation HTTP.
- `src/routes` : routes REST `/api/v1`.

## Base de donnees MongoDB

Collections principales :

- `users`
- `events`
- `items`
- `tasks`
- `deliveries`
- `anomalies`
- `notifications`
- `monitoringmetrics` en time series

Index prevus :

- index composes sur evenement/statut/zone pour les items, tasks, deliveries et anomalies
- index geospatiaux `2dsphere` sur localisations et zones
- index partiel sur responsable d'equipement
- email utilisateur unique

## Routes

Toutes les routes sauf auth demandent un header `Authorization: Bearer <token>`.

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Evenements et zones

- `GET /api/v1/events`
- `POST /api/v1/events`
- `GET /api/v1/events/:eventId`
- `PUT /api/v1/events/:eventId`
- `PATCH /api/v1/events/:eventId`
- `DELETE /api/v1/events/:eventId`

### Equipements

- `GET /api/v1/events/:eventId/items`
- `POST /api/v1/events/:eventId/items`
- `GET /api/v1/items/:itemId`
- `PATCH /api/v1/items/:itemId`
- `DELETE /api/v1/items/:itemId`
- `POST /api/v1/items/:itemId/scans`
- `POST /api/v1/items/:itemId/movements`
- `POST /api/v1/items/:itemId/transfers`
- `POST /api/v1/items/:itemId/maintenance`

### Anomalies geolocalisees

- `GET /api/v1/events/:eventId/anomalies`
- `POST /api/v1/events/:eventId/anomalies`
- `PATCH /api/v1/anomalies/:anomalyId`

### Taches terrain

- `GET /api/v1/events/:eventId/tasks`
- `POST /api/v1/events/:eventId/tasks`
- `GET /api/v1/users/:assigneeId/tasks`
- `PATCH /api/v1/tasks/:taskId`

### Livraisons et feuilles de route

- `GET /api/v1/events/:eventId/deliveries`
- `POST /api/v1/events/:eventId/deliveries`
- `PATCH /api/v1/deliveries/:deliveryId`
- `POST /api/v1/deliveries/:deliveryId/route-sheet-validations`

### Pilotage, monitoring et notifications

- `GET /api/v1/events/:eventId/dashboard`
- `POST /api/v1/monitoring/metrics`
- `GET /api/v1/events/:eventId/monitoring/metrics`
- `POST /api/v1/notifications`
- `GET /api/v1/users/:recipientId/notifications`
- `PATCH /api/v1/users/:recipientId/notifications/:notificationId/read`

### Synchronisation offline-first

- `POST /api/v1/sync`

Le endpoint de synchronisation applique des operations offline sur les items via `expectedOfflineVersion`. Si la version ne correspond plus a celle en base, l'API renvoie `409 Conflict` avec les operations en conflit.

## Codes HTTP

- `200 OK` : lecture ou modification reussie
- `201 Created` : creation reussie
- `204 No Content` : suppression reussie
- `400 Bad Request` : identifiant invalide
- `401 Unauthorized` : token manquant ou invalide
- `403 Forbidden` : role insuffisant
- `404 Not Found` : ressource introuvable
- `409 Conflict` : conflit de synchronisation offline
- `422 Unprocessable Entity` : validation d'entree echouee
