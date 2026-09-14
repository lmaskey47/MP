import { Schema, model, type Model } from "mongoose";
import type { BaseDocument, GeoPoint } from "./base.model";

export enum DeliveryStatus {
  Planned = "planned",
  InTransit = "in_transit",
  Delivered = "delivered",
  Cancelled = "cancelled"
}

export interface DeliveryStop {
  zoneCode: string;
  plannedAt: Date;
  validatedAt?: Date;
  location?: GeoPoint;
}

export interface DeliveryDocument extends BaseDocument {
  eventId: string;
  carrierId: string;
  itemIds: string[];
  status: DeliveryStatus;
  routeSheetValidated: boolean;
  stops: DeliveryStop[];
  mobileOperations: string[];
}

const geoPointSchema = new Schema<GeoPoint>(
  {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const stopSchema = new Schema(
  {
    zoneCode: { type: String, required: true, uppercase: true, trim: true },
    plannedAt: { type: Date, required: true },
    validatedAt: Date,
    location: geoPointSchema
  },
  { _id: false }
);

const deliverySchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    carrierId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    itemIds: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    status: { type: String, enum: Object.values(DeliveryStatus), default: DeliveryStatus.Planned },
    routeSheetValidated: { type: Boolean, default: false },
    stops: { type: [stopSchema], default: [] }
    ,mobileOperations: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: "version" }
);

deliverySchema.index({ eventId: 1, status: 1 });
deliverySchema.index({ carrierId: 1, status: 1 });
deliverySchema.index({ "stops.location": "2dsphere" });

export const DeliveryModel: Model<DeliveryDocument> = model<DeliveryDocument>("Delivery", deliverySchema);
