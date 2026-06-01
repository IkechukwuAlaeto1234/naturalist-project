import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Naturalist",
  description: "Complete your secure Naturalist checkout.",
  openGraph: {
    title: "Checkout | Naturalist",
    description: "Complete your secure Naturalist checkout.",
  },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
