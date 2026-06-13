import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAnnouncement extends Document {
  text: string;                        // The announcement copy (supports emoji)
  ctaLabel?: string;                   // Optional: "Shop Now" button text
  ctaUrl?: string;                     // Optional: url for the CTA
  type: "promo" | "info" | "alert" | "free-shipping"; // Determines badge colour
  isActive: boolean;                   // Soft toggle
  priority: number;                    // Display order (lower = higher priority)
  startsAt?: Date;                     // Scheduled start
  endsAt?: Date;                       // Scheduled expiry
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    text:     { type: String, required: true, trim: true },
    ctaLabel: { type: String, trim: true },
    ctaUrl:   { type: String, trim: true },
    type:     {
      type: String,
      enum: ["promo", "info", "alert", "free-shipping"],
      default: "promo",
    },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 0 },
    startsAt: { type: Date },
    endsAt:   { type: Date },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ||
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);

export default Announcement;
