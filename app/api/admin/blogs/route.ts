import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { auth } from "@/lib/auth";

// GET /api/admin/blogs
// Fetch all blogs (Admin only)
export async function GET() {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    return NextResponse.json(blogs, { status: 200 });
  } catch (error) {
    console.error("GET admin blogs error:", error);
    return NextResponse.json({ error: "Failed to retrieve blogs" }, { status: 500 });
  }
}

// POST /api/admin/blogs
// Create a new blog post with dynamic sections!
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { title, excerpt, coverImage, coverImageAlt, authorName, authorRole, readTime, tags, featured, sections } = body;

    if (!title || !excerpt || !coverImage || !authorName || !readTime) {
      return NextResponse.json({ error: "Title, excerpt, coverImage, authorName and readTime are required fields" }, { status: 400 });
    }

    await connectToDatabase();

    // Auto-generate slug from title
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Check slug collision
    const existing = await Blog.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "A blog post with this title/slug already exists!" }, { status: 400 });
    }

    const newBlog = await Blog.create({
      title,
      slug,
      excerpt,
      coverImage,
      coverImageAlt: coverImageAlt || "",
      authorName,
      authorRole: authorRole || "Naturalist Editor",
      readTime,
      tags: tags || [],
      featured: featured || false,
      sections: sections || [],
      publishedAt: new Date(),
    });

    return NextResponse.json(newBlog, { status: 201 });
  } catch (error) {
    console.error("POST admin blog error:", error);
    return NextResponse.json({ error: "Failed to create blog post" }, { status: 500 });
  }
}
