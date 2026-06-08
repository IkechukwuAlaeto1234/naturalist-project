import type { Metadata } from "next";
import OrderTrackContent from "./OrderTrackContent";

export const metadata: Metadata = {
  title: "Track Your Order | Naturalist",
  description: "Real-time tracking for your Naturalist order.",
};

export default function OrderTrackPage() {
  return <OrderTrackContent />;
}
