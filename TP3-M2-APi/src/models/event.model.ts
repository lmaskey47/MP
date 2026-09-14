import { Schema, model, type Model } from "mongoose";
import type { BaseDocument, GeoPoint, GeoPolygon } from "./base.model";

export enum EventStatus {
  Draft = "draft",
  Active = "active",
  Closed = "closed"
}

export interface EventZone {
  code: string;
  label: string;
  kind: "storage" | "delivery" | "maintenance" | "public" | "restricted";
  boundary: GeoPolygon;
}

export interface EventDocument extends BaseDocument {
  name: string;
  description?: string;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  location: GeoPoint;
  zones: EventZone[];
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

const geoPolygonSchema = new Schema<GeoPolygon>(
  {
    type: { type: String, enum: ["Polygon"], required: true },
    coordinates: { type: [[[Number]]], required: true }
  },
  { _id: false }
);

const zoneSchema = new Schema<EventZone>(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    label: { type: String, required: true, trim: true },
    kind: { type: String, enum: ["storage", "delivery", "maintenance", "public", "restricted"], required: true },
    boundary: { type: geoPolygonSchema, required: true }
  },
  { _id: false }
);

const eventSchema = new Schema<EventDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    description: { type: String, trim: true },
    status: { type: String, enum: Object.values(EventStatus), default: EventStatus.Draft },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    location: { type: geoPointSchema, required: true, index: "2dsphere" },
    zones: { type: [zoneSchema], default: [] }
  },
  { timestamps: true, versionKey: "version" }
);

eventSchema.index({ status: 1, startsAt: 1 });
eventSchema.index({ "zones.boundary": "2dsphere" });

export const EventModel: Model<EventDocument> = model<EventDocument>("Event", eventSchema);
