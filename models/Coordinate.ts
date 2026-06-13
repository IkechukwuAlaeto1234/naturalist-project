import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICoordinate extends Document {
  query: string; // e.g. "pretoria, south africa"
  lat: number;
  lng: number;
  label: string;
  createdAt: Date;
}

const CoordinateSchema = new Schema<ICoordinate>(
  {
    query: { type: String, required: true, unique: true, index: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    label: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Coordinate: Model<ICoordinate> =
  mongoose.models.Coordinate || mongoose.model<ICoordinate>("Coordinate", CoordinateSchema);

export default Coordinate;
