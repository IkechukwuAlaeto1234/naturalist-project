import type { Metadata } from "next";
import { Suspense } from "react";
import OrderTrackContent from "./OrderTrackContent";

export const metadata: Metadata = {
  title: "Track Your Order | Naturalist",
  description: "Real-time tracking for your Naturalist order.",
};

export default function OrderTrackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-2 border-[#e2dacd] border-t-[#b07e3a] animate-spin" />
      </div>
    }>
      <OrderTrackContent />
    </Suspense>
  );
}
