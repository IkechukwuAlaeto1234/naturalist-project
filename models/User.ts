import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role: "user" | "admin";
  isVerified: boolean;
  isSuspended?: boolean;
  otp?: string;
  otpExpires?: Date;
  resetToken?: string;
  resetTokenExpires?: Date;
  secondaryEmail?: string;
  isSecondaryEmailVerified?: boolean;
  about?: string;
  pronouns?: string;
  website?: string;
  username?: string;
  settings?: Record<string, any>;
  sessions?: Array<{
    id: string;
    ipAddress: string;
    userAgent: string;
    browser: string;
    os: string;
    deviceType: string;
    lastActive: Date;
  }>;
  shippingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
    },
    image: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpires: {
      type: Date,
    },
    resetToken: {
      type: String,
    },
    resetTokenExpires: {
      type: Date,
    },
    secondaryEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    isSecondaryEmailVerified: {
      type: Boolean,
      default: false,
    },
    about: {
      type: String,
      trim: true,
      default: "",
    },
    pronouns: {
      type: String,
      trim: true,
      default: "",
    },
    website: {
      type: String,
      trim: true,
      default: "",
    },
    username: {
      type: String,
      trim: true,
      default: "",
    },
    settings: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    sessions: [
      {
        id: { type: String, required: true },
        ipAddress: { type: String, required: true },
        userAgent: { type: String, required: true },
        browser: { type: String, required: true },
        os: { type: String, required: true },
        deviceType: { type: String, required: true },
        lastActive: { type: Date, default: Date.now },
      },
    ],
    shippingAddress: {
      name: { type: String, trim: true },
      street: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      zip: { type: String, trim: true },
      country: { type: String, trim: true },
      phone: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent compiling model multiple times during Next.js hot-reloads
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
