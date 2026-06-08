import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContactReply {
  sender: string; // "admin" | name
  message: string;
  sentAt: Date;
}

export interface IContact extends Document {
  name: string;
  email: string;
  topic: string;
  otherTopic?: string;
  message: string;
  ticketId: string;
  status: "open" | "replied" | "closed";
  replies: IContactReply[];
  createdAt: Date;
  updatedAt: Date;
}

const ContactReplySchema = new Schema<IContactReply>(
  {
    sender:  { type: String, required: true },
    message: { type: String, required: true },
    sentAt:  { type: Date,   default: Date.now },
  },
  { _id: false }
);

const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
    },
    otherTopic: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    ticketId: {
      type: String,
      unique: true,
      sparse: true,
    },
    status: {
      type: String,
      enum: ["open", "replied", "closed"],
      default: "open",
    },
    replies: {
      type: [ContactReplySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/* Auto-generate ticketId before saving if missing */
ContactSchema.pre("save", function () {
  if (!this.ticketId) {
    const hash = Math.floor(1000 + Math.random() * 9000);
    this.ticketId = `NAT-${hash}`;
  }
});

export const Contact: Model<IContact> =
  mongoose.models.Contact || mongoose.model<IContact>("Contact", ContactSchema);

export default Contact;