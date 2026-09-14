import {mobilePaths} from './mobile';
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "LogiChain API",
    version: "1.0.0",
    description: "API REST LogiChain pour la gestion logistique evenementielle, MongoDB et mode offline-first."
  },
  servers: [
    {
      url: "http://127.0.0.1:3000/api/v1",
      description: "Local"
    }
  ],
  tags: [
    { name: "Auth" },
    { name: "Events" },
    { name: "Items" },
    { name: "Anomalies" },
    { name: "Tasks" },
    { name: "Deliveries" },
    { name: "Dashboard" },
    { name: "Notifications" },
    { name: "Monitoring" },
    { name: "Sync" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      GeoPoint: {
        type: "object",
        required: ["type", "coordinates"],
        properties: {
          type: { type: "string", enum: ["Point"], example: "Point" },
          coordinates: {
            type: "array",
            minItems: 2,
            maxItems: 2,
            items: { type: "number" },
            example: [2.3522, 48.8566]
          }
        }
      },
      GeoPolygon: {
        type: "object",
        required: ["type", "coordinates"],
        properties: {
          type: { type: "string", enum: ["Polygon"], example: "Polygon" },
          coordinates: {
            type: "array",
            example: [[
              [2.35, 48.85],
              [2.36, 48.85],
              [2.36, 48.86],
              [2.35, 48.86],
              [2.35, 48.85]
            ]]
          }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password", "role"],
        description: "Pour creer plusieurs comptes de test, changer l'email a chaque essai afin d'eviter l'erreur 409.",
        properties: {
          name: { type: "string", example: "Admin LogiChain" },
          email: { type: "string", example: "admin.demo@logichain.fr" },
          password: { type: "string", example: "Password123" },
          role: { type: "string", enum: ["admin", "logistic_manager", "field_agent", "provider"], example: "admin" },
          eventIds: { type: "array", items: { type: "string" }, example: [] }
        }
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin.demo@logichain.fr" },
          password: { type: "string", example: "Password123" }
        }
      },
      EventRequest: {
        type: "object",
        required: ["name", "startsAt", "endsAt", "location"],
        properties: {
          name: { type: "string", example: "Festival GreenTech" },
          description: { type: "string", example: "Evenement eco-responsable" },
          status: { type: "string", enum: ["draft", "active", "closed"], example: "active" },
          startsAt: { type: "string", format: "date-time", example: "2026-07-10T08:00:00.000Z" },
          endsAt: { type: "string", format: "date-time", example: "2026-07-12T22:00:00.000Z" },
          location: { $ref: "#/components/schemas/GeoPoint" },
          zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                code: { type: "string", example: "STOCK-A" },
                label: { type: "string", example: "Zone stockage A" },
                kind: { type: "string", enum: ["storage", "delivery", "maintenance", "public", "restricted"], example: "storage" },
                boundary: { $ref: "#/components/schemas/GeoPolygon" }
              }
            }
          }
        }
      },
      ItemRequest: {
        type: "object",
        required: ["qrCode", "label", "category"],
        properties: {
          qrCode: { type: "string", example: "EQ-001" },
          label: { type: "string", example: "Groupe electrogene" },
          category: { type: "string", example: "energie" },
          status: { type: "string", enum: ["available", "in_transit", "delivered", "maintenance", "lost", "damaged"], example: "available" },
          zoneCode: { type: "string", example: "STOCK-A" },
          responsibleUserId: { type: "string" },
          carbonKg: { type: "number", example: 42 }
        }
      },
      ScanRequest: {
        type: "object",
        required: ["actorId"],
        properties: {
          actorId: { type: "string" },
          location: { $ref: "#/components/schemas/GeoPoint" },
          details: { type: "object", example: { source: "swagger-demo" } }
        }
      },
      MoveRequest: {
        type: "object",
        required: ["actorId", "toZone"],
        properties: {
          actorId: { type: "string" },
          toZone: { type: "string", example: "DELIVERY-A" },
          location: { $ref: "#/components/schemas/GeoPoint" }
        }
      },
      TransferRequest: {
        type: "object",
        required: ["actorId", "responsibleUserId"],
        properties: {
          actorId: { type: "string" },
          responsibleUserId: { type: "string" }
        }
      },
      MaintenanceRequest: {
        type: "object",
        required: ["actorId"],
        properties: {
          actorId: { type: "string" },
          details: { type: "object", example: { reason: "Controle preventif" } }
        }
      },
      AnomalyRequest: {
        type: "object",
        required: ["itemId", "reporterId", "severity", "message", "location"],
        properties: {
          itemId: { type: "string" },
          reporterId: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high", "critical"], example: "high" },
          message: { type: "string", example: "Materiel endommage pendant le transport" },
          location: { $ref: "#/components/schemas/GeoPoint" }
        }
      },
      TaskRequest: {
        type: "object",
        required: ["assigneeId", "title"],
        properties: {
          assigneeId: { type: "string" },
          title: { type: "string", example: "Verifier zone STOCK-A" },
          description: { type: "string" },
          zoneCode: { type: "string", example: "STOCK-A" },
          itemIds: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["planned", "in_progress", "done", "blocked"], example: "planned" },
          dueAt: { type: "string", format: "date-time" }
        }
      },
      DeliveryRequest: {
        type: "object",
        required: ["carrierId"],
        properties: {
          carrierId: { type: "string" },
          itemIds: { type: "array", items: { type: "string" } },
          status: { type: "string", enum: ["planned", "in_transit", "delivered", "cancelled"], example: "planned" },
          stops: {
            type: "array",
            items: {
              type: "object",
              properties: {
                zoneCode: { type: "string", example: "STOCK-A" },
                plannedAt: { type: "string", format: "date-time", example: "2026-07-10T10:00:00.000Z" },
                location: { $ref: "#/components/schemas/GeoPoint" }
              }
            }
          }
        }
      },
      NotificationRequest: {
        type: "object",
        required: ["eventId", "recipientId", "title", "message"],
        properties: {
          eventId: { type: "string" },
          recipientId: { type: "string" },
          title: { type: "string", example: "Urgence secteur A" },
          message: { type: "string", example: "Modification de livraison immediate" },
          critical: { type: "boolean", example: true }
        }
      },
      MetricRequest: {
        type: "object",
        required: ["eventId", "source", "name", "value"],
        properties: {
          eventId: { type: "string" },
          source: { type: "string", example: "api" },
          name: { type: "string", enum: ["api_latency_ms", "scan_count", "sync_conflict_count", "carbon_kg"], example: "scan_count" },
          value: { type: "number", example: 12 }
        }
      },
      SyncRequest: {
        type: "object",
        required: ["operations"],
        properties: {
          operations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clientOperationId: { type: "string", example: "op-001" },
                itemId: { type: "string" },
                expectedOfflineVersion: { type: "integer", example: 0 },
                action: { type: "string", enum: ["scanned", "moved", "transferred", "maintenance"], example: "scanned" },
                actorId: { type: "string" },
                payload: { type: "object", example: { source: "offline-device-1" } }
              }
            }
          }
        }
      }
    }
  },
  paths: {
    ...mobilePaths,
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Creer un utilisateur et recuperer un token JWT",
        description: "Si l'API renvoie 409, l'email existe deja : utiliser un autre email ou faire /auth/login avec le compte existant.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } } },
        responses: { "201": { description: "Utilisateur cree" }, "409": { description: "Email deja utilise" }, "422": { description: "Erreur de validation" } }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Connexion utilisateur",
        description: "Apres connexion, copier uniquement la valeur du champ token dans Authorize. Ne pas ajouter Bearer, Swagger l'ajoute automatiquement.",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } } },
        responses: { "200": { description: "Token JWT" }, "401": { description: "Identifiants invalides" } }
      }
    },
    "/events": {
      get: { tags: ["Events"], summary: "Lister les evenements", security: [{ bearerAuth: [] }], responses: { "200": { description: "OK" } } },
      post: {
        tags: ["Events"],
        summary: "Creer un evenement",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EventRequest" } } } },
        responses: { "201": { description: "Cree" } }
      }
    },
    "/events/{eventId}": {
      get: { tags: ["Events"], summary: "Lire un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      put: { tags: ["Events"], summary: "Remplacer un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EventRequest" } } } }, responses: { "200": { description: "OK" } } },
      patch: { tags: ["Events"], summary: "Modifier un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/EventRequest" } } } }, responses: { "200": { description: "OK" } } },
      delete: { tags: ["Events"], summary: "Supprimer un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprime" } } }
    },
    "/events/{eventId}/items": {
      get: { tags: ["Items"], summary: "Lister les equipements d'un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Items"], summary: "Creer un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ItemRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/items/{itemId}": {
      get: { tags: ["Items"], summary: "Lire un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      patch: { tags: ["Items"], summary: "Modifier un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ItemRequest" } } } }, responses: { "200": { description: "OK" } } },
      delete: { tags: ["Items"], summary: "Supprimer un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], responses: { "204": { description: "Supprime" } } }
    },
    "/items/{itemId}/scans": {
      post: { tags: ["Items"], summary: "Scanner un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ScanRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/items/{itemId}/movements": {
      post: { tags: ["Items"], summary: "Deplacer un equipement", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MoveRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/items/{itemId}/transfers": {
      post: { tags: ["Items"], summary: "Transferer la responsabilite", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TransferRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/items/{itemId}/maintenance": {
      post: { tags: ["Items"], summary: "Declarer une maintenance", security: [{ bearerAuth: [] }], parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MaintenanceRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/events/{eventId}/anomalies": {
      get: { tags: ["Anomalies"], summary: "Lister les anomalies", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Anomalies"], summary: "Declarer une anomalie geolocalisee", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/AnomalyRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/anomalies/{anomalyId}": {
      patch: { tags: ["Anomalies"], summary: "Modifier le statut d'une anomalie", security: [{ bearerAuth: [] }], parameters: [{ name: "anomalyId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", properties: { status: { type: "string", enum: ["open", "investigating", "resolved"] } } } } } }, responses: { "200": { description: "OK" } } }
    },
    "/events/{eventId}/tasks": {
      get: { tags: ["Tasks"], summary: "Lister les taches", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Tasks"], summary: "Creer une tache", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TaskRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/users/{assigneeId}/tasks": {
      get: { tags: ["Tasks"], summary: "Lister les taches assignees", security: [{ bearerAuth: [] }], parameters: [{ name: "assigneeId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/tasks/{taskId}": {
      patch: { tags: ["Tasks"], summary: "Modifier une tache", security: [{ bearerAuth: [] }], parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/TaskRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/events/{eventId}/deliveries": {
      get: { tags: ["Deliveries"], summary: "Lister les livraisons", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } },
      post: { tags: ["Deliveries"], summary: "Creer une livraison", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/deliveries/{deliveryId}": {
      patch: { tags: ["Deliveries"], summary: "Modifier une livraison", security: [{ bearerAuth: [] }], parameters: [{ name: "deliveryId", in: "path", required: true, schema: { type: "string" } }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeliveryRequest" } } } }, responses: { "200": { description: "OK" } } }
    },
    "/deliveries/{deliveryId}/route-sheet-validations": {
      post: { tags: ["Deliveries"], summary: "Valider une feuille de route", security: [{ bearerAuth: [] }], parameters: [{ name: "deliveryId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/events/{eventId}/dashboard": {
      get: { tags: ["Dashboard"], summary: "Obtenir les KPI", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/notifications": {
      post: { tags: ["Notifications"], summary: "Envoyer une notification", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/NotificationRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/users/{recipientId}/notifications": {
      get: { tags: ["Notifications"], summary: "Lister les notifications non lues", security: [{ bearerAuth: [] }], parameters: [{ name: "recipientId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/users/{recipientId}/notifications/{notificationId}/read": {
      patch: { tags: ["Notifications"], summary: "Marquer une notification comme lue", security: [{ bearerAuth: [] }], parameters: [{ name: "recipientId", in: "path", required: true, schema: { type: "string" } }, { name: "notificationId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/monitoring/metrics": {
      post: { tags: ["Monitoring"], summary: "Enregistrer une metrique time series", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MetricRequest" } } } }, responses: { "201": { description: "Cree" } } }
    },
    "/events/{eventId}/monitoring/metrics": {
      get: { tags: ["Monitoring"], summary: "Lister les metriques d'un evenement", security: [{ bearerAuth: [] }], parameters: [{ name: "eventId", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "OK" } } }
    },
    "/sync": {
      post: { tags: ["Sync"], summary: "Synchroniser les operations offline", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SyncRequest" } } } }, responses: { "200": { description: "Operations appliquees" }, "409": { description: "Conflit de version offline" } } }
    }
  }
} as const;
