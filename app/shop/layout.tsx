import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Shop | Naturalist",
  description: "Browse our full collection of premium organic skincare rituals — serums, oils, toners, and more.",
  openGraph: {
    title: "The Shop | Naturalist",
    description: "Browse our full collection of premium organic skincare rituals.",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
