import type { Document, Types } from "mongoose";

export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type GeoPoint = {
  type: "Point";
  coordinates: [number, number];
};

export type GeoPolygon = {
  type: "Polygon";
  coordinates: [number, number][][];
};
