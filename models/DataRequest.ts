import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDataRequest extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  status: "pending" | "approved" | "completed";
  downloadUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DataRequestSchema = new Schema<IDataRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "completed"],
      default: "pending",
    },
    downloadUrl: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

export const DataRequest: Model<IDataRequest> =
  mongoose.models.DataRequest || mongoose.model<IDataRequest>("DataRequest", DataRequestSchema);

export default DataRequest;
