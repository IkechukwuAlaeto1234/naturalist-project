import { Metadata } from "next";
import { getBlogPosts, getPageContent } from "@/lib/fetchers";
import BlogIndex from "@/components/blog/BlogIndex";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Journal | Naturalist",
  description: "Naturalist Journal — stories, rituals, and skincare guidance from the brand team.",
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
