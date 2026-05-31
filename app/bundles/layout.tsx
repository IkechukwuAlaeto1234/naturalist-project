import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ritual Bundles | Naturalist",
  description: "Curated ritual sets designed for complete skincare ceremonies. Save more when you shop our premium botanical bundles.",
  openGraph: {
    title: "Ritual Bundles | Naturalist",
    description: "Curated ritual sets designed for complete skincare ceremonies.",
  },
};

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
