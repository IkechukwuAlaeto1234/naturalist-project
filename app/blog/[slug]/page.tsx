import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, ArrowLeft } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";
import BlogShare from "@/components/blog/BlogShare";

// Format: May 31, 2026, 08:29 AM
function formatDateTime(date: string | Date) {
  const d = new Date(date);
  const dateFormatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const timeFormatted = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateFormatted}, ${timeFormatted}`;
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

  const post: any = await Blog.findOne({ slug }).lean();
  if (!post) notFound();

  const publishedAt = formatDateTime(post.publishedAt);

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground transition-colors duration-300">
      <article className="mx-auto max-w-7xl px-6 sm:px-8 py-10 sm:py-14 pb-32">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Blog
          </Link>

          <header className="mt-5 text-center space-y-6">
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

            {/* Upgraded Premium Pill-Style Metadata Section */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-3">
              {/* Author Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#2d4c38]/5 dark:bg-emerald-500/5 border border-[#2d4c38]/10 dark:border-emerald-500/10 text-xs font-bold text-[#2d4c38] dark:text-emerald-400">
                <span className="h-5 w-5 rounded-full bg-[#2d4c38] dark:bg-[#2d4c38] text-white flex items-center justify-center font-serif text-[10px] font-black uppercase shadow-sm flex-shrink-0">
                  {post.authorName?.[0]?.toUpperCase() || "N"}
                </span>
                <span className="font-bold">{post.authorName}</span>
                <span className="text-[9px] opacity-70 font-black px-2 py-0.5 rounded-full bg-[#2d4c38]/10 dark:bg-[#2d4c38]/20 uppercase tracking-wider">
                  {post.authorRole || "Naturalist Editorial Writer"}
                </span>
              </div>

              {/* Date Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 text-xs font-bold text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-[#b07e3a]" />
                <span className="font-bold">{publishedAt}</span>
              </div>
            </div>
          </header>

          {/* Cover Image Semantic Figure Wrap */}
          <figure className="mt-10 overflow-hidden rounded-[32px] border border-border/40 bg-[#f8f5ef] dark:bg-[#111a14] shadow-[0_24px_70px_rgba(20,31,25,0.08)]">
            <div className="relative aspect-[16/9]">
              <img
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <figcaption className="px-6 py-4 bg-[#fcfbfa] dark:bg-[#0f1411] border-t border-border/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Cover: {post.coverImageAlt || post.title}</span>
              <span className="text-[#b07e3a]">Botanical Editorial</span>
            </figcaption>
          </figure>

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
                    <figure className="overflow-hidden rounded-[28px] border border-border/40 bg-muted shadow-sm">
                      <img
                        src={section.image}
                        alt={section.imageAlt || section.heading || post.title}
                        className="h-full w-full object-cover"
                      />
                      {section.imageAlt && (
                        <figcaption className="px-5 py-3.5 bg-white dark:bg-[#0c100e] border-t border-border/40 text-[10px] font-semibold tracking-wider text-muted-foreground">
                          {section.imageAlt}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </section>
              ))}

              {/* Custom Social Share Section (Comments removed entirely) */}
              <div className="pt-6">
                <BlogShare title={post.title} excerpt={post.excerpt} />
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <div className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">About the Writer</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:text-emerald-400 font-black font-serif text-xl flex-shrink-0">
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
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground border-b border-border/10 pb-3">Article Details</p>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published</span>
                    <span className="text-sm font-black text-[#2d4c38] dark:text-emerald-400">{publishedAt}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Writer Role</span>
                    <span className="text-xs font-black text-foreground">{post.authorRole || "Naturalist Editorial Writer"}</span>
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