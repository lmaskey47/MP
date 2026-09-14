import { z } from "zod";
import { AnomalySeverity, AnomalyStatus } from "../models/anomaly.model";
import { DeliveryStatus } from "../models/delivery.model";
import { EventStatus } from "../models/event.model";
import { ItemStatus } from "../models/item.model";
import { TaskStatus } from "../models/task.model";
import { UserRole } from "../models/user.model";

const point = z.object({
  type: z.literal("Point"),
  coordinates: z.tuple([z.number().gte(-180).lte(180), z.number().gte(-90).lte(90)])
});

const polygon = z.object({
  type: z.literal("Polygon"),
  coordinates: z.array(z.array(z.tuple([z.number().gte(-180).lte(180), z.number().gte(-90).lte(90)])).min(4).refine(r=>r[0][0]===r[r.length-1][0]&&r[0][1]===r[r.length-1][1], 'Le contour doit être fermé')).min(1)
});

export class Schemas {
  public static readonly register = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.nativeEnum(UserRole),
    eventIds: z.array(z.string()).default([])
  });

  public static readonly login = z.object({
    email: z.string().email(),
    password: z.string().min(1)
  });

  public static readonly eventCreate = z.object({
    name: z.string().min(2),
    description: z.string().optional(),
    status: z.nativeEnum(EventStatus).optional(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    location: point,
    zones: z.array(z.object({
      code: z.string().min(1),
      label: z.string().min(1),
      kind: z.enum(["storage", "delivery", "maintenance", "public", "restricted"]),
      boundary: polygon
    })).default([])
  });

  public static readonly eventPatch = Schemas.eventCreate.partial();

  public static readonly itemCreate = z.object({
    qrCode: z.string().min(1),
    label: z.string().min(1),
    category: z.string().min(1),
    status: z.nativeEnum(ItemStatus).optional(),
    zoneCode: z.string().optional(),
    responsibleUserId: z.string().optional(),
    carbonKg: z.number().min(0).default(0)
  });

  public static readonly itemPatch = Schemas.itemCreate.partial();

  public static readonly scan = z.object({
    actorId: z.string(),
    location: point.optional(),
    details: z.record(z.string(), z.unknown()).optional()
  });

  public static readonly move = z.object({
    actorId: z.string(),
    toZone: z.string().min(1),
    location: point.optional()
  });

  public static readonly transfer = z.object({
    actorId: z.string(),
    responsibleUserId: z.string()
  });

  public static readonly maintenance = z.object({
    actorId: z.string(),
    details: z.record(z.string(), z.unknown()).optional()
  });

  public static readonly anomalyCreate = z.object({
    itemId: z.string(),
    reporterId: z.string(),
    severity: z.nativeEnum(AnomalySeverity),
    message: z.string().min(1),
    location: point
  });

  public static readonly anomalyPatch = z.object({
    status: z.nativeEnum(AnomalyStatus)
  });

  public static readonly taskCreate = z.object({
    assigneeId: z.string(),
    title: z.string().min(1),
    description: z.string().optional(),
    zoneCode: z.string().optional(),
    itemIds: z.array(z.string()).default([]),
    status: z.nativeEnum(TaskStatus).optional(),
    dueAt: z.coerce.date().optional()
  });

  public static readonly taskPatch = Schemas.taskCreate.partial();

  public static readonly deliveryCreate = z.object({
    carrierId: z.string(),
    itemIds: z.array(z.string()).default([]),
    status: z.nativeEnum(DeliveryStatus).optional(),
    stops: z.array(z.object({
      zoneCode: z.string().min(1),
      plannedAt: z.coerce.date(),
      validatedAt: z.coerce.date().optional(),
      location: point.optional()
    })).default([])
  });

  public static readonly deliveryPatch = Schemas.deliveryCreate.partial().extend({
    routeSheetValidated: z.boolean().optional()
  });

  public static readonly notificationCreate = z.object({
    eventId: z.string(),
    recipientId: z.string(),
    title: z.string().min(1),
    message: z.string().min(1),
    critical: z.boolean().default(false)
  });

  public static readonly metricCreate = z.object({
    eventId: z.string(),
    source: z.string().min(1),
    name: z.enum(["api_latency_ms", "scan_count", "sync_conflict_count", "carbon_kg"]),
    value: z.number(),
    capturedAt: z.coerce.date().optional()
  });

  public static readonly sync = z.object({
    operations: z.array(z.object({
      clientOperationId: z.string().min(1),
      itemId: z.string(),
      expectedOfflineVersion: z.number().int().min(0),
      action: z.enum(["scanned", "moved", "transferred", "maintenance"]),
      actorId: z.string(),
      payload: z.record(z.string(), z.unknown()).default({})
    })).min(1)
  });
}
