import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    return NextResponse.json(blog, { status: 200 });
  } catch (error) {
    console.error("GET blog error:", error);
    return NextResponse.json({ error: "Failed to retrieve blog post" }, { status: 500 });
  }
}