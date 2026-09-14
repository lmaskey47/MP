import { Schema, model, type Model } from "mongoose";
import type { BaseDocument } from "./base.model";

export enum TaskStatus {
  Planned = "planned",
  InProgress = "in_progress",
  Done = "done",
  Blocked = "blocked"
}

export interface TaskDocument extends BaseDocument {
  eventId: string;
  assigneeId: string;
  title: string;
  description?: string;
  zoneCode?: string;
  itemIds: string[];
  status: TaskStatus;
  dueAt?: Date;
  mobileOperations: string[];
}

const taskSchema = new Schema(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    zoneCode: { type: String, uppercase: true, trim: true },
    itemIds: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    status: { type: String, enum: Object.values(TaskStatus), default: TaskStatus.Planned },
    dueAt: Date
    ,mobileOperations: { type: [String], default: [] }
  },
  { timestamps: true, versionKey: "version" }
);

taskSchema.index({ eventId: 1, status: 1, dueAt: 1 });
taskSchema.index({ assigneeId: 1, status: 1 });

export const TaskModel: Model<TaskDocument> = model<TaskDocument>("Task", taskSchema);
