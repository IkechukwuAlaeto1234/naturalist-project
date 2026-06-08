import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;       // short summary (shown in bell dropdown)
  body: string;          // required — rich HTML or structured JSON for detail page
  type: "order" | "system" | "promo" | "announcement" | "legal";
  read: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title:   { type: String, required: true },
    message: { type: String, required: true },
    body:    { type: String, required: true },
    type:    { type: String, enum: ["order", "system", "promo", "announcement", "legal"], default: "system" },
    read:    { type: Boolean, default: false },
    link:    { type: String },
  },
  { timestamps: true }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
