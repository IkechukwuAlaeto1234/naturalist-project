import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, ArrowLeft, MessageCircle } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Blog } from "@/models/Blog";
import BlogCommentForm from "@/components/blog/BlogCommentForm";

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  await connectToDatabase();
  const post = await Blog.findOne({ slug }).lean();

  if (!post) {
    return {
      title: "Blog Post Not Found | Naturalist",
    };
  }

  return {
    title: `${post.title} | Naturalist Blog`,
    description: post.excerpt,
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();
  const session = await auth();

  const post: any = await Blog.findOne({ slug }).lean();
  if (!post) notFound();

  const publishedAt = formatDate(post.publishedAt);

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground">
      <article className="mx-auto max-w-7xl px-6 sm:px-8 py-10 sm:py-14 pb-32">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Blog
          </Link>

          <header className="mt-5 text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-2">
              {post.tags?.map((tag: string) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-[#b07e3a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#b07e3a]">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95] text-[#2d4c38] dark:text-emerald-400">
              {post.title}
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <span>{post.authorName}</span>
              <span>{post.authorRole || "Naturalist Writer"}</span>
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5" />
                {publishedAt}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>
          </header>

          <div className="mt-10 overflow-hidden rounded-[32px] border border-border/40 bg-[#f8f5ef] dark:bg-[#111a14] shadow-[0_24px_70px_rgba(20,31,25,0.08)]">
            <div className="relative aspect-[16/9]">
              <img
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <div className="space-y-10">
              {post.sections?.map((section: any, index: number) => (
                <section key={`${section.heading || index}`} className="space-y-5">
                  {section.heading && (
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4]">
                      {section.heading}
                    </h2>
                  )}
                  <p className="text-sm sm:text-base leading-8 text-muted-foreground">
                    {section.body}
                  </p>
                  {section.image && (
                    <div className="overflow-hidden rounded-[28px] border border-border/40 bg-muted shadow-sm">
                      <img
                        src={section.image}
                        alt={section.imageAlt || section.heading || post.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </section>
              ))}

              <section className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <MessageCircle className="h-4 w-4 text-[#2d4c38] dark:text-emerald-400" />
                  <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Comments</h2>
                </div>

                <div className="space-y-4">
                  {post.comments?.length ? (
                    [...post.comments].reverse().map((comment: any, index: number) => (
                      <div key={`${comment.name}-${index}`} className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-bold text-foreground">{comment.name}</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{comment.message}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No comments yet. Be the first to share a thought.</p>
                  )}
                </div>

                <div className="mt-6 border-t border-border/40 pt-6">
                  <BlogCommentForm slug={slug} defaultName={session?.user?.name || ""} />
                </div>
              </section>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <div className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">About the Writer</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:text-emerald-400 font-black font-serif text-xl">
                    {post.authorName?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">{post.authorRole || "Naturalist Writer"}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Curated editorial stories, ingredient spotlights, and ritual guidance for readers who want calm, modern skincare direction.
                </p>
              </div>

              <div className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">Article Details</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Published</span>
                    <span className="font-semibold text-foreground text-right">{publishedAt}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Read Time</span>
                    <span className="font-semibold text-foreground">{post.readTime}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">Comments</span>
                    <span className="font-semibold text-foreground">{post.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}