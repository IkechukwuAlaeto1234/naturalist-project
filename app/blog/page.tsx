import { Metadata } from "next";
import { getBlogPosts, getPageContent } from "@/lib/fetchers";
import BlogIndex from "@/components/blog/BlogIndex";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Journal | Naturalist",
  description: "Naturalist Journal — stories, rituals, and skincare guidance from the brand team.",
  openGraph: {
    title: "Journal | Naturalist",
    description: "Naturalist Journal — stories, rituals, and skincare guidance from the brand team.",
    url: "https://naturalist-project.onrender.com/blog",
    siteName: "Naturalist",
    type: "website",
    images: [
      {
        url: "https://naturalist-project.onrender.com/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Journal | Naturalist",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Journal | Naturalist",
    description: "Naturalist Journal — stories, rituals, and skincare guidance from the brand team.",
    images: ["https://naturalist-project.onrender.com/og-default.jpg"],
  },
};

export default async function BlogPage() {
  const [posts, pageContent] = await Promise.all([
    getBlogPosts(),
    getPageContent("blog"),
  ]);

  return (
    <BlogIndex
      initialPosts={posts}
      pageContent={pageContent?.metadata ?? {}}
    />
  );
}
