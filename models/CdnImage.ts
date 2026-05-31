import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICdnImage extends Document {
  url: string;
  publicId: string;
  originalName: string;
  sizeBytes?: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CdnImageSchema = new Schema<ICdnImage>(
  {
    url: {
      type: String,
      required: [true, "Image URL is required"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
    },
    sizeBytes: {
      type: Number,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const CdnImage: Model<ICdnImage> =
  mongoose.models.CdnImage || mongoose.model<ICdnImage>("CdnImage", CdnImageSchema);

export default CdnImage;
