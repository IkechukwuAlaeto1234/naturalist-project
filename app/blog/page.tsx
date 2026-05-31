import Link from "next/link";
import { Metadata } from "next";
import { ArrowRight, CalendarDays, Clock3, MessageCircle } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";

export const metadata: Metadata = {
  title: "Blog | Naturalist",
  description: "Naturalist Journal stories, rituals, and skincare guidance from the brand team.",
};

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default async function BlogPage() {
  await connectToDatabase();
  const posts = await Blog.find({}).sort({ publishedAt: -1 }).lean();
  const featured = posts[0];
  const remaining = posts.slice(1);

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground">
      <section className="px-6 sm:px-8 pt-12 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full bg-[#b07e3a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] text-[#b07e3a]">
              Naturalist Journal
            </span>
            <h1 className="mt-4 font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95] text-[#2d4c38] dark:text-emerald-400">
              Rituals, ingredients, and the stories behind the skin care.
            </h1>
            <p className="mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              Fresh editorial notes from the Naturalist team, designed for readers who want practical rituals, thoughtful ingredients, and a calm, modern reading experience.
            </p>
          </div>

          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="mt-10 grid overflow-hidden rounded-[32px] border border-border/40 bg-[#f8f5ef] dark:bg-[#111a14] shadow-[0_24px_70px_rgba(20,31,25,0.08)] transition-transform duration-300 hover:-translate-y-1 md:grid-cols-12"
            >
              <div className="relative md:col-span-6 min-h-[280px]">
                <img
                  src={featured.coverImage}
                  alt={featured.coverImageAlt || featured.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="md:col-span-6 p-7 sm:p-10 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {featured.tags?.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2d4c38] dark:text-emerald-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#141f19] dark:text-[#f4f6f4]">
                    {featured.title}
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
                    {featured.excerpt}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(featured.publishedAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock3 className="h-3.5 w-3.5" />
                    {featured.readTime}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {featured.comments?.length || 0} comments
                  </span>
                </div>
              </div>
            </Link>
          )}

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {remaining.map((post: any) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {post.tags?.slice(0, 2).map((tag: string) => (
                      <span key={tag} className="inline-flex rounded-full bg-[#2d4c38]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#2d4c38] dark:text-emerald-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-serif text-2xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] group-hover:text-[#2d4c38] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>{post.authorName}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="mt-10 rounded-[28px] border border-dashed border-border/40 p-10 text-center text-sm text-muted-foreground">
              No blog posts have been seeded yet.
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted">
              Back to Home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}