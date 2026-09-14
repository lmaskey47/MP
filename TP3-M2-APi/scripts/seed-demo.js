const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const { UserModel } = require("../dist/models/user.model");
const { EventModel } = require("../dist/models/event.model");
const { ItemModel, ItemStatus } = require("../dist/models/item.model");
const { TaskModel, TaskStatus } = require("../dist/models/task.model");
const { DeliveryModel, DeliveryStatus } = require("../dist/models/delivery.model");
const { AnomalyModel, AnomalySeverity, AnomalyStatus } = require("../dist/models/anomaly.model");
const { NotificationModel } = require("../dist/models/notification.model");
const { MonitoringMetricModel } = require("../dist/models/monitoringMetric.model");

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/logichain";

const ids = {
  event: oid("64a000000000000000000001"),
  admin: oid("64a000000000000000000101"),
  manager: oid("64a000000000000000000102"),
  agent: oid("64a000000000000000000103"),
  provider: oid("64a000000000000000000104"),
  itemGenerator: oid("64a000000000000000000201"),
  itemBarrier: oid("64a000000000000000000202"),
  itemRadio: oid("64a000000000000000000203"),
  itemLight: oid("64a000000000000000000204"),
  taskCheckStock: oid("64a000000000000000000301"),
  taskMoveLight: oid("64a000000000000000000302"),
  taskDelivery: oid("64a000000000000000000303"),
  deliveryMorning: oid("64a000000000000000000401"),
  deliveryEvening: oid("64a000000000000000000402"),
  anomalyGenerator: oid("64a000000000000000000501"),
  anomalyBarrier: oid("64a000000000000000000502"),
  notifCritical: oid("64a000000000000000000601"),
  notifTask: oid("64a000000000000000000602"),
  notifDelivery: oid("64a000000000000000000603")
};

function oid(value) {
  return new mongoose.Types.ObjectId(value);
}

async function ensureMonitoringCollection() {
  const db = mongoose.connection.db;
  const existing = await db.listCollections({ name: "monitoringmetrics" }).toArray();
  if (existing.length > 0) return;

  await db.createCollection("monitoringmetrics", {
    timeseries: {
      timeField: "capturedAt",
      metaField: "metadata",
      granularity: "minutes"
    }
  });
}

async function replaceById(Model, docs) {
  await Model.bulkWrite(
    docs.map((doc) => ({
      replaceOne: {
        filter: { _id: doc._id },
        replacement: doc,
        upsert: true
      }
    }))
  );
}

async function main() {
  await mongoose.connect(mongoUri);
  await ensureMonitoringCollection();

  const passwordHash = await bcrypt.hash("Password123", 12);
  const eventIds = [ids.event];

  await replaceById(UserModel, [
    {
      _id: ids.admin,
      name: "Admin Demo",
      email: "seed.admin@logichain.fr",
      passwordHash,
      role: "admin",
      eventIds,
      active: true
    },
    {
      _id: ids.manager,
      name: "Manager Logistique",
      email: "seed.manager@logichain.fr",
      passwordHash,
      role: "logistic_manager",
      eventIds,
      active: true
    },
    {
      _id: ids.agent,
      name: "Agent Terrain",
      email: "seed.agent@logichain.fr",
      passwordHash,
      role: "field_agent",
      eventIds,
      active: true
    },
    {
      _id: ids.provider,
      name: "Transporteur Demo",
      email: "seed.provider@logichain.fr",
      passwordHash,
      role: "provider",
      eventIds,
      active: true
    }
  ]);

  await replaceById(EventModel, [
    {
      _id: ids.event,
      name: "Festival GreenTech 2026",
      description: "Evenement demo pour tester LogiChain avec Swagger.",
      status: "active",
      startsAt: new Date("2026-07-10T08:00:00.000Z"),
      endsAt: new Date("2026-07-12T22:00:00.000Z"),
      location: point(2.3522, 48.8566),
      zones: [
        {
          code: "STOCK-A",
          label: "Zone stockage A",
          kind: "storage",
          boundary: polygon([[2.35, 48.85], [2.36, 48.85], [2.36, 48.86], [2.35, 48.86], [2.35, 48.85]])
        },
        {
          code: "DELIVERY-A",
          label: "Zone livraison A",
          kind: "delivery",
          boundary: polygon([[2.36, 48.85], [2.37, 48.85], [2.37, 48.86], [2.36, 48.86], [2.36, 48.85]])
        },
        {
          code: "MAINT-A",
          label: "Zone maintenance A",
          kind: "maintenance",
          boundary: polygon([[2.35, 48.86], [2.36, 48.86], [2.36, 48.87], [2.35, 48.87], [2.35, 48.86]])
        }
      ]
    }
  ]);

  await replaceById(ItemModel, [
    item(ids.itemGenerator, "SEED-EQ-001", "Groupe electrogene", "energie", ItemStatus.Available, "STOCK-A", ids.manager, 42, [
      history("created", ids.manager, "STOCK-A", { source: "seed" }),
      history("scanned", ids.agent, "STOCK-A", { source: "scan-demo" })
    ], 1),
    item(ids.itemBarrier, "SEED-EQ-002", "Barrieres securite", "securite", ItemStatus.Damaged, "MAINT-A", ids.agent, 8, [
      history("created", ids.manager, "STOCK-A", { source: "seed" }),
      history("anomaly", ids.agent, "MAINT-A", { severity: "high" })
    ], 2),
    item(ids.itemRadio, "SEED-EQ-003", "Talkies-walkies", "communication", ItemStatus.InTransit, "DELIVERY-A", ids.provider, 3, [
      history("created", ids.manager, "STOCK-A", { source: "seed" }),
      history("moved", ids.agent, "DELIVERY-A", { fromZone: "STOCK-A" })
    ], 2),
    item(ids.itemLight, "SEED-EQ-004", "Projecteurs LED", "lumiere", ItemStatus.Maintenance, "MAINT-A", ids.agent, 15, [
      history("created", ids.manager, "STOCK-A", { source: "seed" }),
      history("maintenance", ids.agent, "MAINT-A", { reason: "Controle preventif" })
    ], 1)
  ]);

  await replaceById(TaskModel, [
    {
      _id: ids.taskCheckStock,
      eventId: ids.event,
      assigneeId: ids.agent,
      title: "Verifier la zone STOCK-A",
      description: "Controler les equipements presents en zone stockage.",
      zoneCode: "STOCK-A",
      itemIds: [ids.itemGenerator, ids.itemBarrier],
      status: TaskStatus.InProgress,
      dueAt: new Date("2026-07-10T12:00:00.000Z")
    },
    {
      _id: ids.taskMoveLight,
      eventId: ids.event,
      assigneeId: ids.agent,
      title: "Envoyer les projecteurs en maintenance",
      description: "Deplacer et verifier les projecteurs LED.",
      zoneCode: "MAINT-A",
      itemIds: [ids.itemLight],
      status: TaskStatus.Planned,
      dueAt: new Date("2026-07-10T15:00:00.000Z")
    },
    {
      _id: ids.taskDelivery,
      eventId: ids.event,
      assigneeId: ids.provider,
      title: "Confirmer la livraison communication",
      description: "Valider l'arrivee des talkies-walkies.",
      zoneCode: "DELIVERY-A",
      itemIds: [ids.itemRadio],
      status: TaskStatus.Done,
      dueAt: new Date("2026-07-10T11:00:00.000Z")
    }
  ]);

  await replaceById(DeliveryModel, [
    {
      _id: ids.deliveryMorning,
      eventId: ids.event,
      carrierId: ids.provider,
      itemIds: [ids.itemRadio, ids.itemGenerator],
      status: DeliveryStatus.InTransit,
      routeSheetValidated: true,
      stops: [
        { zoneCode: "STOCK-A", plannedAt: new Date("2026-07-10T09:00:00.000Z"), validatedAt: new Date("2026-07-10T09:05:00.000Z"), location: point(2.3522, 48.8566) },
        { zoneCode: "DELIVERY-A", plannedAt: new Date("2026-07-10T10:30:00.000Z"), location: point(2.365, 48.855) }
      ]
    },
    {
      _id: ids.deliveryEvening,
      eventId: ids.event,
      carrierId: ids.provider,
      itemIds: [ids.itemLight],
      status: DeliveryStatus.Planned,
      routeSheetValidated: false,
      stops: [
        { zoneCode: "MAINT-A", plannedAt: new Date("2026-07-10T18:00:00.000Z"), location: point(2.355, 48.865) }
      ]
    }
  ]);

  await replaceById(AnomalyModel, [
    {
      _id: ids.anomalyGenerator,
      eventId: ids.event,
      itemId: ids.itemGenerator,
      reporterId: ids.agent,
      severity: AnomalySeverity.Medium,
      status: AnomalyStatus.Investigating,
      message: "Bruit anormal detecte pendant le test du groupe electrogene.",
      location: point(2.3522, 48.8566)
    },
    {
      _id: ids.anomalyBarrier,
      eventId: ids.event,
      itemId: ids.itemBarrier,
      reporterId: ids.agent,
      severity: AnomalySeverity.High,
      status: AnomalyStatus.Open,
      message: "Lot de barrieres endommage apres transport.",
      location: point(2.356, 48.864)
    }
  ]);

  await replaceById(NotificationModel, [
    {
      _id: ids.notifCritical,
      eventId: ids.event,
      recipientId: ids.manager,
      title: "Anomalie critique en attente",
      message: "Verifier le lot de barrieres en zone MAINT-A.",
      critical: true
    },
    {
      _id: ids.notifTask,
      eventId: ids.event,
      recipientId: ids.agent,
      title: "Tache assignee",
      message: "Controle de la zone STOCK-A a effectuer avant midi.",
      critical: false
    },
    {
      _id: ids.notifDelivery,
      eventId: ids.event,
      recipientId: ids.provider,
      title: "Livraison a confirmer",
      message: "Merci de confirmer la feuille de route du matin.",
      critical: false,
      readAt: new Date("2026-07-10T08:45:00.000Z")
    }
  ]);

  await MonitoringMetricModel.deleteMany({ "metadata.eventId": ids.event });
  await MonitoringMetricModel.insertMany([
    metric(ids.event, "api", "api_latency_ms", 126, "2026-07-10T08:00:00.000Z"),
    metric(ids.event, "mobile", "scan_count", 18, "2026-07-10T09:00:00.000Z"),
    metric(ids.event, "sync", "sync_conflict_count", 2, "2026-07-10T10:00:00.000Z"),
    metric(ids.event, "dashboard", "carbon_kg", 68, "2026-07-10T11:00:00.000Z")
  ]);

  console.log("Demo data inserted/updated successfully.");
  console.log("");
  console.log("Swagger login accounts, password: Password123");
  console.log("- seed.admin@logichain.fr");
  console.log("- seed.manager@logichain.fr");
  console.log("- seed.agent@logichain.fr");
  console.log("- seed.provider@logichain.fr");
  console.log("");
  console.log("Useful ids:");
  console.log(`eventId: ${ids.event}`);
  console.log(`adminId: ${ids.admin}`);
  console.log(`managerId: ${ids.manager}`);
  console.log(`agentId: ${ids.agent}`);
  console.log(`providerId: ${ids.provider}`);
  console.log(`itemGeneratorId: ${ids.itemGenerator}`);
  console.log(`itemBarrierId: ${ids.itemBarrier}`);
  console.log(`itemRadioId: ${ids.itemRadio}`);
  console.log(`itemLightId: ${ids.itemLight}`);
}

function point(longitude, latitude) {
  return { type: "Point", coordinates: [longitude, latitude] };
}

function polygon(points) {
  return { type: "Polygon", coordinates: [points] };
}

function history(action, actorId, zoneCode, details) {
  return {
    action,
    at: new Date(),
    actorId,
    location: point(2.3522, 48.8566),
    toZone: zoneCode,
    details
  };
}

function item(_id, qrCode, label, category, status, zoneCode, responsibleUserId, carbonKg, historyEntries, offlineVersion) {
  return {
    _id,
    eventId: ids.event,
    qrCode,
    label,
    category,
    status,
    zoneCode,
    responsibleUserId,
    carbonKg,
    history: historyEntries,
    offlineVersion
  };
}

function metric(eventId, source, name, value, capturedAt) {
  return {
    capturedAt: new Date(capturedAt),
    metadata: { eventId, source },
    name,
    value
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
