import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await req.json();
    const name = String(body?.name || "").trim();
    const message = String(body?.message || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (name.length < 2) {
      return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
    }
    if (!message) {
      return NextResponse.json({ error: "Please write a comment." }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "Comment must be at least 10 characters." }, { status: 400 });
    }

    await connectToDatabase();

    const blog = await Blog.findOne({ slug });
    if (!blog) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 });
    }

    blog.comments.push({ name, message, createdAt: new Date() });
    await blog.save();

    const latestComment = blog.comments[blog.comments.length - 1];

    return NextResponse.json(
      { message: "Comment posted successfully", comment: latestComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST blog comment error:", error);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}