import { Schema, model, type Model } from "mongoose";
import type { BaseDocument } from "./base.model";

export interface MonitoringMetricDocument extends BaseDocument {
  capturedAt: Date;
  metadata: {
    eventId: string;
    source: string;
  };
  name: "api_latency_ms" | "scan_count" | "sync_conflict_count" | "carbon_kg";
  value: number;
}

const monitoringMetricSchema = new Schema<MonitoringMetricDocument>(
  {
    capturedAt: { type: Date, required: true, default: Date.now },
    metadata: {
      eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
      source: { type: String, required: true, trim: true }
    },
    name: { type: String, enum: ["api_latency_ms", "scan_count", "sync_conflict_count", "carbon_kg"], required: true },
    value: { type: Number, required: true }
  },
  { collection: "monitoringmetrics", versionKey: false }
);

monitoringMetricSchema.index({ "metadata.eventId": 1, capturedAt: -1 });

export const MonitoringMetricModel: Model<MonitoringMetricDocument> = model<MonitoringMetricDocument>(
  "MonitoringMetric",
  monitoringMetricSchema
);
