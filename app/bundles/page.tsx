import { Metadata } from "next";
import { getBundles, getPageContent } from "@/lib/fetchers";
import BundlesClient from "@/components/store/BundlesClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Ritual Bundles | Naturalist",
  description: "Complete skincare ceremonies, thoughtfully assembled for maximum botanical efficacy.",
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
