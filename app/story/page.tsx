import { Metadata } from "next";
import { getPageContent } from "@/lib/fetchers";
import StoryClient from "@/components/story/StoryClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Our Story | Naturalist",
  description: "Built on the belief that pure is powerful — and that skin deserves honesty. The Naturalist origin story.",
  openGraph: {
    title: "Our Story | Naturalist",
    description: "Built on the belief that pure is powerful — and that skin deserves honesty. The Naturalist origin story.",
    url: "https://naturalist-project.onrender.com/story",
    siteName: "Naturalist",
    type: "website",
    images: [
      {
        url: "https://naturalist-project.onrender.com/og-default.jpg?v=2",
        width: 1200,
        height: 630,
        alt: "Our Story | Naturalist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story | Naturalist",
    description: "Built on the belief that pure is powerful — and that skin deserves honesty. The Naturalist origin story.",
    images: ["https://naturalist-project.onrender.com/og-default.jpg?v=2"],
  },
};

export default async function StoryPage() {
  const pageContent = await getPageContent("story");

  return <StoryClient pageContent={pageContent?.metadata ?? {}} />;
}
