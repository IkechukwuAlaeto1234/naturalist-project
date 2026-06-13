import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  // Use dynamic imports to prevent hoisting before dotenv.config runs
  const { connectToDatabase } = await import("../lib/db");
  const { Blog } = await import("../models/Blog");

  console.log("Connecting to database...");
  await connectToDatabase();
  console.log("Fetching blogs...");
  const blogs = await Blog.find({}).lean();
  console.log(`Found ${blogs.length} blogs:`);
  for (const blog of blogs) {
    console.log("---------------------------------------");
    console.log(`Title: ${blog.title}`);
    console.log(`Slug: ${blog.slug}`);
    console.log(`PublishedAt: ${blog.publishedAt} (${typeof blog.publishedAt})`);
    console.log(`CoverImage: ${blog.coverImage}`);
    console.log(`Excerpt: ${blog.excerpt}`);
    try {
      if (blog.publishedAt) {
        console.log(`ISO string: ${new Date(blog.publishedAt).toISOString()}`);
      } else {
        console.log("PublishedAt is empty/missing.");
      }
    } catch (e: any) {
      console.log(`ERROR parsing publishedAt: ${e.message}`);
    }
  }
  process.exit(0);
}

main().catch(err => {
  console.error("Main execution failed:", err);
  process.exit(1);
});
