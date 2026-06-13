import mongoose, { Schema, Document, Model } from "mongoose";

export interface IChatAttachment {
  type: "image" | "pdf" | "text";
  name: string;
  url: string;
  publicId?: string;
  size?: number;
  contentSnippet?: string;
}

export interface ISupportChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: IChatAttachment[];
  timestamp: Date;
  senderName: string;
}

export interface ISupportChatSession extends Document {
  sessionId: string;
  userId?: mongoose.Types.ObjectId;
  name?: string;
  email?: string;
  status: "active" | "resolved";
  mode: "ai" | "human";
  messages: ISupportChatMessage[];
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatAttachmentSchema = new Schema<IChatAttachment>(
  {
    type: { type: String, required: true, enum: ["image", "pdf", "text"] },
    name: { type: String, required: true },
    url: { type: String, required: true },
    publicId: { type: String },
    size: { type: Number },
    contentSnippet: { type: String },
  },
  { _id: false }
);

const SupportChatMessageSchema = new Schema<ISupportChatMessage>(
  {
    role: { type: String, required: true, enum: ["user", "assistant", "system"] },
    content: { type: String, required: true },
    attachments: { type: [ChatAttachmentSchema], default: [] },
    timestamp: { type: Date, default: Date.now },
    senderName: { type: String, required: true },
  },
  { _id: false }
);

const SupportChatSessionSchema = new Schema<ISupportChatSession>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
    email: { type: String },
    status: { type: String, required: true, enum: ["active", "resolved"], default: "active" },
    mode: { type: String, required: true, enum: ["ai", "human"], default: "ai" },
    messages: { type: [SupportChatMessageSchema], default: [] },
    rating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  },
  {
    timestamps: true,
  }
);

export const SupportChat: Model<ISupportChatSession> =
  mongoose.models.SupportChat || mongoose.model<ISupportChatSession>("SupportChat", SupportChatSessionSchema);

export default SupportChat;
