import { Schema, model, type Model } from "mongoose";
import type { BaseDocument } from "./base.model";

export enum UserRole {
  Admin = "admin",
  LogisticManager = "logistic_manager",
  FieldAgent = "field_agent",
  Provider = "provider"
}

export interface UserDocument extends BaseDocument {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  eventIds: string[];
  active: boolean;
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), required: true },
    eventIds: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    active: { type: Boolean, default: true }
  },
  { timestamps: true, versionKey: "version" }
);

userSchema.index({ role: 1, active: 1 });

export const UserModel: Model<UserDocument> = model<UserDocument>("User", userSchema);
