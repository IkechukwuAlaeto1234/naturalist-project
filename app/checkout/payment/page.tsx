import type { Metadata } from "next";
import PaymentContentWrapper from "./PaymentContent";

export const metadata: Metadata = {
  title: "Payment | Naturalist",
};

export default function PaymentPage() {
  return <PaymentContentWrapper />;
}
