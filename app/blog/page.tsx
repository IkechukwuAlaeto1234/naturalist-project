import { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";

export const metadata: Metadata = {
  title: "Blog | Naturalist",
  description: "Naturalist Journal stories, rituals, and skincare guidance from the brand team.",
};

export default async function BlogPage() {
  return <BlogIndex />;
}