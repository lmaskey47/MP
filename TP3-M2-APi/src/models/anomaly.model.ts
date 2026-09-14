import { Schema, model, type Model } from "mongoose";
import type { BaseDocument, GeoPoint } from "./base.model";

export enum AnomalySeverity {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical"
}

export enum AnomalyStatus {
  Open = "open",
  Investigating = "investigating",
  Resolved = "resolved"
}

export interface AnomalyDocument extends BaseDocument {
  eventId: string;
  itemId: string;
  reporterId: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  message: string;
  location: GeoPoint;
}

const anomalySchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    severity: { type: String, enum: Object.values(AnomalySeverity), required: true },
    status: { type: String, enum: Object.values(AnomalyStatus), default: AnomalyStatus.Open },
    message: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ["Point"], required: true },
      coordinates: { type: [Number], required: true }
    }
  },
  { timestamps: true, versionKey: "version" }
);

anomalySchema.index({ location: "2dsphere" });
anomalySchema.index({ eventId: 1, status: 1, severity: 1 });

export const AnomalyModel: Model<AnomalyDocument> = model<AnomalyDocument>("Anomaly", anomalySchema);
