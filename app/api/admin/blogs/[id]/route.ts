import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";
import { auth } from "@/lib/auth";

// PUT /api/admin/blogs/[id]
// Update a blog post
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { title, excerpt, coverImage, coverImageAlt, authorName, authorRole, readTime, tags, featured, sections } = body;

    await connectToDatabase();

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    // Update fields
    if (title && title !== blog.title) {
      blog.title = title;
      // Update slug as well
      const slug = title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      
      const collision = await Blog.findOne({ slug, _id: { $ne: id } });
      if (collision) {
        return NextResponse.json({ error: "Another blog post with this title/slug already exists!" }, { status: 400 });
      }
      blog.slug = slug;
    }

    if (excerpt) blog.excerpt = excerpt;
    if (coverImage) blog.coverImage = coverImage;
    if (coverImageAlt !== undefined) blog.coverImageAlt = coverImageAlt;
    if (authorName) blog.authorName = authorName;
    if (authorRole !== undefined) blog.authorRole = authorRole;
    if (readTime) blog.readTime = readTime;
    if (tags) blog.tags = tags;
    if (featured !== undefined) blog.featured = featured;
    if (sections) blog.sections = sections;

    await blog.save();
    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error("PUT admin blog error:", error);
    return NextResponse.json({ error: "Failed to update blog post" }, { status: 500 });
  }
}

// DELETE /api/admin/blogs/[id]
// Delete a blog post
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await connectToDatabase();

    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog post deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE admin blog error:", error);
    return NextResponse.json({ error: "Failed to delete blog post" }, { status: 500 });
  }
}
