import { unstable_cache } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { Product } from "@/models/Product";
import { Blog } from "@/models/Blog";
import { Content } from "@/models/Content";

// ─── Products ────────────────────────────────────────────────────────────────
// Revalidates every 60 seconds. Tagged so the admin panel can call
// revalidateTag("products") after a save to bust it immediately.
export const getProducts = unstable_cache(
  async () => {
    await connectToDatabase();
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(products));
  },
  ["products"],
  { revalidate: 60, tags: ["products"] }
);

// ─── Bundles ─────────────────────────────────────────────────────────────────
export const getBundles = unstable_cache(
  async () => {
    await connectToDatabase();
    const { Bundle } = await import("@/models/Bundle");
    const bundles = await Bundle.find({ isActive: true })
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(bundles));
  },
  ["bundles"],
  { revalidate: 60, tags: ["bundles"] }
);

// ─── Blog posts ───────────────────────────────────────────────────────────────
export const getBlogPosts = unstable_cache(
  async () => {
    await connectToDatabase();
    const posts = await Blog.find({})
      .sort({ publishedAt: -1 })
      .lean();
    return JSON.parse(
      JSON.stringify(
        posts.map((post: any) => ({
          ...post,
          commentsCount: post.comments?.length || 0,
          comments: undefined,
        }))
      )
    );
  },
  ["blog-posts"],
  { revalidate: 60, tags: ["blog-posts"] }
);

// ─── CMS page content ─────────────────────────────────────────────────────────
// Each page key ("shop", "blog", "bundles", "story", etc.) gets its own cache
// entry. Tagged so admin saves can call revalidateTag("content-shop") etc.
export function getPageContent(key: string) {
  return unstable_cache(
    async () => {
      await connectToDatabase();
      const content = await Content.findOne({ key: key.toLowerCase() }).lean();
      if (!content) return null;
      return JSON.parse(JSON.stringify(content));
    },
    [`content-${key}`],
    { revalidate: 60, tags: [`content-${key}`] }
  )();
}
