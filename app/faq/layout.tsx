import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | Naturalist",
  description: "Find answers to common questions about Naturalist products, ingredients, orders, shipping, returns, and skincare guidance.",
  openGraph: {
    title: "FAQ | Naturalist",
    description: "Find answers to common questions about Naturalist products, ingredients, orders, shipping, returns, and skincare guidance.",
  },
};

export default function FAQLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
