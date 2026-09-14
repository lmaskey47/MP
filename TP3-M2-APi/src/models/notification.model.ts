import { Schema, model, type Model } from "mongoose";
import type { BaseDocument } from "./base.model";

export interface NotificationDocument extends BaseDocument {
  eventId: string;
  recipientId: string;
  title: string;
  message: string;
  critical: boolean;
  readAt?: Date;
}

const notificationSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    critical: { type: Boolean, default: false },
    readAt: Date
  },
  { timestamps: true, versionKey: "version" }
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel: Model<NotificationDocument> = model<NotificationDocument>("Notification", notificationSchema);
