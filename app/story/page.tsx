import { Metadata } from "next";
import { getPageContent } from "@/lib/fetchers";
import StoryClient from "@/components/story/StoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our Story | Naturalist",
  description: "Built on the belief that pure is powerful — and that skin deserves honesty. The Naturalist origin story.",
};

export default async function StoryPage() {
  const pageContent = await getPageContent("story");

  return <StoryClient pageContent={pageContent?.metadata ?? {}} />;
}
