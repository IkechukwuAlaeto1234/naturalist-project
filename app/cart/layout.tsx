import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Cart | Naturalist",
  description: "Review your Naturalist cart before checkout.",
  openGraph: {
    title: "Shopping Cart | Naturalist",
    description: "Review your Naturalist cart.",
  },
};

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
