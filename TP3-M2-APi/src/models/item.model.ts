import { Schema, model, type Model } from "mongoose";
import type { BaseDocument, GeoPoint } from "./base.model";

export enum ItemStatus {
  Available = "available",
  InTransit = "in_transit",
  Delivered = "delivered",
  Maintenance = "maintenance",
  Lost = "lost",
  Damaged = "damaged"
}

export interface ItemHistoryEntry {
  action: "created" | "scanned" | "moved" | "transferred" | "maintenance" | "anomaly";
  at: Date;
  actorId: string;
  location?: GeoPoint;
  fromZone?: string;
  toZone?: string;
  details?: Record<string, unknown>;
}

export interface ItemDocument extends BaseDocument {
  eventId: string;
  qrCode: string;
  label: string;
  category: string;
  status: ItemStatus;
  zoneCode?: string;
  responsibleUserId?: string;
  carbonKg: number;
  history: ItemHistoryEntry[];
  offlineVersion: number;
  mobileOperations: string[];
}

const geoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: {
      type: [Number],
      required: true,
      validate: [(value: number[]) => value.length === 2, "Point must contain longitude and latitude"]
    }
  },
  { _id: false }
);

const historySchema = new Schema(
  {
    action: { type: String, enum: ["created", "scanned", "moved", "transferred", "maintenance", "anomaly"], required: true },
    at: { type: Date, default: Date.now },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    location: geoPointSchema,
    fromZone: { type: String, uppercase: true, trim: true },
    toZone: { type: String, uppercase: true, trim: true },
    details: { type: Schema.Types.Mixed }
  },
  { _id: false }
);

const itemSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    qrCode: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: { type: String, enum: Object.values(ItemStatus), default: ItemStatus.Available },
    zoneCode: { type: String, uppercase: true, trim: true },
    responsibleUserId: { type: Schema.Types.ObjectId, ref: "User" },
    carbonKg: { type: Number, min: 0, default: 0 },
    history: { type: [historySchema], default: [] },
    offlineVersion: { type: Number, default: 0, min: 0 }
    ,mobileOperations: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: "version" }
);

itemSchema.index({ eventId: 1, qrCode: 1 }, { unique: true });
itemSchema.index({ eventId: 1, status: 1, zoneCode: 1 });
itemSchema.index({ responsibleUserId: 1, status: 1 }, { partialFilterExpression: { responsibleUserId: { $exists: true } } });
itemSchema.index({ "history.location": "2dsphere" });

export const ItemModel: Model<ItemDocument> = model<ItemDocument>("Item", itemSchema);
