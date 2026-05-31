import type { Metadata } from "next";
import OrderConfirmationContentWrapper from "./OrderConfirmationContent";

export const metadata: Metadata = {
  title: "Order Confirmed | Naturalist",
};

export default function OrderConfirmationPage() {
  return <OrderConfirmationContentWrapper />;
}
