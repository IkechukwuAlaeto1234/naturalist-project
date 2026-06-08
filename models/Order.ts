import mongoose, { Schema, Document, Model } from "mongoose";

export interface IOrderItem {
  product?: mongoose.Types.ObjectId;
  bundle?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface IShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface IStatusEvent {
  status: string;
  note: string;
  timestamp: Date;
  location?: string;
}

export interface IRouteWaypoint {
  lat: number;
  lng: number;
  label: string;
}

export interface IOrder extends Document {
  orderNumber?: string;
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentStatus: "pending" | "paid" | "failed";
  shippingStatus: "pending" | "processing" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";
  paymentMethod: string;
  stripeSessionId?: string;
  totalAmount: number;
  // Tracking fields
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  statusHistory: IStatusEvent[];
  routeWaypoints: IRouteWaypoint[];
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  bundle: {
    type: Schema.Types.ObjectId,
    ref: "Bundle",
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
});

const ShippingAddressSchema = new Schema<IShippingAddress>({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  phone: { type: String, required: true },
});

const StatusEventSchema = new Schema<IStatusEvent>({
  status:    { type: String, required: true },
  note:      { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  location:  { type: String },
}, { _id: false });

const RouteWaypointSchema = new Schema<IRouteWaypoint>({
  lat:   { type: Number, required: true },
  lng:   { type: Number, required: true },
  label: { type: String, required: true },
}, { _id: false });

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
      sparse: true, // allows null/undefined without unique collision
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [OrderItemSchema],
    shippingAddress: ShippingAddressSchema,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    shippingStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      default: "stripe",
    },
    stripeSessionId: {
      type: String,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, "Total amount cannot be negative"],
    },
    // ── Tracking fields ───────────────────────────────────────────
    trackingNumber:   { type: String },
    carrier:          { type: String },
    estimatedDelivery:{ type: Date },
    statusHistory:    { type: [StatusEventSchema], default: [] },
    routeWaypoints:   { type: [RouteWaypointSchema], default: [] },
  },
  {
    timestamps: true,
  }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
