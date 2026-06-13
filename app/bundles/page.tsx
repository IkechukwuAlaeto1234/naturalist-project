import { Metadata } from "next";
import { getBundles, getPageContent } from "@/lib/fetchers";
import BundlesClient from "@/components/store/BundlesClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ritual Bundles | Naturalist",
  description: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.",
  openGraph: {
    title: "Ritual Bundles | Naturalist",
    description: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.",
    url: "https://naturalist-project.onrender.com/bundles",
    siteName: "Naturalist",
    type: "website",
    images: [
      {
        url: "https://naturalist-project.onrender.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Ritual Bundles | Naturalist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ritual Bundles | Naturalist",
    description: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.",
    images: ["https://naturalist-project.onrender.com/og-default.jpg"],
  },
};

export default async function BundlesPage() {
  const [bundles, pageContent] = await Promise.all([
    getBundles(),
    getPageContent("bundles"),
  ]);

  return (
    <BundlesClient
      initialBundles={bundles}
      pageContent={pageContent?.metadata ?? {}}
    />
  );
}
