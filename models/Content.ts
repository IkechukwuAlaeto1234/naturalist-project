import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContentVersion {
  metadata: Record<string, any>;
  title: string;
  body: string;
  savedAt: Date;
  savedBy?: string;
  note?: string;
}

export interface IContent extends Document {
  key: string;
  title: string;
  body: string;
  images: string[];
  metadata: Record<string, any>;
  versions: IContentVersion[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ContentVersionSchema = new Schema<IContentVersion>(
  {
    metadata: { type: Schema.Types.Mixed, default: {} },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    savedAt: { type: Date, required: true },
    savedBy: { type: String },
    note: { type: String },
  },
  { _id: true }
);

const ContentSchema = new Schema<IContent>(
  {
    key: {
      type: String,
      required: [true, "Content key is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    body: {
      type: String,
      default: "",
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    versions: {
      type: [ContentVersionSchema],
      default: [],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Content: Model<IContent> =
  mongoose.models.Content || mongoose.model<IContent>("Content", ContentSchema);

export default Content;
