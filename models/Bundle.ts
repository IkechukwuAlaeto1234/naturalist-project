import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBundle extends Document {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  products: mongoose.Types.ObjectId[];
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BundleSchema = new Schema<IBundle>(
  {
    name: {
      type: String,
      required: [true, "Bundle name is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    compareAtPrice: {
      type: Number,
      min: [0, "Compare price cannot be negative"],
    },
    images: {
      type: [String],
      required: [true, "At least one image is required"],
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Bundle must contain at least one product"],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-validate slug generation
BundleSchema.pre("validate", function (next: any) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  next();
});

export const Bundle: Model<IBundle> =
  mongoose.models.Bundle || mongoose.model<IBundle>("Bundle", BundleSchema);

export default Bundle;
