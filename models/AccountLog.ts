import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAccountLog extends Document {
  email: string;
  name: string;
  action: string; // "signup" | "suspend" | "delete" | "create_manual" | "password_change"
  details: string;
  ipAddress?: string;
  userAgent?: string;
  browser?: string;
  os?: string;
  deviceType?: string;
  createdAt: Date;
}

const AccountLogSchema = new Schema<IAccountLog>(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
    browser: { type: String },
    os: { type: String },
    deviceType: { type: String },
  },
  { timestamps: true }
);

export const AccountLog: Model<IAccountLog> =
  mongoose.models.AccountLog || mongoose.model<IAccountLog>("AccountLog", AccountLogSchema);

export default AccountLog;
