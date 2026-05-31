import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function GET() {
  try {
    await connectToDatabase();
    const blogs = await Blog.find({}).sort({ publishedAt: -1 }).select("-comments");
    return NextResponse.json(blogs, { status: 200 });
  } catch (error) {
    console.error("GET blogs error:", error);
    return NextResponse.json({ error: "Failed to retrieve blog posts" }, { status: 500 });
  }
}