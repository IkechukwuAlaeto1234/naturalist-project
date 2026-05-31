import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function GET() {
  try {
    await connectToDatabase();
    const blogs = await Blog.find({}).sort({ publishedAt: -1 }).lean();
    const response = blogs.map((blog: any) => ({
      ...blog,
      commentsCount: blog.comments?.length || 0,
      comments: undefined,
    }));

    return NextResponse.json(response, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("GET blogs error:", error);
    return NextResponse.json({ error: "Failed to retrieve blog posts" }, { status: 500 });
  }
}