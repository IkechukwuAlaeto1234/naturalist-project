import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sustainability & Refund Policy | Naturalist",
  description: "Our commitment to the planet — zero-waste packaging, ethical sourcing, carbon offset initiatives, and our complete refund policy.",
  openGraph: {
    title: "Sustainability | Naturalist",
    description: "Our commitment to the planet and our complete refund policy.",
  },
};

export default function SustainabilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
